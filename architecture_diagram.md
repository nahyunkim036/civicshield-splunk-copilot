# CivicShield Architecture

CivicShield connects Splunk security logs, AI explanation, and Kubernetes response actions into one incident response workflow.

## High-Level Flow

```mermaid
flowchart TD
    A[Kubernetes / Supply-Chain Security Logs] --> B[Splunk Enterprise]
    B --> C[Index: civic_supply_chain_logs]

    C --> D[FastAPI Backend]
    D --> E[Splunk Client]
    E --> F[Incident Analysis Service]

    F --> G[Case Overview Data]
    F --> H[Evidence Timeline]
    F --> I[Response Playbook]

    G --> J[AI Explanation Layer]
    H --> J
    I --> J

    J --> K[Gemini LLM]
    J --> L[Local Fallback Explanation]

    G --> M[React Frontend]
    H --> M
    I --> M
    J --> M

    M --> N[Case Overview]
    M --> O[Evidence Timeline Page]
    M --> P[Response Workspace]

    P --> Q[FastAPI Response Routes]
    Q --> R[kubectl]
    R --> S[Docker Desktop Kubernetes]

    S --> T[Quarantine Pod Label]
    S --> U[Deny-Egress NetworkPolicy]

    Q --> V[Audit Trail]
    V --> M
```

## What Each Part Does

| Part | Role |
|---|---|
| Splunk Enterprise | Stores the security logs and acts as the evidence source |
| FastAPI Backend | Queries Splunk, analyzes events, and builds the incident workflow |
| Splunk Client | Reads events from the Splunk index |
| Incident Analysis Service | Maps raw events into risk signals, risk score, case summary, and evidence stages |
| AI Explanation Layer | Sends structured evidence to Gemini and receives readable explanations |
| React Frontend | Shows the case overview, evidence timeline, response workspace, and audit trail |
| Kubernetes | The target environment where containment actions are applied |
| Audit Trail | Records user-triggered response actions |

## Splunk Data Flow

```mermaid
sequenceDiagram
    participant Logs as Security Logs
    participant Splunk as Splunk Enterprise
    participant Backend as FastAPI Backend
    participant AI as AI Explanation Layer
    participant UI as React Frontend

    Logs->>Splunk: Index Kubernetes security events
    UI->>Backend: Request incident case
    Backend->>Splunk: Query civic_supply_chain_logs
    Splunk-->>Backend: Return raw security events
    Backend->>Backend: Build risk signals and evidence timeline
    Backend->>AI: Send structured Splunk evidence
    AI-->>Backend: Return case summary and stage explanations
    Backend-->>UI: Return case, timeline, playbook, and AI summary
```

## Response Flow

```mermaid
sequenceDiagram
    participant User as Security Operator
    participant UI as React Frontend
    participant Backend as FastAPI Backend
    participant K8s as Kubernetes
    participant Audit as Audit Trail

    User->>UI: Review case and evidence
    User->>UI: Click Quarantine Pod
    UI->>Backend: POST /api/response/quarantine
    Backend->>K8s: kubectl label pod quarantine=true
    K8s-->>Backend: Return command result
    Backend->>Audit: Record action result
    Backend-->>UI: Show response status

    User->>UI: Click Apply NetworkPolicy
    UI->>Backend: POST /api/response/network-policy
    Backend->>K8s: Apply deny-egress NetworkPolicy
    K8s-->>Backend: Return command result
    Backend->>Audit: Record action result
    Backend-->>UI: Show response status
```

## Design Notes

CivicShield keeps the response workflow human-in-the-loop.

The AI explanation layer helps the user understand the Splunk evidence, but it does not execute actions automatically. The user reviews the evidence first, then chooses whether to run Kubernetes containment actions.

Splunk remains the source of truth for the incident evidence. CivicShield adds a workflow layer for investigation, explanation, response, and audit.

## Future Architecture Ideas

The current demo uses Gemini as the external LLM provider. A future version could replace or extend this layer with:

- Splunk MCP Server
- Splunk Hosted Models
- Splunk AI Assistant workflows
- response audit events written back into Splunk