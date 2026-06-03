from fastapi import APIRouter, HTTPException

from services.splunk_client import fetch_splunk_logs
from services.supply_chain_service import build_supply_chain_episode


router = APIRouter(prefix="/api/supply-chain", tags=["Supply Chain"])


@router.get("/episode")
def get_supply_chain_episode():
    try:
        logs_response = fetch_splunk_logs(
            scenario_id=None,
            index="civic_supply_chain_logs"
        )

        events = logs_response.get("events", [])
        episode = build_supply_chain_episode(events)

        return {
            "total_events_analyzed": len(events),
            **episode,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )