# EasyFlow

EasyFlow is an open-source, multi-tenant operational coordination layer for supply chain teams.

It sits above ERP, warehouse, logistics, supplier, and planning systems and turns raw operational data into:

- visual process flows
- tenant-isolated workspaces
- dashboards and risk views
- automation and event handling
- AI-assisted explanations through FlowGuide

EasyFlow is not trying to replace SAP, Oracle, Dynamics, NetSuite, Infor, or warehouse software. The goal is to make the operational work around those systems easier to see, understand, and act on.

## What EasyFlow does

EasyFlow helps teams answer questions like:

- What is delayed right now?
- Which approvals are still pending?
- Which warehouse or supplier needs attention first?
- Where is inventory coverage getting tight?
- What should happen next in the workflow?

Instead of pushing users through large ERP screens, spreadsheet follow-up, and inbox coordination, EasyFlow gives them a visual operating surface for daily work.

## Current product capabilities

The current codebase includes:

- Multi-tenant workspaces with isolated tenant routes under `apps/web/app/globe/tenant/[tenant]`
- A visual process canvas for business workflows
- Tenant modules for inventory, logistics, suppliers, users, automation, and logistics management
- A tenant overview page with operational KPIs, active process context, and risk intelligence
- FlowGuide, an AI assistant for tenant-scoped operational questions
- Webhook- and n8n-friendly integration architecture
- FastAPI backend services, RabbitMQ event flow, PostgreSQL/Prisma data models, and self-hosted deployment paths
- Public product pages for landing, connectors, docs, pitch, and architecture

## Product story

Most supply chain teams already have data. What they usually do not have is a good way to work through it.

The data lives across:

- ERP systems
- warehouse tools
- planning software
- supplier updates
- shipment portals
- spreadsheets
- email threads and follow-up calls

EasyFlow turns that fragmented operating reality into a single working surface. Warehouses, suppliers, products, approvals, orders, and shipments become connected business entities instead of scattered records.

That is the real value of the product:

- less status chasing
- clearer ownership
- earlier risk visibility
- better decisions from the same operational data

## Main user-facing areas

### Public product surface

- `/landing`
  - product entry page with animated supply chain visual
- `/pitch`
  - product pitch for the EasyFlow operating model
- `/connectors`
  - public connectors catalog
- `/docs`
  - product, architecture, and integration documentation
- `/architecture`
  - interactive architecture diagrams

### App surface

- `/globe`
  - tenant workspace entry with a **New Tenant** button for super admins
- `/globe/tenant/[tenant]`
  - tenant overview with sidebar nav: Dashboard, Canvas, Inventory, Logistics, Suppliers, Users, Automation & Integration, Logistic Management, Forecasting
- `/workflows`
  - business process canvas
- `/dashboard`
  - operational dashboard
- `/forecasting`
  - tenant-scoped forecasting: 12-week demand projection, inventory coverage gaps, supplier fill rate trends, and replenishment urgency scores — automatically filtered to the active tenant; super admins can toggle across tenants
- `/admin`
  - super admin portal: create and manage tenants, manage users, configure role permissions, system settings
- `/settings`
  - platform settings (General, Integrations, Notifications, Security) plus a **Users & Roles** tab where super admins can change user roles directly

### Tenant modules

Each tenant workspace currently exposes:

- Overview
- Canvas
- Inventory
- Logistics
- Suppliers
- Users
- Automation & Integration
- Logistic Management
- Forecasting

### Super admin capabilities

Super admins have access to two management surfaces:

**Admin Portal (`/admin`)**
- Create new tenants with a multi-step wizard (company info, supply chain modules, admin user, plan)
- Manage existing tenants (suspend, delete, view module config)
- Manage all platform users (invite, suspend, assign roles)
- Configure role permissions per role (Tenant Admin, Analyst, Operator)
- System-wide settings

**Settings (`/settings` → Users & Roles tab)**
- Quick role reassignment for any user without leaving the settings page
- Role changes persist immediately to local store

## FlowGuide AI assistant

FlowGuide is the tenant-scoped assistant layer inside EasyFlow.

Today it is designed to answer operational questions such as:

