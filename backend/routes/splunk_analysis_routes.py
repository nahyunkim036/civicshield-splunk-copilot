from fastapi import APIRouter, HTTPException
from services.splunk_client import fetch_splunk_logs
from services.analysis_service import analyze_splunk_events

router = APIRouter(prefix="/api/splunk", tags=["Splunk Analysis"])


@router.get("/analysis")
def get_analysis(scenario_id: str | None = None):
    try:
        logs_response = fetch_splunk_logs(scenario_id)
        events = logs_response["events"]

        analysis = analyze_splunk_events(events)

        return {
            "source": "splunk",
            "index": logs_response["index"],
            "scenario_id": scenario_id,
            **analysis,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )