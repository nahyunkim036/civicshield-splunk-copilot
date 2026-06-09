from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.supply_chain_routes import router as supply_chain_router
from routes.response_routes import router as response_router


app = FastAPI(title="CivicShield AI Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "CivicShield AI backend is running",
        "project": "Supply Chain Incident Response Agent",
        "core_pipeline": [
            "Splunk supply chain logs",
            "Incident episode correlation",
            "Attack Movie reconstruction",
            "Auto Playbook response",
            "Kubernetes quarantine",
            "NetworkPolicy containment",
            "Audit trail",
        ],
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(supply_chain_router)
app.include_router(response_router)