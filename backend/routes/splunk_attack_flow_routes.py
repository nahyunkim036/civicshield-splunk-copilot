from fastapi import APIRouter, HTTPException
from services.splunk_client import fetch_splunk_logs
from services.attack_flow_service import build_attack_flow

router = APIRouter(prefix="/api/splunk", tags=["Splunk Attack Flow"])


@router.get("/attack-flow")
def get_attack_flow(scenario_id: str | None = None):
    try:
        logs_response = fetch_splunk_logs(scenario_id)
        events = logs_response["events"]

        attack_flow = build_attack_flow(events)

        return {
            "source": "splunk",
            "index": logs_response["index"],
            "scenario_id": scenario_id,
            **attack_flow,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )