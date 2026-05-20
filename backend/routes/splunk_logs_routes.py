from fastapi import APIRouter
from services.splunk_client import fetch_splunk_logs

router = APIRouter(prefix="/api/splunk", tags=["Splunk Logs"])


@router.get("/logs")
def get_logs(scenario_id: str | None = None):
    return fetch_splunk_logs(scenario_id)