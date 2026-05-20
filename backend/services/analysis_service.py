def analyze_splunk_events(events):
    """
    Splunk에서 가져온 structured events를 분석해서
    사람이 이해하기 쉬운 incident result로 바꾸는 함수.

    이 함수는 CSV 원본 데이터를 그대로 보여주는 게 아니라,
    event_type/status/resource 같은 값을 보고
    risk_level, incident_type, detected_patterns, evidence를 새로 만들어낸다.
    """

    # 1. 이벤트 종류별로 먼저 나누기
    # events 전체에서 login 실패 이벤트만 모음
    failed_logins = [
        event for event in events
        if event.get("event_type") == "login" and event.get("status") == "failed"
    ]

    # login 성공 이벤트만 모음
    successful_logins = [
        event for event in events
        if event.get("event_type") == "login" and event.get("status") == "success"
    ]

    # 민감 파일 접근 이벤트만 모음
    file_access_events = [
        event for event in events
        if event.get("event_type") == "file_access"
    ]

    # 권한 변경 이벤트만 모음
    permission_change_events = [
        event for event in events
        if event.get("event_type") == "permission_change"
    ]

    # scenario_2에서 새로 쓰는 이벤트: 계정 잠김
    account_lock_events = [
        event for event in events
        if event.get("event_type") == "account_lock"
    ]

    # scenario_2에서 새로 쓰는 이벤트: IP 차단
    ip_block_events = [
        event for event in events
        if event.get("event_type") == "ip_block"
    ]

    detected_patterns = []
    evidence = []

    # 2. failed login을 IP별로 묶기
    # 예:
    # {
    #   "185.43.22.10": [event1, event2, event3],
    #   "45.22.18.91": [event4, event5]
    # }
    failed_by_ip = {}

    for event in failed_logins:
        src_ip = event.get("src_ip")

        if src_ip not in failed_by_ip:
            failed_by_ip[src_ip] = []

        failed_by_ip[src_ip].append(event)

    suspicious_ips = []

    # 3. 같은 IP에서 로그인 실패가 3번 이상이면 suspicious로 판단
    for src_ip, attempts in failed_by_ip.items():
        if len(attempts) >= 3:
            suspicious_ips.append(src_ip)

            detected_patterns.append("Repeated failed logins from the same IP")

            evidence.append({
                "type": "repeated_failed_logins",
                "description": f"{len(attempts)} failed login attempts from {src_ip}",
                "events": attempts,
            })

    # 4. 반복 실패 후 성공 로그인 탐지
    # scenario_1에서 중요:
    # 같은 IP가 여러 번 실패한 뒤 성공하면 계정 탈취 가능성이 커짐
    for success_event in successful_logins:
        src_ip = success_event.get("src_ip")

        if src_ip in suspicious_ips:
            detected_patterns.append("Successful login after repeated failures")

            evidence.append({
                "type": "successful_login_after_failures",
                "description": f"Successful login from suspicious IP {src_ip}",
                "events": [success_event],
            })

    # 5. 민감 파일 접근 탐지
    if file_access_events:
        detected_patterns.append("Sensitive file access detected")

        evidence.append({
            "type": "sensitive_file_access",
            "description": "A sensitive student records file was accessed",
            "events": file_access_events,
        })

    # 6. 권한 변경 탐지
    if permission_change_events:
        detected_patterns.append("Permission change detected after suspicious activity")

        evidence.append({
            "type": "permission_change",
            "description": "File permissions were changed after suspicious activity",
            "events": permission_change_events,
        })

    # 7. 계정 잠김 탐지
    # scenario_2에서 중요:
    # 반복 실패 후 계정이 잠겼다는 것은 시스템이 방어 조치를 한 것
    if account_lock_events:
        detected_patterns.append("Account lock triggered after repeated failures")

        evidence.append({
            "type": "account_lock",
            "description": "The admin account was temporarily locked after repeated failed login attempts",
            "events": account_lock_events,
        })

    # 8. IP 차단 탐지
    # scenario_2에서 중요:
    # 공격 IP가 차단되었으므로 compromise까지 이어지지 않았다고 판단 가능
    if ip_block_events:
        detected_patterns.append("Source IP blocked by security policy")

        evidence.append({
            "type": "ip_block",
            "description": "The suspicious source IP was blocked by the security policy",
            "events": ip_block_events,
        })

    # 9. 어떤 scenario/incident인지 판단하기 위한 boolean 값들
    has_repeated_failures = len(suspicious_ips) > 0
    has_success_after_failures = any(
        event.get("src_ip") in suspicious_ips
        for event in successful_logins
    )
    has_sensitive_access = len(file_access_events) > 0
    has_permission_change = len(permission_change_events) > 0
    has_account_lock = len(account_lock_events) > 0
    has_ip_block = len(ip_block_events) > 0

    # 10. 최종 incident 판단
    # 순서가 중요함.
    # 더 구체적인 조건을 먼저 검사해야 함.

    # scenario_1:
    # 반복 실패 + 성공 로그인 + 민감 파일 접근 + 권한 변경
    if (
        has_repeated_failures
        and has_success_after_failures
        and has_sensitive_access
        and has_permission_change
    ):
        incident_type = "Possible Account Compromise with Sensitive Data Exposure"
        risk_level = "High"
        confidence = "Medium-High"
        summary = (
            "An external IP repeatedly attempted to log in to an admin account. "
            "After multiple failed attempts, the login succeeded. Soon after, "
            "a sensitive student records file was accessed and its permissions were changed."
        )
        recommended_actions = [
            "Reset the admin account password immediately.",
            "Review all activity from the suspicious source IP.",
            "Check whether the student records file was downloaded or shared.",
            "Revoke unnecessary file permissions.",
        ]
        threat_persona = {
            "name": "The Brute Forcer",
            "behavior": "Repeated login attempts followed by successful access",
            "intent": "Gain access to an admin account and reach sensitive data",
        }

    # scenario_2:
    # 반복 실패 + 계정 잠김 + IP 차단
    elif has_repeated_failures and has_account_lock and has_ip_block:
        incident_type = "Blocked Brute Force Attempt"
        risk_level = "Medium"
        confidence = "High"
        summary = (
            "An external IP repeatedly attempted to log in to the admin account. "
            "The system responded by locking the account and blocking the source IP. "
            "The attack attempt appears to have been contained before a successful compromise."
        )
        recommended_actions = [
            "Keep the blocked IP on the watchlist.",
            "Review whether the same IP targeted other accounts.",
            "Confirm that the admin account lock policy is working as expected.",
            "Consider enabling multi-factor authentication for administrator accounts.",
        ]
        threat_persona = {
            "name": "The Brute Forcer",
            "behavior": "Repeated failed login attempts against one account",
            "intent": "Guess or brute-force credentials",
        }

    # 반복 실패 + 성공 로그인까지만 있는 경우
    elif has_repeated_failures and has_success_after_failures:
        incident_type = "Suspicious Login Activity"
        risk_level = "Medium"
        confidence = "Medium"
        summary = (
            "A suspicious IP repeatedly failed to log in and later completed a successful login. "
            "No sensitive file access was detected in the current evidence, but the login sequence should be reviewed."
        )
        recommended_actions = [
            "Review the successful login session.",
            "Reset the affected account password.",
            "Check whether the source IP appears in other logs.",
        ]
        threat_persona = {
            "name": "The Sneaky Login",
            "behavior": "Failed attempts followed by a successful login",
            "intent": "Obtain account access without immediately triggering further alerts",
        }

    # 반복 실패만 있는 경우
    elif has_repeated_failures:
        incident_type = "Repeated Failed Login Attempts"
        risk_level = "Medium"
        confidence = "Medium"
        summary = (
            "Repeated failed login attempts were detected from the same source IP. "
            "There is no evidence of successful access in the current logs."
        )
        recommended_actions = [
            "Monitor the source IP for additional attempts.",
            "Check whether account lockout rules are enabled.",
            "Require stronger authentication for high-privilege accounts.",
        ]
        threat_persona = {
            "name": "The Brute Forcer",
            "behavior": "Repeated failed login attempts",
            "intent": "Guess account credentials",
        }

    # 민감 파일 접근만 있는 경우
    elif has_sensitive_access:
        incident_type = "Sensitive File Access"
        risk_level = "Medium"
        confidence = "Medium"
        summary = (
            "A sensitive file was accessed. The current logs do not show repeated failed logins, "
            "but the access should be reviewed because the resource may contain private data."
        )
        recommended_actions = [
            "Confirm whether the user was authorized to access the file.",
            "Review recent access history for the same resource.",
            "Check whether the file was downloaded or shared.",
        ]
        threat_persona = {
            "name": "The Data Snooper",
            "behavior": "Access to sensitive records",
            "intent": "View or collect private information",
        }

    # 위험 패턴이 거의 없는 경우
    else:
        incident_type = "No Major Incident Detected"
        risk_level = "Low"
        confidence = "Low"
        summary = (
            "No major suspicious incident was detected in the current logs. "
            "The activity appears limited or normal based on the current evidence."
        )
        recommended_actions = [
            "Continue monitoring for unusual activity.",
            "Keep authentication and access policies up to date.",
        ]
        threat_persona = {
            "name": "None",
            "behavior": "No clear attacker behavior detected",
            "intent": "Not applicable",
        }

    return {
        "incident_type": incident_type,
        "risk_level": risk_level,
        "confidence": confidence,
        "summary": summary,
        "detected_patterns": detected_patterns,
        "evidence_count": len(evidence),
        "evidence": evidence,
        "total_events_analyzed": len(events),
        "recommended_actions": recommended_actions,
        "threat_persona": threat_persona,
    }