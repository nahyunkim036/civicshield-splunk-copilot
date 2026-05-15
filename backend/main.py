from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
import os
import json
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

app = FastAPI(title="CivicShield AI Backend")

SPLUNK_HOST = os.getenv("SPLUNK_HOST", "https://localhost:8089")
SPLUNK_USERNAME = os.getenv("SPLUNK_USERNAME")
SPLUNK_PASSWORD = os.getenv("SPLUNK_PASSWORD")
SPLUNK_INDEX = os.getenv("SPLUNK_INDEX", "civic_security_logs")


@app.get("/")
def root():
    return {"message": "CivicShield AI backend is running"}

@app.get("/api/splunk/logs")
def get_splunk_logs():
    if not SPLUNK_USERNAME or not SPLUNK_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Missing Splunk username or password in backend/.env"
        )

    url = f"{SPLUNK_HOST}/services/search/jobs/export"

    data = {
        "search": f"search index={SPLUNK_INDEX}",
        "output_mode": "json",
        "earliest_time": "0",
        "latest_time": "+10y",
    }

    try:
        response = requests.post(
            url,
            data=data,
            auth=(SPLUNK_USERNAME, SPLUNK_PASSWORD),
            verify=False,
            timeout=30,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Splunk returned {response.status_code}: {response.text}"
            )

        events = []

        for line in response.text.splitlines():
            if not line.strip():
                continue

            data_line = json.loads(line)

            if "result" in data_line:
                result = data_line["result"]

                events.append({
                    "time": result.get("_time"),
                    "raw": result.get("_raw"),
                    "event_type": result.get("event_type"),
                    "user": result.get("user"),
                    "src_ip": result.get("src_ip"),
                    "status": result.get("status"),
                    "resource": result.get("resource"),
                    "description": result.get("description"),
                })

        return {
            "source": "splunk",
            "index": SPLUNK_INDEX,
            "count": len(events),
            "events": events,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Splunk: {str(e)}"
        )