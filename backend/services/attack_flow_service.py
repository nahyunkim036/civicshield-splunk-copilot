def build_attack_flow(events):
    """
    Splunk events를 React에서 시각화할 수 있는 attack flow 형태로 변환한다.

    backend가 event_type/status/src_ip/user/resource를 분석해서
    화면용 nodes/edges를 새로 만들어낸다.
    """

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

    account_lock_events = [
        event for event in events
        if event.get("event_type") == "account_lock"
    ]

    ip_block_events = [
        event for event in events
        if event.get("event_type") == "ip_block"
    ]

    nodes = []
    edges = []

    # 대표 IP 찾기
    source_ip = None
    if failed_logins:
        source_ip = failed_logins[0].get("src_ip")
    elif events:
        source_ip = events[0].get("src_ip")

    # 대표 user 찾기
    target_user = None
    if failed_logins:
        target_user = failed_logins[0].get("user")
    elif events:
        target_user = events[0].get("user")

    # 1. Source IP node
    if source_ip:
        nodes.append({
            "id": "source",
            "label": "External IP",
            "value": source_ip,
            "description": "Source address involved in the suspicious activity.",
            "severity": "medium",
        })

    # 2. Failed login node
    if failed_logins:
        nodes.append({
            "id": "failed_login",
            "label": "Failed Login Attempts",
            "value": f"{len(failed_logins)} failed attempts against {target_user}",
            "description": "Repeated failed login attempts may indicate credential guessing.",
            "severity": "warning",
        })

        if source_ip:
            edges.append({
                "from": "source",
                "to": "failed_login",
            })

    # 3. Successful login node
    if successful_logins:
        nodes.append({
            "id": "successful_login",
            "label": "Successful Login",
            "value": f"{target_user} login succeeded",
            "description": "A successful login occurred after suspicious failed attempts.",
            "severity": "high",
        })

        if failed_logins:
            edges.append({
                "from": "failed_login",
                "to": "successful_login",
            })

    # 4. Sensitive file access node
    if file_access_events:
        resource = file_access_events[0].get("resource")

        nodes.append({
            "id": "file_access",
            "label": "Sensitive File Access",
            "value": resource,
            "description": "A sensitive resource was accessed after suspicious login activity.",
            "severity": "high",
        })

        if successful_logins:
            edges.append({
                "from": "successful_login",
                "to": "file_access",
            })
        elif failed_logins:
            edges.append({
                "from": "failed_login",
                "to": "file_access",
            })

    # 5. Permission change node
    if permission_change_events:
        resource = permission_change_events[0].get("resource")

        nodes.append({
            "id": "permission_change",
            "label": "Permission Changed",
            "value": resource,
            "description": "File permissions were changed, which may increase exposure risk.",
            "severity": "high",
        })

        if file_access_events:
            edges.append({
                "from": "file_access",
                "to": "permission_change",
            })

    # 6. Account lock node
    if account_lock_events:
        nodes.append({
            "id": "account_lock",
            "label": "Account Locked",
            "value": f"{target_user} account temporarily locked",
            "description": "The system locked the account after repeated failed login attempts.",
            "severity": "medium",
        })

        if failed_logins:
            edges.append({
                "from": "failed_login",
                "to": "account_lock",
            })

    # 7. IP block node
    if ip_block_events:
        nodes.append({
            "id": "ip_block",
            "label": "IP Blocked",
            "value": f"{source_ip} blocked",
            "description": "The source IP was blocked by the security policy.",
            "severity": "resolved",
        })

        if account_lock_events:
            edges.append({
                "from": "account_lock",
                "to": "ip_block",
            })
        elif failed_logins:
            edges.append({
                "from": "failed_login",
                "to": "ip_block",
            })

    # flow title 결정
    if successful_logins and file_access_events and permission_change_events:
        flow_title = "Possible Admin Account Compromise"
        flow_summary = "A suspicious login sequence led to sensitive file access and permission changes."
    elif failed_logins and account_lock_events and ip_block_events:
        flow_title = "Blocked Brute Force Attempt"
        flow_summary = "Repeated login failures were contained by account lock and IP blocking."
    elif failed_logins:
        flow_title = "Repeated Failed Login Activity"
        flow_summary = "Multiple failed login attempts were detected from the same source."
    else:
        flow_title = "No Clear Attack Flow Detected"
        flow_summary = "The current logs do not form a clear attack sequence."

    return {
        "flow_title": flow_title,
        "flow_summary": flow_summary,
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
        "edge_count": len(edges),
    }