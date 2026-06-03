import os
import json
import csv
from io import StringIO

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


def _parse_csv_line(raw):
    """
    Splunk _raw가 CSV 한 줄로 들어오기 때문에,
    단순 split(",") 대신 csv.reader를 사용한다.

    이유:
    description 안에 comma가 들어가도 안전하게 파싱하기 위해서.
    """
    reader = csv.reader(StringIO(raw))
    return next(reader, [])


def parse_school_event(raw):
    """
    기존 school/admin login security log parser.

    Expected schema:
    timestamp,org_type,scenario_id,event_type,user,src_ip,status,resource,description
    """
    parts = _parse_csv_line(raw)

    if not parts:
        return None

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


def parse_supply_chain_event(raw):
    """
    New supply chain / container security log parser.

    Expected schema:
    timestamp,environment,service,namespace,pod,image,package,event_type,
    process,src_ip,dest_ip,file_path,action,status,severity,description
    """
    parts = _parse_csv_line(raw)

    if not parts:
        return None

    if parts[0].strip().lower() == "timestamp":
        return None

    if len(parts) < 16:
        return None

    return {
        "timestamp": parts[0].strip(),
        "environment": parts[1].strip(),
        "service": parts[2].strip(),
        "namespace": parts[3].strip(),
        "pod": parts[4].strip(),
        "image": parts[5].strip(),
        "package": parts[6].strip(),
        "event_type": parts[7].strip(),
        "process": parts[8].strip(),
        "src_ip": parts[9].strip(),
        "dest_ip": parts[10].strip(),
        "file_path": parts[11].strip(),
        "action": parts[12].strip(),
        "status": parts[13].strip(),
        "severity": parts[14].strip(),
        "description": ",".join(parts[15:]).strip(),
    }


def parse_raw_event(raw, index="civic_security_logs"):
    """
    index 이름에 따라 서로 다른 CSV schema를 parsing한다.

    civic_security_logs:
    - 기존 school login scenario

    civic_supply_chain_logs:
    - 새 supply chain / container telemetry
    """
    if index == "civic_supply_chain_logs":
        return parse_supply_chain_event(raw)

    return parse_school_event(raw)


def _build_search_query(index, scenario_id=None):
    search_query = f"search index={index}"

    if scenario_id:
        search_query += f' "{scenario_id}"'

    return search_query


def fetch_splunk_logs(scenario_id=None, index=None):
    """
    Splunk REST API를 호출해서 로그를 가져오는 함수.

    기본값:
    - .env의 SPLUNK_INDEX 사용
    - 없으면 civic_security_logs

    새 supply chain 기능에서는:
    fetch_splunk_logs(index="civic_supply_chain_logs")
    이렇게 호출한다.
    """
    selected_index = index or SPLUNK_INDEX

    if not SPLUNK_USERNAME or not SPLUNK_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Missing Splunk username or password in backend/.env",
        )

    url = f"{SPLUNK_HOST}/services/search/jobs/export"
    search_query = _build_search_query(selected_index, scenario_id)

    request_data = {
        "search": search_query,
        "output_mode": "json",
        "earliest_time": "0",
        "latest_time": "+10y",
    }

    try:
        response = requests.post(
            url,
            data=request_data,
            auth=(SPLUNK_USERNAME, SPLUNK_PASSWORD),
            verify=False,
            timeout=30,
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Splunk returned {response.status_code}: {response.text}",
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

            parsed_event = parse_raw_event(raw, index=selected_index)

            if not parsed_event:
                continue

            parsed_event["time"] = result.get("_time")
            parsed_event["raw"] = raw
            parsed_event["source"] = result.get("source")
            parsed_event["splunk_index"] = selected_index

            events.append(parsed_event)

        return {
            "source": "splunk",
            "index": selected_index,
            "scenario_id": scenario_id,
            "count": len(events),
            "events": events,
            "search_query": search_query,
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect to Splunk: {str(e)}",
        )