- Which SKUs are at risk?
- What orders are likely to slip?
- Which approvals are still pending?
- Which supplier is creating downstream pressure?
- What needs attention first?

Current implementation highlights:

- LangChain orchestration
- MCP-backed tenant tools
- Ollama/local model path
- provider abstraction for additional LLM backends
- tenant-scoped knowledge documents and risk signals

FlowGuide is built to reason over EasyFlow’s own operating context rather than generic prompting alone.

## Risk intelligence

The current web app also includes a local risk-intelligence layer that derives operational signals from tenant data, including:

- inventory pressure
- order slip risk
- supplier delay risk
- shipment exception risk

Those signals are surfaced in:

- tenant overview pages
- FlowGuide context
- tenant APIs under `/api/tenant/[slug]/risk-signals`

## Tech stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- React Flow / XYFlow

### Backend and runtime

- FastAPI
- Python
- RabbitMQ
- PostgreSQL
- Prisma
- Zod

### AI and agent layer

- LangChain
- MCP
- Ollama
- provider abstraction for additional LLM backends

### Local/self-hosted workflow

- Docker Compose
- n8n
- Neon-compatible database path for lighter deployments

## Repo structure

```text
EasyFlow/
├── apps/
│   ├── api/                  # FastAPI backend
│   └── web/                  # Next.js product UI
├── packages/
│   ├── connectors/           # Connector abstractions and webhook adapters
│   └── engine/               # Workflow engine
├── public/                   # README assets and exported diagrams
├── docker-compose.yml
├── ARCHITECTURE.md
├── DEPLOY_ORACLE_FREE.md
└── ORACLE_BEGINNER_STEPS.md
```

## Deployment paths

EasyFlow currently supports two practical deployment modes:

- Full self-hosted stack:
  - see [DEPLOY_ORACLE_FREE.md](DEPLOY_ORACLE_FREE.md)
- Frontend/demo-oriented path with hosted database:
  - see `apps/web` deployment notes and Vercel/Neon setup already used in the app

## Architecture diagrams

The repo now includes multiple architecture and flow diagrams in `public/` and in `apps/web/public/diagrams/`.

### 1. System Architecture

![System Architecture](public/System%20Architecture.png)

What it shows:

- the major layers of EasyFlow
- how the web app, API, workflow engine, connectors, queue, and storage fit together
- where external systems plug into the platform

Why it matters:

- this is the best top-level diagram for explaining EasyFlow to recruiters, engineers, or product stakeholders

### 2. End-to-End Architecture

![End-to-End Architecture](public/End-to-End_Arch.png)

What it shows:

- the full product path from external system signals to UI, workflows, and insight generation
- how operational data moves through the platform from ingestion to user-facing output

Why it matters:

- this is the strongest diagram for telling the “operating layer above raw enterprise data” story

### 3. Request Execution Flow

![Request Execution Flow](public/Request%20Execution%20Flow.png)

What it shows:

- how one business request or event flows through EasyFlow
- intake, processing, execution, and completion logic
- where workflow steps, services, and state transitions happen

Why it matters:

- this is the clearest diagram for showing how EasyFlow turns an event into action

### 4. Tenant Isolation Architecture

![Tenant Isolation Architecture](public/Tenant%20Isolation%20Architecture.png)

What it shows:

- how tenant isolation is modeled
- how workspaces, data boundaries, and per-tenant execution stay separated

Why it matters:

- this is the best diagram for explaining the multi-tenant design of the platform

### 5. MCP AI Agent Architecture

![MCP AI Agent Architecture](public/MCP%20AI%20agent%20architecture%20flowchart.png)

What it shows:

- how FlowGuide uses the MCP/tool layer
- how tenant-scoped operational context is exposed to the AI layer
- how the assistant reasons over data instead of relying only on free-form prompting

Why it matters:

- this is the most important diagram for explaining the agentic AI side of EasyFlow

### 6. SVG diagram set used by the app

The app also includes SVG versions under `apps/web/public/diagrams/`:

- `apps/web/public/diagrams/platform-architecture.svg`
- `apps/web/public/diagrams/execution-flow.svg`
- `apps/web/public/diagrams/tenant-isolation.svg`

