import os
import json
import requests
import urllib3
from dotenv import load_dotenv
from fastapi import HTTPException

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

SPLUNK_HOST = os.getenv("SPLUNK_HOST", "https://localhost:8089")
SPLUNK_USERNAME = os.getenv("SPLUNK_USERNAME")
SPLUNK_PASSWORD = os.getenv("SPLUNK_PASSWORD")
SPLUNK_INDEX = os.getenv("SPLUNK_INDEX", "civic_security_logs")


def parse_raw_event(raw):
    """
    Splunk에서 가져온 _raw CSV 문자열을 우리 앱이 쓰기 좋은 dict 형태로 바꾸는 함수.
    """
    parts = raw.split(",")

    if parts[0].strip().lower() == "timestamp":
        return None

    if len(parts) >= 9:
        return {
            "timestamp": parts[0].strip(),
            "org_type": parts[1].strip(),
            "scenario_id": parts[2].strip(),
            "event_type": parts[3].strip(),
            "user": parts[4].strip(),
            "src_ip": parts[5].strip(),
            "status": parts[6].strip(),
            "resource": parts[7].strip(),
            "description": ",".join(parts[8:]).strip(),
        }

    if len(parts) >= 8:
        return {
            "timestamp": parts[0].strip(),
            "org_type": parts[1].strip(),
            "scenario_id": "scenario_1",
            "event_type": parts[2].strip(),
            "user": parts[3].strip(),
            "src_ip": parts[4].strip(),
            "status": parts[5].strip(),
            "resource": parts[6].strip(),
            "description": ",".join(parts[7:]).strip(),
        }

    return None


def fetch_splunk_logs(scenario_id=None):
    """
    Splunk REST API를 호출해서 로그를 가져오는 함수.

    scenario_id가 없으면:
    - civic_security_logs 전체 검색

    scenario_id가 있으면:
    - 해당 scenario_id 문자열이 들어간 로그만 검색
    """

    if not SPLUNK_USERNAME or not SPLUNK_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Missing Splunk username or password in backend/.env"
        )

    url = f"{SPLUNK_HOST}/services/search/jobs/export"

    search_query = f"search index={SPLUNK_INDEX}"

    if scenario_id:
        search_query += f' "{scenario_id}"'

    data = {
        "search": search_query,
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

            if "result" not in data_line:
                continue

            result = data_line["result"]
            raw = result.get("_raw")

            if not raw:
                continue

            parsed_event = parse_raw_event(raw)

            if not parsed_event:
                continue

            parsed_event["time"] = result.get("_time")
            parsed_event["raw"] = raw
            parsed_event["source"] = result.get("source")

            events.append(parsed_event)

        return {
            "source": "splunk",
            "index": SPLUNK_INDEX,
            "scenario_id": scenario_id,
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