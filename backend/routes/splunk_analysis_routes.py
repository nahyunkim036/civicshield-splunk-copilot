from fastapi import APIRouter, HTTPException
from services.splunk_client import fetch_splunk_logs
from services.analysis_service import analyze_splunk_events

router = APIRouter(prefix="/api/splunk", tags=["Splunk Analysis"])


@router.get("/analysis")
def get_analysis():
    try:
        logs_response = fetch_splunk_logs()
        events = logs_response["events"]

        analysis = analyze_splunk_events(events)

        return {
            "source": "splunk",
            "index": logs_response["index"],
            **analysis,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )