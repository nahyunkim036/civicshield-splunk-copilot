from collections import Counter


SEVERITY_SCORE = {
    "critical": 40,
    "high": 25,
    "medium": 10,
    "low": 3,
    "resolved": 0,
}


def _extract_time(timestamp):
    if not timestamp:
        return "--"

    parts = timestamp.split(" ")
    if len(parts) >= 2:
        return parts[1]

    return timestamp


def _first_value(events, key, default="unknown"):
    for event in events:
        value = event.get(key)
        if value:
            return value

    return default


def _severity_score(severity):
    return SEVERITY_SCORE.get(str(severity).lower(), 1)


def _get_risk_level(score):
    if score >= 70:
        return "Critical"
    if score >= 40:
        return "High"
    if score >= 20:
        return "Medium"
    return "Low"


def _get_risk_signal(event):
    event_type = event.get("event_type")
    file_path = event.get("file_path", "")
    status = event.get("status")

    if event_type == "package_loaded":
        return "supply_chain_entry"

    if event_type == "process_start":
        return "unexpected_execution"

    if event_type == "file_access" and "serviceaccount" in file_path:
        return "credential_access"

    if event_type == "network_connection" and status == "warning":
        return "external_c2_connection"

    if event_type == "privilege_escalation":
        return "privilege_escalation"

    if event_type == "quarantine":
        return "containment"

    if event_type == "network_policy":
        return "egress_block"

    if event_type == "audit":
        return "audit_record"

    return "other"


def _get_kill_chain_stage(event):
    event_type = event.get("event_type")
    file_path = event.get("file_path", "")

    if event_type == "package_loaded":
        return "Supply Chain Entry"

    if event_type == "process_start":
        return "Execution"

    if event_type == "file_access" and "serviceaccount" in file_path:
        return "Credential Access"

    if event_type == "network_connection":
        return "Command and Control"

    if event_type == "privilege_escalation":
        return "Privilege Escalation"

    if event_type == "quarantine":
        return "Containment"

    if event_type == "network_policy":
        return "Network Isolation"

    if event_type == "audit":
        return "Audit Trail"

    return "Other"


def _build_episode_summary(events):
    risk_signals = [_get_risk_signal(event) for event in events]
    raw_risk_score = sum(_severity_score(event.get("severity")) for event in events)
    risk_score = min(raw_risk_score, 100)
    risk_level = _get_risk_level(risk_score)

    has_credential_access = "credential_access" in risk_signals
    has_c2 = "external_c2_connection" in risk_signals
    has_privilege_escalation = "privilege_escalation" in risk_signals
    has_containment = "containment" in risk_signals
    has_egress_block = "egress_block" in risk_signals

    if has_credential_access and has_c2:
        episode_type = "Possible Supply Chain Exfiltration"
    elif has_privilege_escalation:
        episode_type = "Privilege Escalation Attempt"
    else:
        episode_type = "Suspicious Container Behavior"

    if has_containment and has_egress_block:
        containment = "Quarantined"
    elif has_containment:
        containment = "Partially Contained"
    else:
        containment = "Not Contained"

    severity_counts = Counter(event.get("severity", "unknown") for event in events)

    return {
        "episode_title": episode_type,
        "episode_type": episode_type,
        "environment": _first_value(events, "environment"),
        "service": _first_value(events, "service"),
        "namespace": _first_value(events, "namespace"),
        "pod": _first_value(events, "pod"),
        "image": _first_value(events, "image"),
        "package": _first_value(events, "package"),
        "src_ip": _first_value(events, "src_ip"),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "containment": containment,
        "event_count": len(events),
        "risk_signals": sorted(set(risk_signals)),
        "severity_counts": dict(severity_counts),
    }


def _build_attack_path(events):
    attack_path = []

    for index, event in enumerate(events, start=1):
        stage = _get_kill_chain_stage(event)
        risk_signal = _get_risk_signal(event)

        attack_path.append({
            "id": f"stage-{index}",
            "step": index,
            "time": _extract_time(event.get("timestamp")),
            "label": stage,
            "stage": stage,
            "event_type": event.get("event_type"),
            "risk_signal": risk_signal,
            "severity": event.get("severity", "medium"),
            "status": event.get("status"),
            "headline": _build_stage_headline(event, stage),
            "description": event.get("description", ""),
            "evidence": {
                "timestamp": event.get("timestamp"),
                "pod": event.get("pod"),
                "package": event.get("package"),
                "process": event.get("process"),
                "src_ip": event.get("src_ip"),
                "dest_ip": event.get("dest_ip"),
                "file_path": event.get("file_path"),
                "action": event.get("action"),
                "raw_description": event.get("description"),
            },
        })

    return attack_path


