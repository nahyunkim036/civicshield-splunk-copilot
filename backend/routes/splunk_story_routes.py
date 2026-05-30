from fastapi import APIRouter, HTTPException, Query

from services.splunk_client import fetch_splunk_logs
from services.story_service import generate_incident_story


router = APIRouter(prefix="/api/splunk", tags=["Splunk Story"])


@router.get("/story")
def get_incident_story(
    scenario_id: str | None = Query(default=None)
):
    try:
        logs_response = fetch_splunk_logs(scenario_id=scenario_id)
        events = logs_response.get("events", [])

        story = generate_incident_story(events)

        return {
            "source": "splunk",
            "index": logs_response.get("index"),
            "scenario_id": scenario_id,
            "total_events_analyzed": len(events),
            **story,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )