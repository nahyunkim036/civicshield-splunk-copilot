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


def _build_evidence_explanation(event, risk_signal):
    event_type = event.get("event_type")
    file_path = event.get("file_path")
    dest_ip = event.get("dest_ip")
    process = event.get("process")

    if risk_signal == "supply_chain_entry":
        return (
            "A new open-source package was loaded inside the runtime. "
            "This is the starting point of the supply chain investigation."
        )

    if risk_signal == "unexpected_execution":
        return (
            f"An unexpected process started inside the container"
            f"{f': {process}' if process else ''}. "
            "Unexpected runtime execution can indicate malicious package behavior."
        )

    if risk_signal == "credential_access":
        return (
            f"The container accessed {file_path or 'the Kubernetes service account token path'}. "
            "A service account token can allow access to the Kubernetes API if misused."
        )

    if risk_signal == "external_c2_connection":
        return (
            f"The pod attempted an outbound connection to "
            f"{dest_ip or 'an unapproved external IP'}. "
            "This may indicate command-and-control or data exfiltration behavior."
        )

    if risk_signal == "privilege_escalation":
        return (
            "A privilege escalation attempt was detected. "
            "This suggests the suspicious workload may be trying to gain more access."
        )

    if risk_signal == "containment":
        return (
            "A quarantine action was executed. "
            "The affected pod was marked as a containment target."
        )

    if risk_signal == "egress_block":
        return (
            "A deny-egress NetworkPolicy was applied. "
            "This blocks outbound traffic from quarantined pods."
        )

    if risk_signal == "audit_record":
        return (
            "The response action was recorded in the audit trail. "
            "This provides evidence of what containment step was performed."
        )

    return event.get("description") or event_type or "Evidence event"


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
        containment = "Quarantined and Network Isolated"
    elif has_containment:
        containment = "Quarantined"
    else:
        containment = "Containment Ready"

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

        attack_path.append(
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
                "explanation": _build_evidence_explanation(event, risk_signal),
                "evidence": {
                    "timestamp": event.get("timestamp"),
                    "pod": event.get("pod"),
                    "namespace": event.get("namespace"),
                    "package": event.get("package"),
                    "process": event.get("process"),
                    "src_ip": event.get("src_ip"),
                    "dest_ip": event.get("dest_ip"),
                    "file_path": event.get("file_path"),
                    "action": event.get("action"),
                    "status": event.get("status"),
                    "severity": event.get("severity"),
                    "raw_description": event.get("description"),
                },
            }
        )

    return attack_path


def _build_attack_edges(attack_path):
    edges = []

    for index in range(len(attack_path) - 1):
        edges.append(
            {
                "from": attack_path[index]["id"],
                "to": attack_path[index + 1]["id"],
                "label": "next",
            }
        )

    return edges


def _build_attack_movie_from_path(episode, attack_path):
    """
    Backward-compatible response object.

    The current frontend may still read `attack_movie`.
    Conceptually, this now represents the Evidence Timeline.
    """
    nodes = []

    for item in attack_path:
        evidence = item.get("evidence", {})

        nodes.append(
            {
                "id": str(item.get("step")),
                "step": item.get("step"),
                "timestamp": evidence.get("timestamp"),
                "time": item.get("time"),
                "stage": item.get("stage"),
                "label": item.get("label"),
                "headline": item.get("headline"),
                "description": item.get("description"),
                "explanation": item.get("explanation"),
                "event_type": item.get("event_type"),
                "risk_signal": item.get("risk_signal"),
                "severity": item.get("severity"),
                "status": item.get("status"),
                "pod": evidence.get("pod"),
                "namespace": evidence.get("namespace"),
                "package": evidence.get("package"),
                "process": evidence.get("process"),
                "src_ip": evidence.get("src_ip"),
                "dest_ip": evidence.get("dest_ip"),
                "file_path": evidence.get("file_path"),
                "evidence": evidence,
            }
        )

    edges = []

    for index in range(len(nodes) - 1):
        edges.append(
            {
                "id": f"edge-{nodes[index]['id']}-{nodes[index + 1]['id']}",
                "source": nodes[index]["id"],
                "target": nodes[index + 1]["id"],
                "label": "next",
            }
        )

    return {
        "title": episode.get("episode_title", "Suspicious Supply Chain Activity"),
        "summary": "Time-ordered Splunk evidence sequence for this incident.",
        "nodes": nodes,
        "edges": edges,
        "node_count": len(nodes),
    }


def _build_playbook(episode):
    pod = episode.get("pod")
    namespace = episode.get("namespace")
    package = episode.get("package")

    return [
        {
            "id": "quarantine_pod",
            "priority": 1,
            "action": "Quarantine Pod",
            "category": "primary",
            "execution_type": "real_kubernetes_action",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/quarantine",
            "status": "ready",
            "why": (
                "Applies a quarantine label to the affected pod so it can be "
                "targeted by containment controls."
            ),
        },
        {
            "id": "apply_network_policy",
            "priority": 2,
            "action": "Apply Deny-Egress NetworkPolicy",
            "category": "primary",
            "execution_type": "real_kubernetes_action",
            "target": pod,
            "namespace": namespace,
            "api": "/api/response/network-policy",
            "status": "ready",
            "why": (
                "Applies a Kubernetes NetworkPolicy that blocks outbound traffic "
                "from quarantined pods."
            ),
        },
        {
            "id": "rotate_service_account",
            "priority": 3,
            "action": "Rotate Service Account Token",
            "category": "follow_up",
            "execution_type": "simulated_follow_up",
            "target": namespace,
            "namespace": namespace,
            "api": "/api/response/rotate-token",
            "status": "recommended",
            "why": (
                "Credential access was observed, so the exposed service account "
                "token should be treated as compromised."
            ),
        },
        {
            "id": "open_dependency_review",
            "priority": 4,
            "action": "Open Dependency Review",
            "category": "follow_up",
            "execution_type": "simulated_follow_up",
            "target": package,
            "namespace": namespace,
            "api": "/api/response/dependency-review",
            "status": "recommended",
            "why": (
                "The incident began with suspicious behavior from an open-source "
                "package, so the dependency should be reviewed and pinned to a "
                "safe version."
            ),
        },
    ]


def _build_architecture_map(episode, attack_path):
    """
    Frontend-friendly impacted asset map.
    This is not the main feature; it supports the Case Overview.
    """
    package = episode.get("package")
    pod = episode.get("pod")
    service = episode.get("service")
    namespace = episode.get("namespace")

    has_c2 = any(item["risk_signal"] == "external_c2_connection" for item in attack_path)
    has_quarantine = any(item["risk_signal"] == "containment" for item in attack_path)
    has_egress_block = any(item["risk_signal"] == "egress_block" for item in attack_path)

    nodes = [
        {
            "id": "package",
            "label": package,
            "type": "Open Source Package",
            "definition": "External dependency loaded by the application.",
            "status": "warning",
        },
        {
            "id": "pod",
            "label": pod,
            "type": "Kubernetes Pod",
            "definition": "Smallest Kubernetes unit running the affected application container.",
            "status": "contained" if has_quarantine else "critical",
        },
        {
            "id": "service",
            "label": service,
            "type": "Service",
            "definition": "Application service affected by the suspicious package activity.",
            "status": "warning",
        },
        {
            "id": "namespace",
            "label": namespace,
            "type": "Namespace",
            "definition": "Logical Kubernetes space where the affected pod is running.",
            "status": "normal",
        },
        {
            "id": "external_ip",
            "label": "Unapproved External IP",
            "type": "External Destination",
            "definition": "Outbound destination observed in Splunk evidence.",
            "status": "critical" if has_c2 else "normal",
        },
        {
            "id": "quarantine",
            "label": "Containment Control",
            "type": "Response Control",
            "definition": "Quarantine label and deny-egress policy used to contain the pod.",
            "status": "contained" if has_quarantine and has_egress_block else "ready",
        },
    ]

    edges = [
        {"from": "package", "to": "pod", "label": "loaded into"},
        {"from": "pod", "to": "service", "label": "runs"},
        {"from": "pod", "to": "external_ip", "label": "attempted outbound connection"},
        {"from": "pod", "to": "quarantine", "label": "contained by"},
    ]

    return {
        "nodes": nodes,
        "edges": edges,
    }


def _build_ai_explanation(episode, events):
    """
    Build a clear AI-style explanation from Splunk evidence.

    This is intentionally deterministic for the demo:
    - stable output
    - easy to explain
    - can later be replaced with a real LLM or Splunk AI Assistant layer.
    """
    risk_signals = set()
    evidence_reasons = []

    for event in events:
        risk_signal = event.get("risk_signal") or _get_risk_signal(event)
        risk_signals.add(risk_signal)

        event_type = event.get("event_type")
        dest_ip = event.get("dest_ip")
        process = event.get("process")

        if risk_signal == "credential_access":
            evidence_reasons.append(
                "the container attempted to access the Kubernetes service account token"
            )

        if risk_signal == "external_c2_connection":
            evidence_reasons.append(
                f"the pod attempted an outbound connection to "
                f"{dest_ip or 'an unapproved external IP'}"
            )

        if risk_signal == "privilege_escalation":
            evidence_reasons.append("a privilege escalation attempt was detected")

        if event_type == "process_start" and process:
            evidence_reasons.append(
                f"an unexpected process started inside the container: {process}"
            )

    evidence_reasons = list(dict.fromkeys(evidence_reasons))

    package = episode.get("package", "unknown package")
    pod = episode.get("pod", "unknown pod")
    namespace = episode.get("namespace", "unknown namespace")
    risk_level = episode.get("risk_level", "Unknown")
    containment = episode.get("containment", "Unknown")

    case_summary = (
        f"Splunk detected suspicious supply chain activity involving the "
        f"{package} package inside the {pod} pod in the {namespace} namespace."
    )

    if evidence_reasons:
        why_it_matters = (
            "This case is risky because " + "; ".join(evidence_reasons) + "."
        )
    else:
        why_it_matters = (
            "This case is risky because multiple suspicious runtime events were "
            "correlated from Splunk logs."
        )

    recommended_response = (
        "The recommended response is to quarantine the affected pod and apply a "
        "deny-egress NetworkPolicy to reduce the chance of data exfiltration. "
        "After containment, the service account token should be rotated and the "
        "suspicious dependency should be reviewed."
    )

    if "credential_access" in risk_signals and "external_c2_connection" in risk_signals:
        confidence = "High"
    elif "privilege_escalation" in risk_signals:
        confidence = "Medium-High"
    else:
        confidence = "Medium"

    return {
        "case_summary": case_summary,
        "why_it_matters": why_it_matters,
        "recommended_response": recommended_response,
        "confidence": confidence,
        "risk_level": risk_level,
        "containment": containment,
        "based_on": sorted(list(risk_signals)),
        "source": "Splunk evidence analyzed by CivicShield AI explanation layer",
    }


def build_supply_chain_episode(events):
    sorted_events = sorted(events, key=lambda event: event.get("timestamp", ""))

    for event in sorted_events:
        event["risk_signal"] = _get_risk_signal(event)
        event["kill_chain_stage"] = _get_kill_chain_stage(event)

    episode = _build_episode_summary(sorted_events)

    attack_path = _build_attack_path(sorted_events)
    attack_edges = _build_attack_edges(attack_path)

    evidence_timeline = {
        "title": "Evidence Timeline",
        "summary": "Splunk evidence reconstructed in time order.",
        "stages": attack_path,
        "edges": attack_edges,
        "stage_count": len(attack_path),
    }

    # Keep attack_movie for the current frontend until we fully rename components.
    attack_movie = _build_attack_movie_from_path(episode, attack_path)

    playbook = _build_playbook(episode)
    architecture_map = _build_architecture_map(episode, attack_path)
    ai_explanation = _build_ai_explanation(episode, sorted_events)

    return {
        "source": "splunk",
        "index": "civic_supply_chain_logs",
        "total_events_analyzed": len(sorted_events),
        "episode": episode,
        "ai_explanation": ai_explanation,
        "evidence_timeline": evidence_timeline,
        "attack_movie": attack_movie,
        "playbook": playbook,
        "architecture_map": architecture_map,
        "raw_events": sorted_events,
    }