def _build_stage_headline(event, stage):
    event_type = event.get("event_type")

    if event_type == "package_loaded":
        return "Suspicious package entered runtime"

    if event_type == "process_start":
        return "Unexpected process executed"

    if event_type == "file_access":
        return "Service account token accessed"

    if event_type == "network_connection":
        return "Outbound connection to unapproved IP"

    if event_type == "privilege_escalation":
        return "Privilege escalation attempt blocked"

    if event_type == "quarantine":
        return "Pod quarantine executed"

    if event_type == "network_policy":
        return "Egress traffic blocked by policy"

    if event_type == "audit":
        return "Response action recorded"

    return stage


def _build_attack_edges(attack_path):
    edges = []

    for index in range(len(attack_path) - 1):
        edges.append({
            "from": attack_path[index]["id"],
            "to": attack_path[index + 1]["id"],
            "label": "next",
        })

    return edges


def _build_playbook(episode):
    pod = episode.get("pod")
    namespace = episode.get("namespace")
    package = episode.get("package")

    return [
        {
            "id": "quarantine_pod",
            "priority": 1,
            "action": "Quarantine Pod",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/quarantine",
            "status": "ready",
            "why": "Isolates the suspicious workload before it can continue exfiltration or privilege escalation.",
        },
        {
            "id": "apply_network_policy",
            "priority": 2,
            "action": "Apply Deny Egress NetworkPolicy",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/network-policy",
            "status": "ready",
            "why": "Blocks outbound traffic from the suspicious pod to prevent C2 communication.",
        },
        {
            "id": "rotate_service_account",
            "priority": 3,
            "action": "Rotate Service Account Token",
            "target": namespace,
            "namespace": namespace,
            "api": "/api/response/rotate-token",
            "status": "recommended",
            "why": "Credential access was observed, so the exposed token should be treated as compromised.",
        },
        {
            "id": "open_dependency_review",
            "priority": 4,
            "action": "Open Dependency Review",
            "target": package,
            "namespace": namespace,
            "api": "/api/response/dependency-review",
            "status": "recommended",
            "why": "The incident began with suspicious behavior from an open-source package.",
        },
    ]


def _build_architecture_map(episode, attack_path):
    """
    This is frontend-friendly data for an architecture map.
    Later, this can also mirror a Splunk Dashboard Studio architecture view.
    """
    package = episode.get("package")
    pod = episode.get("pod")
    service = episode.get("service")
    namespace = episode.get("namespace")

    has_c2 = any(item["risk_signal"] == "external_c2_connection" for item in attack_path)
    has_quarantine = any(item["event_type"] == "quarantine" for item in attack_path)

    nodes = [
        {
            "id": "package",
            "label": package,
            "type": "Open Source Package",
            "status": "warning",
        },
        {
            "id": "pod",
            "label": pod,
            "type": "Kubernetes Pod",
            "status": "critical" if not has_quarantine else "contained",
        },
        {
            "id": "service",
            "label": service,
            "type": "Service",
            "status": "warning",
        },
        {
            "id": "namespace",
            "label": namespace,
            "type": "Namespace",
            "status": "normal",
        },
        {
            "id": "external_ip",
            "label": "Unapproved External IP",
            "type": "External Destination",
            "status": "critical" if has_c2 else "normal",
        },
        {
            "id": "quarantine",
            "label": "Quarantine Policy",
            "type": "Response Control",
            "status": "contained" if has_quarantine else "ready",
        },
    ]

    edges = [
        {"from": "package", "to": "pod"},
        {"from": "pod", "to": "service"},
        {"from": "service", "to": "external_ip"},
        {"from": "pod", "to": "quarantine"},
    ]

    return {
        "nodes": nodes,
        "edges": edges,
    }


def build_supply_chain_episode(events):
    """
    Public function.

    Input:
    parsed Splunk events from civic_supply_chain_logs

    Output:
    enterprise-style supply chain incident episode
    """
    sorted_events = sorted(events, key=lambda event: event.get("timestamp", ""))

    episode = _build_episode_summary(sorted_events)
    attack_path = _build_attack_path(sorted_events)
    attack_edges = _build_attack_edges(attack_path)
    playbook = _build_playbook(episode)
    architecture_map = _build_architecture_map(episode, attack_path)

    return {
        "source": "splunk",
        "index": "civic_supply_chain_logs",
        "episode": episode,
        "attack_movie": {
            "title": episode["episode_title"],
            "summary": (
                "Suspicious open-source package behavior was correlated from "
                "container telemetry and converted into a replayable attack path."
            ),
            "nodes": attack_path,
            "edges": attack_edges,
            "node_count": len(attack_path),
        },
        "playbook": playbook,
        "architecture_map": architecture_map,
        "raw_events": sorted_events,
    }