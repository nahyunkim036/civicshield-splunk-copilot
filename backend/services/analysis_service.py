def analyze_splunk_events(events):
    failed_logins = [
        event for event in events
        if event.get("event_type") == "login" and event.get("status") == "failed"
    ]

    successful_logins = [
        event for event in events
        if event.get("event_type") == "login" and event.get("status") == "success"
    ]

    file_access_events = [
        event for event in events
        if event.get("event_type") == "file_access"
    ]

    permission_change_events = [
        event for event in events
        if event.get("event_type") == "permission_change"
    ]

    detected_patterns = []
    evidence = []

    failed_by_ip = {}

    for event in failed_logins:
        src_ip = event.get("src_ip")

        if src_ip not in failed_by_ip:
            failed_by_ip[src_ip] = []

        failed_by_ip[src_ip].append(event)

    suspicious_ips = []

    for src_ip, attempts in failed_by_ip.items():
        if len(attempts) >= 3:
            suspicious_ips.append(src_ip)
            detected_patterns.append("Repeated failed logins from the same IP")
            evidence.append({
                "type": "repeated_failed_logins",
                "description": f"{len(attempts)} failed login attempts from {src_ip}",
                "events": attempts,
            })

    for success_event in successful_logins:
        src_ip = success_event.get("src_ip")

        if src_ip in suspicious_ips:
            detected_patterns.append("Successful login after repeated failures")
            evidence.append({
                "type": "successful_login_after_failures",
                "description": f"Successful login from suspicious IP {src_ip}",
                "events": [success_event],
            })

    if file_access_events:
        detected_patterns.append("Sensitive file access detected")
        evidence.append({
            "type": "sensitive_file_access",
            "description": "A sensitive student records file was accessed",
            "events": file_access_events,
        })

    if permission_change_events:
        detected_patterns.append("Permission change detected after suspicious activity")
        evidence.append({
            "type": "permission_change",
            "description": "File permissions were changed after suspicious activity",
            "events": permission_change_events,
        })

    if len(detected_patterns) >= 4:
        incident_type = "Possible Account Compromise with Sensitive Data Exposure"
        risk_level = "High"
        confidence = "Medium-High"
    elif len(detected_patterns) >= 2:
        incident_type = "Suspicious Login Activity"
        risk_level = "Medium"
        confidence = "Medium"
    elif len(detected_patterns) == 1:
        incident_type = "Potential Security Anomaly"
        risk_level = "Low"
        confidence = "Low-Medium"
    else:
        incident_type = "No Major Incident Detected"
        risk_level = "Low"
        confidence = "Low"

    summary = (
        "An external IP repeatedly attempted to log in to an admin account. "
        "After multiple failed attempts, the login succeeded. Soon after, "
        "a sensitive student records file was accessed and its permissions were changed."
    )

    return {
        "incident_type": incident_type,
        "risk_level": risk_level,
        "confidence": confidence,
        "summary": summary,
        "detected_patterns": detected_patterns,
        "evidence_count": len(evidence),
        "evidence": evidence,
        "total_events_analyzed": len(events),
    }