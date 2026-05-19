from fastapi import APIRouter, HTTPException
from services.splunk_client import fetch_splunk_logs

router = APIRouter(prefix="/api/splunk", tags=["Splunk Logs"])


@router.get("/logs")
def get_logs():
    try:
        return fetch_splunk_logs()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )