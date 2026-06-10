from collections import Counter

from services.llm_service import generate_incident_explanation


SEVERITY_SCORE = {
    "critical": 40,
    "high": 25,
    "medium": 10,
    "low": 3,
    "resolved": 0,
}


RESPONSE_EVENT_TYPES = {
    "quarantine",
    "network_policy",
    "audit",
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


def _build_episode_title(risk_signals, episode):
    pod = episode.get("pod", "workload")
    package = episode.get("package", "dependency")

    has_credential_access = "credential_access" in risk_signals
    has_c2 = "external_c2_connection" in risk_signals
    has_privilege_escalation = "privilege_escalation" in risk_signals
    has_supply_chain_entry = "supply_chain_entry" in risk_signals

    if has_supply_chain_entry and has_credential_access and has_c2:
        return f"Possible Supply Chain Exfiltration from {pod}"

    if has_credential_access and has_c2:
        return f"Possible Credential Exfiltration from {pod}"

    if has_privilege_escalation:
        return f"Privilege Escalation Attempt in {pod}"

    if has_supply_chain_entry:
        return f"Suspicious Dependency Behavior from {package}"

    return f"Suspicious Container Behavior in {pod}"


def _build_episode_summary(events):
    risk_signals = [_get_risk_signal(event) for event in events]
    raw_risk_score = sum(_severity_score(event.get("severity")) for event in events)
    risk_score = min(raw_risk_score, 100)
    risk_level = _get_risk_level(risk_score)

    severity_counts = Counter(event.get("severity", "unknown") for event in events)

    episode = {
        "episode_title": "Suspicious Kubernetes Activity",
        "episode_type": "Suspicious Kubernetes Activity",
        "environment": _first_value(events, "environment"),
        "service": _first_value(events, "service"),
        "namespace": _first_value(events, "namespace"),
        "pod": _first_value(events, "pod"),
        "image": _first_value(events, "image"),
        "package": _first_value(events, "package"),
        "src_ip": _first_value(events, "src_ip"),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "containment": "Response required",
        "event_count": len(events),
        "risk_signals": sorted(set(risk_signals)),
        "severity_counts": dict(severity_counts),
        "status": "open",
    }

    episode_title = _build_episode_title(set(risk_signals), episode)
    episode["episode_title"] = episode_title
    episode["episode_type"] = episode_title

    return episode


def _build_evidence_timeline(events, llm_explanation=None):
    stage_explanations = {}

    if llm_explanation:
        for item in llm_explanation.get("stage_explanations", []):
            key = item.get("event_type")
            if key:
                stage_explanations[key] = item

    stages = []

    for index, event in enumerate(events, start=1):
        stage = _get_kill_chain_stage(event)
        risk_signal = _get_risk_signal(event)
        llm_stage = stage_explanations.get(event.get("event_type"), {})

        stages.append(
            {
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
                "meaning": llm_stage.get("meaning"),
                "operator_note": llm_stage.get("operator_note"),
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
            }
        )

    return {
        "title": "Detection evidence",
        "summary": "Ordered Splunk evidence before user response actions.",
        "stages": stages,
        "stage_count": len(stages),
    }


def _build_playbook(episode):
    pod = episode.get("pod")
    namespace = episode.get("namespace")
    package = episode.get("package")

    return [
        {
            "id": "quarantine_pod",
            "priority": 1,
            "category": "primary",
            "execution_type": "real_kubernetes_action",
            "action": "Quarantine Pod",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/quarantine",
            "status": "ready",
            "why": "Adds a quarantine label to the suspicious Kubernetes pod so follow-up controls can target it.",
        },
        {
            "id": "apply_network_policy",
            "priority": 2,
            "category": "primary",
            "execution_type": "real_kubernetes_action",
            "action": "Apply Deny-Egress NetworkPolicy",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/network-policy",
            "status": "ready",
            "why": "Blocks outbound traffic from the quarantined pod to reduce exfiltration risk.",
        },
        {
            "id": "rotate_service_account",
            "priority": 3,
            "category": "follow_up",
            "execution_type": "recommended_workflow",
            "action": "Rotate Service Account Token",
            "target": namespace,
            "namespace": namespace,
            "api": "/api/response/rotate-token",
            "status": "recommended",
            "why": "Credential access was observed, so the service account token should be treated as potentially exposed.",
        },
        {
            "id": "open_dependency_review",
            "priority": 4,
            "category": "follow_up",
            "execution_type": "recommended_workflow",
            "action": "Open Dependency Review",
            "target": package,
            "namespace": namespace,
            "api": "/api/response/dependency-review",
            "status": "recommended",
            "why": "The incident began with suspicious behavior from an open-source package.",
        },
    ]


def _build_architecture_map(episode):
    return {
        "nodes": [
            {
                "id": "package",
                "label": episode.get("package"),
                "type": "Open Source Package",
                "status": "warning",
            },
            {
                "id": "pod",
                "label": episode.get("pod"),
                "type": "Kubernetes Pod",
                "status": "critical",
            },
            {
                "id": "service",
                "label": episode.get("service"),
                "type": "Service",
                "status": "warning",
            },
            {
                "id": "namespace",
                "label": episode.get("namespace"),
                "type": "Namespace",
                "status": "normal",
            },
            {
                "id": "external_ip",
                "label": "Unapproved External IP",
                "type": "External Destination",
                "status": "critical",
            },
            {
                "id": "response",
                "label": "Response Required",
                "type": "User Action",
                "status": "ready",
            },
        ],
        "edges": [
            {"from": "package", "to": "pod"},
            {"from": "pod", "to": "service"},
            {"from": "service", "to": "external_ip"},
            {"from": "pod", "to": "response"},
        ],
    }


def build_supply_chain_episode(events):
    sorted_events = sorted(events, key=lambda event: event.get("timestamp", ""))

    for event in sorted_events:
        event["risk_signal"] = _get_risk_signal(event)
        event["kill_chain_stage"] = _get_kill_chain_stage(event)

    detection_events = [
        event
        for event in sorted_events
        if event.get("event_type") not in RESPONSE_EVENT_TYPES
    ]

    response_events = [
        event
        for event in sorted_events
        if event.get("event_type") in RESPONSE_EVENT_TYPES
    ]

    episode = _build_episode_summary(detection_events)
    ai_explanation = generate_incident_explanation(episode, detection_events)
    evidence_timeline = _build_evidence_timeline(detection_events, ai_explanation)
    playbook = _build_playbook(episode)
    architecture_map = _build_architecture_map(episode)

    return {
        "source": "splunk",
        "index": "civic_supply_chain_logs",
        "total_events_analyzed": len(detection_events),
        "episode": episode,
        "ai_explanation": ai_explanation,
        "evidence_timeline": evidence_timeline,
        "playbook": playbook,
        "architecture_map": architecture_map,
        "raw_events": detection_events,
        "response_events_from_splunk": response_events,
        "workflow_state": {
            "phase": "awaiting_user_response",
            "message": "Evidence was analyzed from Splunk. Response actions must be executed by the user.",
        },
    }