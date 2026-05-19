from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.splunk_logs_routes import router as splunk_logs_router
from routes.splunk_analysis_routes import router as splunk_analysis_router

app = FastAPI(title="CivicShield AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) ## 서로 포트가 달라서, backend가 React 요청을 허용해줘야 함.


@app.get("/")
def root():
    return {"message": "CivicShield AI backend is running"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


app.include_router(splunk_logs_router)
app.include_router(splunk_analysis_router)