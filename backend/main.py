from fastapi import FastAPI
from routes.splunk_logs_routes import router as splunk_logs_router
from routes.splunk_analysis_routes import router as splunk_analysis_router

app = FastAPI(title="CivicShield AI Backend")


@app.get("/")
def root():
    return {"message": "CivicShield AI backend is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(splunk_logs_router)
app.include_router(splunk_analysis_router)