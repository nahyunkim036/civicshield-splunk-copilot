from fastapi import APIRouter, HTTPException

from services.response_action_service import (
    quarantine_pod,
    apply_network_policy,
    rotate_service_account_token,
    open_dependency_review,
    get_response_audit_log,
)


router = APIRouter(prefix="/api/response", tags=["Response Actions"])


@router.post("/quarantine")
def run_quarantine_pod(payload: dict):
    try:
        return quarantine_pod(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/network-policy")
def run_network_policy(payload: dict):
    try:
        return apply_network_policy(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rotate-token")
def run_rotate_token(payload: dict):
    try:
        return rotate_service_account_token(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dependency-review")
def run_dependency_review(payload: dict):
    try:
        return open_dependency_review(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audit")
def get_audit_log():
    return {
        "count": len(get_response_audit_log()),
        "events": get_response_audit_log(),
    }