from datetime import datetime, timezone
from uuid import uuid4


RESPONSE_AUDIT_LOG = []


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _create_audit_record(action_type, target, namespace, status, details):
    record = {
        "id": str(uuid4()),
        "timestamp": _now_iso(),
        "action_type": action_type,
        "target": target,
        "namespace": namespace,
        "status": status,
        "details": details,
    }

    RESPONSE_AUDIT_LOG.append(record)
    return record


def quarantine_pod(payload):
    """
    Safe demo mode.

    Production equivalent:
    - kubectl label pod <pod> civicshield/quarantine=true
    - kubectl annotate pod <pod> incident_id=<id>
    - or call Kubernetes API directly

    For now:
    - we simulate the action
    - return an audit record
    - frontend can show containment success
    """
    pod = payload.get("pod") or payload.get("target") or "unknown-pod"
    namespace = payload.get("namespace") or "default"
    reason = payload.get("reason") or "Suspicious supply chain behavior detected"

    details = {
        "simulated_command": (
            f"kubectl label pod {pod} "
            f"civicshield.ai/quarantine=true -n {namespace} --overwrite"
        ),
        "production_action": "Apply quarantine label to suspicious Kubernetes pod",
        "reason": reason,
        "safe_demo_mode": True,
    }

    return _create_audit_record(
        action_type="quarantine_pod",
        target=pod,
        namespace=namespace,
        status="simulated_success",
        details=details,
    )


def apply_network_policy(payload):
    """
    Safe demo mode.

    Production equivalent:
    - Generate Kubernetes NetworkPolicy
    - Apply deny-all-egress policy to suspicious pod selector
    """
    pod = payload.get("pod") or payload.get("target") or "unknown-pod"
    namespace = payload.get("namespace") or "default"

    policy_name = f"deny-egress-{pod}".replace("_", "-")

    details = {
        "policy_name": policy_name,
        "simulated_command": (
            f"kubectl apply -f generated/{policy_name}.yaml"
        ),
        "network_policy_preview": {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "NetworkPolicy",
            "metadata": {
                "name": policy_name,
                "namespace": namespace,
            },
            "spec": {
                "podSelector": {
                    "matchLabels": {
                        "app": pod,
                    }
                },
                "policyTypes": ["Egress"],
                "egress": [],
            },
        },
        "production_action": "Apply deny-all egress NetworkPolicy",
        "safe_demo_mode": True,
    }

    return _create_audit_record(
        action_type="apply_network_policy",
        target=pod,
        namespace=namespace,
        status="simulated_success",
        details=details,
    )


def rotate_service_account_token(payload):
    """
    Safe demo mode.

    Production equivalent:
    - rotate service account token
    - restart affected workload
    - invalidate exposed credential
    """
    namespace = payload.get("namespace") or "default"
    target = payload.get("target") or namespace

    details = {
        "simulated_action": (
            f"Rotate service account token in namespace {namespace}"
        ),
        "production_action": "Invalidate exposed Kubernetes service account credential",
        "safe_demo_mode": True,
    }

    return _create_audit_record(
        action_type="rotate_service_account_token",
        target=target,
        namespace=namespace,
        status="simulated_success",
        details=details,
    )


def open_dependency_review(payload):
    """
    Safe demo mode.

    Production equivalent:
    - open GitHub issue / Jira ticket
    - block dependency version
    - create PR to pin safe package version
    """
    package = payload.get("package") or payload.get("target") or "unknown-package"
    namespace = payload.get("namespace") or "default"

    details = {
        "simulated_ticket": f"Review suspicious dependency: {package}",
        "production_action": "Open dependency review workflow",
        "recommended_actions": [
            "Check package maintainer history",
            "Pin known-safe version",
            "Review recent dependency changes",
            "Run SBOM and vulnerability scan",
        ],
        "safe_demo_mode": True,
    }

    return _create_audit_record(
        action_type="open_dependency_review",
        target=package,
        namespace=namespace,
        status="simulated_success",
        details=details,
    )


def get_response_audit_log():
    return RESPONSE_AUDIT_LOG