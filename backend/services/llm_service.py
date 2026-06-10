import json
import os
from typing import Any, Dict, List

import requests


def _safe_json_loads(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])

        raise


def _build_fallback_explanation(
    episode: Dict[str, Any],
    events: List[Dict[str, Any]],
) -> Dict[str, Any]:
    pod = episode.get("pod", "unknown pod")
    package = episode.get("package", "unknown package")
    namespace = episode.get("namespace", "unknown namespace")
    risk_level = episode.get("risk_level", "Unknown")
    risk_signals = episode.get("risk_signals", [])

    stage_explanations = []

    for event in events:
        stage = event.get("kill_chain_stage", "Evidence")
        risk_signal = event.get("risk_signal", "unknown")
        event_type = event.get("event_type")
        description = event.get("description", "")

        if event_type == "package_loaded":
            meaning = (
                f"The {package} package was loaded inside the production "
                f"{pod} pod. This is the first sign that the incident may have "
                "started from a dependency."
            )
            operator_note = "Review the dependency source, version, and recent package changes."

        elif event_type == "process_start":
            meaning = (
                "A process started unexpectedly after the package was loaded. "
                "This suggests the dependency may be doing more than normal application behavior."
            )
            operator_note = "Check whether this process is expected for the service."

        elif event_type == "file_access":
            meaning = (
                "The workload attempted to read the Kubernetes service account token path. "
                "This can indicate credential access inside the pod."
            )
            operator_note = "Treat the pod as suspicious and consider rotating related credentials."

        elif event_type == "network_connection":
            dest_ip = event.get("dest_ip") or "an external destination"
            meaning = (
                f"The pod attempted an outbound connection to {dest_ip}. "
                "This may indicate attempted command-and-control or exfiltration behavior."
            )
            operator_note = "Review the destination IP and apply egress controls if it is not approved."

        elif event_type == "privilege_escalation":
            meaning = (
                "The workload attempted privilege escalation. Even though it was blocked, "
                "this is a critical signal that the container should be contained."
            )
            operator_note = "Keep the workload isolated and review container permissions."

        else:
            meaning = description or f"{stage} was detected from Splunk evidence."
            operator_note = "Review the raw Splunk event fields."

        stage_explanations.append(
            {
                "event_type": event_type,
                "risk_signal": risk_signal,
                "stage": stage,
                "meaning": meaning,
                "operator_note": operator_note,
            }
        )

    return {
        "case_summary": (
            f"Splunk detected suspicious supply-chain behavior involving the "
            f"{package} package inside the {pod} pod in the {namespace} namespace. "
            "The evidence shows package execution, credential access, external communication, "
            "and privilege escalation signals before user response actions."
        ),
        "why_it_matters": (
            f"The case is rated {risk_level} because the correlated evidence includes "
            f"{', '.join(risk_signals) if risk_signals else 'multiple suspicious runtime signals'}. "
            "These signals suggest the affected workload should be reviewed and contained."
        ),
        "recommended_response": (
            "First review the evidence timeline, then quarantine the affected pod. "
            "After quarantine, apply a deny-egress NetworkPolicy and complete service account "
            "token and dependency review."
        ),
        "confidence": "Medium",
        "stage_explanations": stage_explanations,
        "source": "civicshield_local_ai",
        "llm_status": "local_fallback",
    }


def _build_prompt(episode: Dict[str, Any], events: List[Dict[str, Any]]) -> str:
    evidence_payload = {
        "episode": episode,
        "events": [
            {
                "timestamp": event.get("timestamp"),
                "event_type": event.get("event_type"),
                "risk_signal": event.get("risk_signal"),
                "kill_chain_stage": event.get("kill_chain_stage"),
                "severity": event.get("severity"),
                "status": event.get("status"),
                "process": event.get("process"),
                "dest_ip": event.get("dest_ip"),
                "file_path": event.get("file_path"),
                "description": event.get("description"),
            }
            for event in events
        ],
    }

    return f"""
You are CivicShield's incident explanation engine.

CivicShield is a Splunk-to-Kubernetes incident response workbench.
Splunk provides the evidence. Backend correlation provides the risk signals.
Your job is to explain the already-provided evidence clearly for a security operator.

Important rules:
- Use ONLY the provided JSON evidence.
- Do NOT invent events, pods, packages, IPs, response actions, or completed containment.
- Do NOT say quarantine or NetworkPolicy already happened.
- The user has not executed response actions yet.
- Write for a busy security operator.
- Be concise, practical, and easy to scan in a UI.
- Avoid marketing language.
- Avoid long paragraphs.
- Do not over-explain Kubernetes basics.
- Each sentence should help the user decide what to check or run next.

Return ONLY valid JSON with this exact shape:

{{
  "case_summary": "2 short sentences. Mention the affected service, pod, package, and the main suspicious behavior.",
  "why_it_matters": "2 short sentences. Explain the concrete risk using the evidence. Mention credential access, external connection, or privilege escalation only if present.",
  "recommended_response": "Use 3 short numbered steps separated by newline characters. Step 1 should review evidence. Step 2 should quarantine the pod. Step 3 should apply egress control and follow-up review.",
  "confidence": "Low | Medium | High",
  "stage_explanations": [
    {{
      "event_type": "event_type from evidence",
      "risk_signal": "risk_signal from evidence",
      "stage": "stage name from evidence",
      "meaning": "One concise sentence explaining what this event means.",
      "operator_note": "One concise sentence saying what the operator should check next."
    }}
  ],
  "source": "gemini_llm"
}}

Evidence JSON:
{json.dumps(evidence_payload, ensure_ascii=False)}
""".strip()

def _call_gemini(prompt: str) -> Dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json",
        },
    }

    response = requests.post(url, json=body, timeout=25)
    response.raise_for_status()

    data = response.json()
    text = (
        data.get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [{}])[0]
        .get("text", "")
    )

    if not text:
        raise ValueError("Gemini response did not include text.")

    parsed = _safe_json_loads(text)
    parsed["source"] = parsed.get("source", "gemini_llm")
    parsed["llm_status"] = "external_llm_success"
    return parsed


def generate_incident_explanation(
    episode: Dict[str, Any],
    events: List[Dict[str, Any]],
) -> Dict[str, Any]:
    prompt = _build_prompt(episode, events)

    try:
        return _call_gemini(prompt)
    except Exception as error:
        fallback = _build_fallback_explanation(episode, events)
        fallback["source"] = "civicshield_local_ai"
        fallback["llm_status"] = "external_llm_unavailable"
        fallback["debug_error"] = str(error)
        return fallback