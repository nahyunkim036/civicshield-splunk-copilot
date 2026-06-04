import os
import subprocess
import tempfile
from datetime import datetime, timezone
from uuid import uuid4


RESPONSE_AUDIT_LOG = []

RESPONSE_MODE = os.getenv("CIVICSHIELD_RESPONSE_MODE", "mock").lower()
KUBECTL_TIMEOUT = int(os.getenv("CIVICSHIELD_KUBECTL_TIMEOUT", "10"))


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _is_kubernetes_mode():
    return RESPONSE_MODE == "kubernetes"


def _create_audit_record(action_type, target, namespace, status, details):
    record = {
        "id": str(uuid4()),
        "timestamp": _now_iso(),
        "mode": RESPONSE_MODE,
        "action_type": action_type,
        "target": target,
        "namespace": namespace,
        "status": status,
        "details": details,
    }

    RESPONSE_AUDIT_LOG.append(record)
    return record


def _run_kubectl(command):
    """
    Runs a kubectl command in local Kubernetes mode.

    Example:
    kubectl label pod payment-api-7f9d civicshield.ai/quarantine=true -n checkout --overwrite
    """
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        timeout=KUBECTL_TIMEOUT,
        check=False,
    )

    return {
        "command": " ".join(command),
        "return_code": completed.returncode,
        "stdout": completed.stdout.strip(),
        "stderr": completed.stderr.strip(),
        "success": completed.returncode == 0,
    }


def _network_policy_yaml(policy_name, namespace):
    return f"""apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {policy_name}
  namespace: {namespace}
spec:
  podSelector:
    matchLabels:
      civicshield.ai/quarantine: "true"
  policyTypes:
    - Egress
  egress: []
"""


def quarantine_pod(payload):
    """
    Quarantine a suspicious Kubernetes pod.

    Mock mode:
    - returns the kubectl command preview
    - stores audit record

    Kubernetes mode:
    - runs kubectl label pod ...
    - stores kubectl result in audit record
    """
    pod = payload.get("pod") or payload.get("target") or "unknown-pod"
    namespace = payload.get("namespace") or "default"
    reason = payload.get("reason") or "Suspicious supply chain behavior detected"

    command = [
        "kubectl",
        "label",
        "pod",
        pod,
        "civicshield.ai/quarantine=true",
        "-n",
        namespace,
        "--overwrite",
    ]

    if not _is_kubernetes_mode():
        details = {
            "simulated_command": " ".join(command),
            "production_action": "Apply quarantine label to suspicious Kubernetes pod",
            "reason": reason,
            "safe_demo_mode": True,
            "how_to_enable_real_mode": "Set CIVICSHIELD_RESPONSE_MODE=kubernetes before starting backend.",
        }

        return _create_audit_record(
            action_type="quarantine_pod",
            target=pod,
            namespace=namespace,
            status="simulated_success",
            details=details,
        )

    kubectl_result = _run_kubectl(command)

    status = "kubernetes_success" if kubectl_result["success"] else "kubernetes_failed"

    details = {
        "kubectl_result": kubectl_result,
        "production_action": "Applied quarantine label to suspicious Kubernetes pod",
        "reason": reason,
        "safe_demo_mode": False,
    }

    return _create_audit_record(
        action_type="quarantine_pod",
        target=pod,
        namespace=namespace,
        status=status,
        details=details,
    )


def apply_network_policy(payload):
    """
    Apply deny-all egress NetworkPolicy to quarantined pods.

    Mock mode:
    - returns YAML preview

    Kubernetes mode:
    - writes temporary YAML file
    - runs kubectl apply -f <file>
    """
    pod = payload.get("pod") or payload.get("target") or "unknown-pod"
    namespace = payload.get("namespace") or "default"

    policy_name = f"deny-egress-{pod}".replace("_", "-")
    yaml_content = _network_policy_yaml(policy_name, namespace)

    if not _is_kubernetes_mode():
        details = {
            "policy_name": policy_name,
            "simulated_command": f"kubectl apply -f generated/{policy_name}.yaml",
            "network_policy_yaml": yaml_content,
            "production_action": "Apply deny-all egress NetworkPolicy to quarantined pod",
            "safe_demo_mode": True,
            "how_to_enable_real_mode": "Set CIVICSHIELD_RESPONSE_MODE=kubernetes before starting backend.",
        }

        return _create_audit_record(
            action_type="apply_network_policy",
            target=pod,
            namespace=namespace,
            status="simulated_success",
            details=details,
        )

    with tempfile.NamedTemporaryFile(
        mode="w",
        suffix=".yaml",
        delete=False,
    ) as temp_file:
        temp_file.write(yaml_content)
        temp_file_path = temp_file.name

    command = ["kubectl", "apply", "-f", temp_file_path]
    kubectl_result = _run_kubectl(command)

    status = "kubernetes_success" if kubectl_result["success"] else "kubernetes_failed"

    details = {
        "policy_name": policy_name,
        "network_policy_yaml": yaml_content,
        "kubectl_result": kubectl_result,
        "production_action": "Applied deny-all egress NetworkPolicy",
        "safe_demo_mode": False,
    }

    return _create_audit_record(
        action_type="apply_network_policy",
        target=pod,
        namespace=namespace,
        status=status,
        details=details,
    )


def rotate_service_account_token(payload):
    """
    Safe demo action.

    Real production equivalent:
    - rotate or invalidate the affected service account token
    - restart workload
    - update secret references
    """
    namespace = payload.get("namespace") or "default"
    target = payload.get("target") or namespace

    details = {
        "simulated_action": f"Rotate service account token in namespace {namespace}",
        "production_action": "Invalidate exposed Kubernetes service account credential",
        "safe_demo_mode": True,
        "note": "Token rotation remains simulated in this prototype.",
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
    Safe demo action.

    Real production equivalent:
    - open Jira/GitHub issue
    - block package version
    - create PR to pin safe dependency version
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