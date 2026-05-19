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

                raw = result.get("_raw", "")
                parts = raw.split(",", 7)

                parsed_event = {
                    "time": result.get("_time"),
                    "raw": raw,
                    "timestamp": parts[0] if len(parts) > 0 else None,
                    "org_type": parts[1] if len(parts) > 1 else None,
                    "event_type": parts[2] if len(parts) > 2 else None,
                    "user": parts[3] if len(parts) > 3 else None,
                    "src_ip": parts[4] if len(parts) > 4 else None,
                    "status": parts[5] if len(parts) > 5 else None,
                    "resource": parts[6] if len(parts) > 6 else None,
                    "description": parts[7] if len(parts) > 7 else None,
                }

                events.append(parsed_event)

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