These power the interactive architecture viewer in the app and provide lighter-weight visual assets for docs and UI.

## What the diagrams collectively explain

Taken together, the diagram set explains:

1. how the whole system is organized
2. how one request flows through it
3. how multi-tenancy is enforced
4. how the AI assistant is grounded in tenant-specific tools and data

That means the repo now includes both:

- product-facing visuals
- engineering-facing architecture visuals

## Current business use cases

EasyFlow is currently strongest as a foundation for:

- inventory and replenishment coordination
- approval tracking and handoff visibility
- shipment and logistics follow-up
- supplier risk and downstream impact visibility
- tenant-scoped operational Q&A with AI

## What is implemented vs. what is still a framework

Implemented today:

- multi-tenant app shell and tenant routes
- business process canvas
- tenant overview and modules
- FlowGuide assistant
- risk signal generation
- webhook/API architecture
- RabbitMQ-based event path
- architecture/pitch/connectors public product surface

Framework/integration-ready but not fully production-validated against specific enterprise tenants:

- direct live ERP integrations across every vendor
- large-scale production telemetry and observability
- enterprise-grade customer deployment validation

The right framing is:

EasyFlow already implements the operating layer, workflow surface, AI layer, and architecture. Specific system integrations can be validated and extended in real customer environments without changing the core product idea.

## Open-source setup

EasyFlow is meant to be forked, extended, and adapted.

If you want to use this project on your own machine, contribute new modules, improve the workflow engine, connect additional systems, or build your own product variant on top of it, the fastest path is:

1. clone the repo
2. configure the local environment
3. run the web app
4. optionally run the API, RabbitMQ, n8n, and local AI stack
5. seed demo data so the UI has realistic workspaces

## Prerequisites

Minimum developer setup:

- Node.js 20+
- npm 10+
- Python 3.11+
- `uv` for the FastAPI app
- PostgreSQL if you want persistent local data

Optional local stack:

- Docker + Docker Compose
- RabbitMQ
- n8n
- Ollama for local AI

## Quick start

### 1. Clone the repo

```bash
git clone https://github.com/achyutuni2001/EasyFlow.git
cd EasyFlow
```

### 2. Install the web app dependencies

```bash
cd apps/web
npm install
```

### 3. Create local environment files

Web app:

```bash
cp apps/web/.env.example apps/web/.env
```

API and shared services:

```bash
cp .env.example .env
```

### 4. Set the minimum values

For the web app, the most important values are:

- `NEXT_PUBLIC_APP_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `PRISMA_DATABASE_URL`
- `PRISMA_TENANT_DATABASE_URL`

For the API/shared stack, the most important values are:

- `PRISMA_DATABASE_URL`
- `PRISMA_TENANT_DATABASE_URL`
- `RABBITMQ_URL`
- `WEBHOOK_SECRET_KEY`
- `APP_PUBLIC_URL`
- `PUBLIC_API_URL`

If you are only running the frontend demo locally, you can start with:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-32-byte-secret
AI_PROVIDER=heuristic
LOCAL_LLM_ENABLED=false
```

## Local development paths

There are two useful ways to run EasyFlow locally.

### Path A: product UI first

Use this if you want to explore the UI, docs, pitch, tenant pages, and seeded demo experience with minimal setup.

```bash
cd apps/web
npm run prisma:generate
npm run dev
```

If the Next.js UI goes stale during development:

```bash
cd apps/web
npm run dev:clean
```

### Path B: fuller local stack

Use this if you want the product UI plus the FastAPI backend, RabbitMQ event flow, webhook handling, or local automation services.

Web app:

```bash
cd apps/web
npm run prisma:generate
npm run dev
```

API:

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
```

## Database and Prisma setup

If you want persistent local data instead of purely seeded in-memory/demo behavior, initialize Prisma first.

From `apps/web`:

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:push
```

Tenant schema generation is already included in `prisma:generate`.

## Seed demo data

The easiest way to make the app feel complete locally is to seed one of the built-in datasets.

From `apps/web`:

```bash
npm run seed:demo
```

There is also a richer sample dataset:

```bash
npm run seed:dataco
```

These seeds populate demo tenants, products, orders, shipments, suppliers, approvals, and automation/risk-related records used across the UI.

## Full self-hosted stack with Docker

If you want the broader local platform, use the root `docker-compose.yml`.

That stack includes:

- PostgreSQL
- RabbitMQ
- n8n
- the API service

Run from the repo root:

```bash
docker compose up --build
```

Why this path exists:

- RabbitMQ backs the event-driven workflow path
- n8n provides the integration and automation bridge
- the API receives inbound events and publishes operational work into the platform

## Local AI setup

EasyFlow can run without any paid AI dependency.

The default safest local mode is:

```env
AI_PROVIDER=heuristic
LOCAL_LLM_ENABLED=false
```

If you want local model-backed FlowGuide with Ollama:

1. install Ollama
2. pull the model you want
3. enable the local provider

Example:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Then in `apps/web/.env`:

```env
AI_PROVIDER=ollama
LOCAL_LLM_ENABLED=true
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
LOCAL_LLM_MODEL=llama3.1:8b
LOCAL_EMBEDDING_MODEL=nomic-embed-text
```

Hosted provider options are also supported through the same abstraction layer:

- OpenAI
- Gemini

Those are optional. The project does not require them to run.

## Authentication notes

The product uses `better-auth`.

For local demo usage:

- keep `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` unless you have a real Google OAuth setup
- set a local `BETTER_AUTH_SECRET`

If you want Google sign-in later, populate:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Contributing

Contributions are welcome if you want to:

- improve the workflow canvas
- add new tenant modules
- improve synthetic/demo data realism
- add connectors or n8n templates
- extend FlowGuide and the MCP/LLM layer
- improve docs, diagrams, or deployment paths

Recommended contribution flow:

1. fork the repo
2. create a feature branch
3. run the app locally
4. keep changes scoped to one area
5. verify the relevant scripts before opening a PR

Suggested branch flow:

```bash
git checkout -b feature/your-change
```

Before opening a PR, verify what you changed.

Frontend checks:

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

API checks:

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
```

Good contribution targets:

- new workflow templates
- additional connectors
- better admin tooling
- improved risk scoring logic
- better tenant seed packs
- AI provider integrations
- bug fixes in public pages and product UI

## Where to extend the product

If you want to build on top of EasyFlow, these areas matter most:

- `apps/web/app`
  - routes, public pages, tenant pages, dashboards, workflows
- `apps/web/components`
  - reusable product UI
- `apps/web/lib/assistant`
  - FlowGuide, providers, MCP, retrieval, risk context
- `apps/web/lib/automation`
  - event simulation and automation behavior
- `apps/web/lib/risk-signals.ts`
  - derived operational risk signals
- `apps/api/app`
  - webhook ingestion, worker flow, messaging
- `packages/engine`
  - workflow execution
- `packages/connectors`
  - integration abstractions

## How to contribute diagrams and docs

If you extend the architecture or product story:

- add or update diagrams in `public/`
- add SVG app-facing diagrams in `apps/web/public/diagrams/`
- update `README.md`
- update `ARCHITECTURE.md` if the system model changes

The current diagram set is meant to help future contributors understand the system quickly, so keeping it in sync is valuable work.

## If you are forking this project

Forking is a reasonable path if you want to:

- adapt EasyFlow to a different vertical
- build a private internal operations platform
- test a different AI backend strategy
- turn it into a healthcare, manufacturing, logistics, or enterprise workflow product

Recommended first steps after forking:

1. rename the branding assets
2. update the public product pages
3. replace the demo tenant seeds
4. review environment variables
5. decide whether your product is frontend-first, API-first, or fully self-hosted

## Related docs

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEPLOY_ORACLE_FREE.md](DEPLOY_ORACLE_FREE.md)
- [ORACLE_BEGINNER_STEPS.md](ORACLE_BEGINNER_STEPS.md)

## Summary

EasyFlow is a visual operational layer on top of raw enterprise supply chain data.

It combines:

- tenant-isolated workspaces
- workflow execution and coordination
- operational visibility
- risk intelligence
- AI-assisted explanation

The codebase already reflects that direction, and the diagrams in this repo make the architecture and product story easier to understand for both technical and non-technical readers.
