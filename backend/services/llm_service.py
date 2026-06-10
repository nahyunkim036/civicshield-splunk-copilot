import json
import os
from typing import Any, Dict, List

import requests


OPENAI_API_URL = "https://api.openai.com/v1/responses"


def _safe_json_loads(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            return json.loads(text[start : end + 1])

        raise


def _build_fallback_explanation(episode: Dict[str, Any], events: List[Dict[str, Any]]) -> Dict[str, Any]:
    pod = episode.get("pod", "unknown pod")
    package = episode.get("package", "unknown package")
    namespace = episode.get("namespace", "unknown namespace")
    risk_level = episode.get("risk_level", "Unknown")
    risk_signals = episode.get("risk_signals", [])

    stage_explanations = []

    for event in events:
        stage = event.get("kill_chain_stage", "Evidence")
        risk_signal = event.get("risk_signal", "unknown")
        description = event.get("description", "")

        stage_explanations.append(
            {
                "event_type": event.get("event_type"),
                "risk_signal": risk_signal,
                "stage": stage,
                "meaning": description or f"{stage} was detected from Splunk evidence.",
                "operator_note": "Review the raw Splunk event fields and confirm whether response is required.",
            }
        )

    return {
        "case_summary": (
            f"Splunk detected suspicious supply-chain activity involving the "
            f"{package} package inside the {pod} pod in the {namespace} namespace."
        ),
        "why_it_matters": (
            f"The case is rated {risk_level} because the correlated events include "
            f"{', '.join(risk_signals) if risk_signals else 'multiple suspicious runtime signals'}."
        ),
        "recommended_response": (
            "Review the evidence, then quarantine the affected pod and apply a deny-egress "
            "NetworkPolicy if the evidence is confirmed."
        ),
        "confidence": "Medium",
        "stage_explanations": stage_explanations,
        "source": "fallback_rule_based_explanation",
    }


def generate_incident_explanation(
    episode: Dict[str, Any],
    events: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Real LLM-backed explanation layer.

    Important:
    - Splunk/backend correlation remains the source of truth.
    - The LLM only turns already-structured evidence into readable explanation.
    - If OPENAI_API_KEY is missing or request fails, backend returns a safe fallback.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        fallback = _build_fallback_explanation(episode, events)
        fallback["source"] = "fallback_missing_openai_api_key"
        return fallback

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

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

    prompt = f"""
You are an incident response assistant for a Splunk-to-Kubernetes security workbench.

Use ONLY the provided JSON evidence.
Do not invent tools, events, IPs, pods, packages, or response results.
Do not say containment already happened unless the evidence explicitly includes containment.
The user has not executed response actions yet unless response/audit events are present.

Return ONLY valid JSON with this exact shape:

{{
  "case_summary": "2-3 sentence readable summary",
  "why_it_matters": "2-3 sentence risk explanation",
  "recommended_response": "specific next actions in order",
  "confidence": "Low | Medium | High",
  "stage_explanations": [
    {{
      "event_type": "event_type from evidence",
      "risk_signal": "risk_signal from evidence",
      "stage": "stage name from evidence",
      "meaning": "what this evidence means",
      "operator_note": "what the operator should check next"
    }}
  ],
  "source": "openai_llm"
}}

Evidence JSON:
{json.dumps(evidence_payload, ensure_ascii=False)}
""".strip()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "input": prompt,
        "temperature": 0.2,
    }

    try:
        response = requests.post(
            OPENAI_API_URL,
            headers=headers,
            json=body,
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()

        output_text = ""

        for item in data.get("output", []):
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    output_text += content.get("text", "")

        if not output_text:
            raise ValueError("OpenAI response did not include output_text.")

        parsed = _safe_json_loads(output_text)
        parsed["source"] = parsed.get("source", "openai_llm")
        return parsed

    except Exception as error:
        fallback = _build_fallback_explanation(episode, events)
        fallback["source"] = "fallback_llm_error"
        fallback["error"] = str(error)
        return fallback