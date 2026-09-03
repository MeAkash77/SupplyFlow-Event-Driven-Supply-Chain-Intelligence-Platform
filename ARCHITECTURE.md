# EasyFlow Architecture

EasyFlow is a multi-tenant process operating system for supply chain teams. Each tenant defines its own business process graph, the UI operates on that graph, the API governs tenant and workflow access, and the runtime executes workflow events asynchronously through RabbitMQ.

## Product Architecture

```mermaid
flowchart LR
  subgraph Users["Users"]
    SA["Superadmin"]
    TA["Tenant Admin"]
    AN["Analyst / Operator"]
  end

  subgraph Web["apps/web · Next.js + Tailwind + shadcn"]
    UI1["Business Process Canvas"]
    UI2["Tenant Dashboards"]
    UI3["Connector & Settings UI"]
    UI4["AI Insights Route"]
  end

  subgraph API["apps/api · FastAPI"]
    API1["Auth + Access Control"]
    API2["Tenant Registry"]
    API3["Workflow APIs"]
    API4["Connector APIs"]
    API5["Notification Publisher"]
  end

  subgraph Data["Persistence Layer"]
    DB1["Central Registry DB\n tenants · users · connectors"]
    DB2["Tenant Workflow Data\n workflow defs · nodes · edges"]
  end

  subgraph Runtime["Async Runtime"]
    MQ["RabbitMQ Event Bus"]
    WK["Worker"]
    ENG["Workflow Engine\n packages/engine"]
    MET["Prometheus Metrics"]
  end

  subgraph Ext["External Systems"]
    SDK["Connector SDK\n packages/connectors"]
    ERP["ERP / WMS / SCM APIs"]
    AI["LLM Provider"]
    CH["Slack / Email / Alerts"]
  end

  SA --> UI1
  SA --> UI3
  TA --> UI1
  TA --> UI2
  TA --> UI3
  AN --> UI2

  UI1 --> API3
  UI2 --> API2
  UI2 --> API3
  UI3 --> API4
  UI4 --> AI

  API1 --> DB1
  API2 --> DB1
  API3 --> DB1
  API3 --> DB2
  API4 --> DB1
  API5 --> MQ

  API3 --> MQ
  MQ --> WK
  WK --> ENG
  WK --> DB1
  WK --> DB2
  WK --> MET
  WK --> SDK
  SDK --> ERP
  WK --> CH
```

## Request To Execution Flow

```mermaid
sequenceDiagram
  participant U as Tenant Admin
  participant W as Web Canvas
  participant A as FastAPI
  participant R as Registry DB
  participant T as Tenant Workflow Data
  participant M as RabbitMQ
  participant K as Worker
  participant E as Workflow Engine
  participant C as Connector SDK
  participant X as ERP/WMS

  U->>W: Create or edit business process
  W->>A: Save workflow / simulate workflow
  A->>R: Validate actor and tenant scope
  A->>T: Read workflow definition
  A->>M: Publish workflow event
  M->>K: Deliver event to worker
  K->>R: Resolve tenant DB location
  K->>T: Load nodes and edges
  K->>E: Validate and execute graph
  E-->>K: Execution state + event timeline
  K->>C: Invoke connector if needed
  C->>X: Call ERP / WMS / external API
  K->>M: Publish completion / retry / alert event
  K-->>W: Metrics and status become observable through API/UI
```

## Tenant Isolation Model

```mermaid
flowchart TB
  SA["Superadmin"] --> ALL["Cross-tenant control"]

  subgraph T1["Tenant A"]
    A1["Tenant Admin A"]
    A2["Users A"]
    A3["Process Graph A"]
    A4["Connector Config A"]
  end

  subgraph T2["Tenant B"]
    B1["Tenant Admin B"]
    B2["Users B"]
    B3["Process Graph B"]
    B4["Connector Config B"]
  end

  A1 --> A2
  A1 --> A3
  A1 --> A4

  B1 --> B2
  B1 --> B3
  B1 --> B4

  SA --> T1
  SA --> T2
```

## What Each Layer Owns

- `apps/web`
  Customer-facing product shell, tenant dashboards, business process canvas, forecasting views, connector setup, and AI analysis UI.

- `apps/api`
  Tenant creation, RBAC enforcement, workflow access, connector registration, alert publishing, and runtime-facing service endpoints.

- `packages/engine`
  Graph validation, workflow simulation, node/edge execution modeling, and execution timeline generation.

- `apps/api/app/worker.py`
  RabbitMQ consumer, retry and DLQ behavior, workflow execution handoff, and Prometheus metrics.

- `packages/connectors`
  Pluggable integration layer for SAP, Oracle, Relex, and generic HTTP-based systems.

## Current Product Shape

Today, EasyFlow is best understood as:

1. A tenant-aware process design surface.
2. A workflow API and access-control layer.
3. An event-driven execution runtime.
4. A connector-ready orchestration layer.
5. An emerging AI insight layer on top of operational graph data.

## Next Architecture Upgrades

- Persist process graphs and execution history fully in Neon/Postgres.
- Add live event streaming from RabbitMQ into the UI.
- Move AI insights behind a dedicated orchestration service instead of a direct web route.
- Add connector credential vaulting and per-tenant secret isolation.
- Add real workflow execution state machines instead of simulation-first execution.
