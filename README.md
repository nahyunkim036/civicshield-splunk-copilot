# CivicShield

CivicShield is a security response workbench that connects Splunk logs, AI explanation, and Kubernetes response actions.

I built this project for the Splunk Agentic Ops Hackathon under the Security track. The main idea is simple: Splunk already stores important security logs, but it can still be hard for a user to understand what happened and what action to take next. CivicShield tries to turn those logs into a clear incident workflow.

## What This App Does

CivicShield helps a security operator go through this flow:

```text
Splunk logs
→ incident analysis
→ AI summary
→ evidence review
→ user-run response action
→ audit record
```

The app does not automatically take action without the user. The user reviews the evidence first, then chooses whether to run a response action.

## Demo Scenario

The demo focuses on a suspicious supply-chain incident in a Kubernetes workload.

Affected workload:

```text
Service: payment-api
Namespace: checkout
Pod: payment-api-7f9d
Package: event-stream-lite
```

The Splunk logs show this sequence:

```text
1. A package was loaded inside a production container
2. An unexpected process started
3. The container accessed a Kubernetes service account token path
4. The pod attempted an outbound connection to an external IP
5. A privilege escalation attempt was detected
```

CivicShield groups these events into one incident case and marks it as a critical risk.

## Main Features

### Case Overview

Shows the main incident details:

- affected pod
- namespace
- suspicious package
- risk level
- number of Splunk events analyzed
- current response status

The initial status is `Response required`, because the user still needs to review the evidence and run the response action.

### AI Summary

The backend sends structured Splunk evidence to an AI explanation layer.  
In this demo, Gemini is used to generate a short case summary, risk explanation, and recommended response steps.

AI is used to explain the evidence, not to invent logs or automatically control the system.

### Evidence Timeline

Shows the detection path from Splunk logs:

```text
Supply Chain Entry
→ Execution
→ Credential Access
→ Command and Control
→ Privilege Escalation
```

Each stage includes the event type, risk signal, severity, time, and the reason it matters.

### Response Workspace

Lets the user run containment actions after reviewing the evidence.

Primary actions:

- Quarantine Pod
- Apply Deny-Egress NetworkPolicy

Follow-up actions:

- Rotate Service Account Token
- Open Dependency Review

When Kubernetes mode is enabled, the first two actions run against the local Kubernetes cluster using `kubectl`.

### Audit Trail

After a response action runs, CivicShield records the result in an audit trail. This helps show what action was taken, which workload was targeted, and whether the action succeeded.

## How Splunk Is Used

Splunk is the evidence source for this project.

The demo logs are stored in a Splunk index:

```text
civic_supply_chain_logs
```

The backend queries those Splunk events, maps them into risk signals, builds the evidence timeline, and creates a response playbook.

CivicShield does not replace Splunk. It adds an incident response workflow on top of Splunk data.

## Tech Stack

- React
- FastAPI
- Splunk Enterprise
- Gemini API
- Docker Desktop Kubernetes
- kubectl

## Project Structure

```text
backend/
  routes/
  services/
    splunk_client.py
    supply_chain_service.py
    response_action_service.py
    llm_service.py

frontend/
  src/
    pages/
    components/

k8s/
  demo/payment-api-demo.yaml

sample_data/
  supply_chain/supply_chain_incident.csv
```

## Setup

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
CIVICSHIELD_RESPONSE_MODE=kubernetes uvicorn main:app --reload --port 8001
```

Create `backend/.env`:

```env
SPLUNK_HOST=https://localhost:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=your_splunk_password
SPLUNK_INDEX=civic_supply_chain_logs

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

CIVICSHIELD_RESPONSE_MODE=kubernetes
```

Do not commit `.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### Kubernetes Demo

```bash
kubectl config use-context docker-desktop
kubectl apply -f k8s/demo/payment-api-demo.yaml
kubectl get pods -n checkout
```

## Quick Test

```bash
curl -s http://127.0.0.1:8001/api/supply-chain/episode | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['ai_explanation']['source']); print(d['evidence_timeline']['stage_count']); print(d['workflow_state']['phase'])"
```

Expected result:

```text
gemini_llm
5
awaiting_user_response
```

## Demo Flow

1. Show the Splunk security logs
2. Open CivicShield Case Overview
3. Open the AI Summary
4. Review the Evidence Timeline
5. Run Quarantine Pod
6. Run Apply Deny-Egress NetworkPolicy
7. Show the Audit Trail
8. Confirm the Kubernetes result with `kubectl`

Useful checks:

```bash
kubectl get pod payment-api-7f9d -n checkout --show-labels
kubectl get networkpolicy -n checkout
```

## Why This Matters

This project is not just a dashboard. It connects detection, investigation, and response.

Splunk provides the evidence.  
AI helps explain the incident.  
The user stays in control of response actions.  
Kubernetes actions provide real containment steps.  
The audit trail records what happened.

## Future Improvements

- Add native Splunk MCP Server integration
- Add support for Splunk Hosted Models
- Write response audit events back into Splunk
- Support multiple incident cases
- Add approval flow before high-impact response actions

## License

MIT