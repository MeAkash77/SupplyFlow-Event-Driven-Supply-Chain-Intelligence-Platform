export type TocItem = { label: string; anchor: string; level: 2 | 3 };

export type DocBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "callout"; variant: "info" | "warning" | "tip"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "steps"; items: { title: string; body: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: string[] };

export type DocContent = {
  section: string;
  title: string;
  description: string;
  toc: TocItem[];
  blocks: DocBlock[];
};

export const DOCS_CONTENT: Record<string, DocContent> = {

  // ══════════════════════════════════════════════════════════════════════════
  // WHY EASYFLOW
  // ══════════════════════════════════════════════════════════════════════════

  "the-problem": {
    section: "Why EasyFlow",
    title: "The Problem We Solve",
    description: "Why supply chain teams are still stuck with spreadsheets, email chains, and missed shipments, and what we're doing about it.",
    toc: [
      { label: "The daily reality", anchor: "reality", level: 2 },
      { label: "Where things break down", anchor: "breakdown", level: 2 },
      { label: "The cost of broken coordination", anchor: "cost", level: 2 },
      { label: "What AI adds", anchor: "ai-layer", level: 2 },
      { label: "What EasyFlow changes", anchor: "solution", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "reality", text: "The daily reality of supply chain teams" },
      { type: "p", text: "Ask any supply chain manager how they coordinate purchase orders, supplier confirmations, and warehouse handoffs. The honest answer is usually: email threads, shared chats, and an enormous spreadsheet that only one person really understands." },
      { type: "p", text: "Their operational systems may include SAP, Oracle, Microsoft Dynamics, NetSuite, Infor, or other planning and warehouse tools. Those systems hold the data, but they still do not answer the question that matters every morning: what needs to happen right now, who owns it, and is anything stuck?" },
      { type: "p", text: "Even when the data is technically available, it is still hard to interrogate. Teams can see rows and reports, but they cannot ask the system to explain why inventory is falling, which supplier is now causing downstream risk, or what needs attention first." },
      { type: "callout", variant: "info", text: "A 2023 Gartner study found that 67% of supply chain professionals still rely on spreadsheets as their primary coordination tool, despite using enterprise ERP systems." },

      { type: "h2", id: "breakdown", text: "Where things break down" },
      { type: "p", text: "The breakdown isn't the ERP. The breakdown is the coordination layer that sits between the ERP and the humans who act on its data." },
      { type: "table", headers: ["Situation", "What happens without EasyFlow"], rows: [
        ["Stock hits reorder point", "ERP generates an alert. It goes to one inbox. That person is on holiday. Stock-out happens."],
        ["Purchase order needs approval", "Email sent to manager. Sits in inbox. No escalation. PO delayed 3 days. Supplier misses slot."],
        ["Shipment dispatched", "Warehouse team knows. Finance doesn't. Customer service doesn't. Calls start coming in."],
        ["Supplier rejects quantity", "Phone call made. Manually updated in ERP. Canvas note added. Someone forgets to tell logistics."],
        ["New supplier onboarding", "20-step checklist in Word. Emailed around. Half the steps skipped. Compliance team unhappy."],
      ]},

      { type: "h2", id: "cost", text: "The cost of broken coordination" },
      { type: "list", items: [
        "Stock-outs cost retailers an average of 4% of annual revenue. Many are caused by delayed reorder approvals, not forecasting errors.",
        "Purchase order approval delays average 3.2 days in mid-market companies. That's 3.2 days of supplier slot risk on every order.",
        "Logistics teams spend 40% of their time chasing status updates that should be automatic.",
        "Every manual handoff is a potential error. Manual re-entry of ERP data into spreadsheets introduces mistakes in 1 in 12 entries.",
      ]},

      { type: "h2", id: "ai-layer", text: "What AI adds" },
      { type: "p", text: "The problem is not just missing workflow. It is also missing interpretation. Supply chain teams need a system that can explain what changed, why it matters, and what should happen next." },
      { type: "p", text: "That is why EasyFlow includes an AI agent layer. FlowGuide sits on top of the same tenant-scoped operational data and helps users ask natural questions such as: which warehouse needs attention, why is a shipment delayed, what approvals are blocking progress, or which SKU is likely to stock out first." },
      { type: "callout", variant: "tip", text: "EasyFlow is designed so the AI agent does not replace operations teams. It helps them interpret raw enterprise data faster and act with more context." },

      { type: "h2", id: "solution", text: "What EasyFlow changes" },
      { type: "p", text: "EasyFlow is the coordination layer that was missing. It sits on top of your existing ERP and gives every supply chain process a clear owner, a clear next step, and automatic escalation when something gets stuck." },
      { type: "p", text: "Your ERP remains the system of record. EasyFlow becomes the system of action and interpretation, the place where people do the work, track the handoffs, see what is happening right now, and ask the AI agent to explain what needs attention." },
      { type: "list", items: [
        "Draw your exact approval process on a visual canvas, not someone else's template",
        "Every step has an owner, a deadline, and automatic escalation",
        "Your ERP data flows in via webhooks, with no manual re-entry",
        "AI helps teams interrogate the operational state in plain language instead of reading raw tables only",
        "Every company gets its own isolated workspace, with no data mixing",
        "100% open source, so you can run it on your own servers without SaaS fees",
      ]},
    ],
  },

  "business-use-cases": {
    section: "Why EasyFlow",
    title: "Business Use Cases",
    description: "Concrete business situations where EasyFlow removes delay, confusion, and manual coordination work.",
    toc: [
      { label: "Purchase order approvals", anchor: "po-approvals", level: 2 },
      { label: "Low-stock replenishment", anchor: "replenishment", level: 2 },
      { label: "Supplier coordination", anchor: "suppliers", level: 2 },
      { label: "Shipment visibility", anchor: "shipments", level: 2 },
      { label: "3PL multi-client operations", anchor: "3pl", level: 2 },
      { label: "Why buyers choose EasyFlow", anchor: "why-buy", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "po-approvals", text: "Use case 1 — Purchase order approvals" },
      { type: "p", text: "A buyer raises a purchase order. Finance needs to review orders above a threshold. Operations needs to sign off if the order affects warehouse capacity. In many companies this is still managed through email and spreadsheets." },
      { type: "table", headers: ["Without EasyFlow", "With EasyFlow"], rows: [
        ["Approval emails sit in inboxes and get missed", "Every approval has an owner, deadline, and escalation"],
        ["No one knows the current status of the PO", "Dashboard shows exactly which step is active and who owns it"],
        ["Supplier slot is missed because approval was late", "Fast routing reduces approval delay and keeps supplier timing on track"],
      ]},

      { type: "h2", id: "replenishment", text: "Use case 2 — Low-stock replenishment" },
      { type: "p", text: "Stock drops below a threshold in the ERP. The business does not need another report. It needs a clear action path: who reviews the shortage, who approves the reorder, and who informs suppliers." },
      { type: "list", items: [
        "ERP or n8n sends a stock_low_alert event into EasyFlow",
        "EasyFlow starts the replenishment workflow automatically",
        "Procurement, warehouse, and supplier teams each get their part of the process",
        "Managers see risk before it becomes a stock-out",
      ]},

      { type: "h2", id: "suppliers", text: "Use case 3 — Supplier coordination" },
      { type: "p", text: "Suppliers reject quantities, confirm partial orders, change delivery dates, and create exceptions that need fast coordination across procurement, warehouse, and logistics teams. EasyFlow gives those exceptions a visible workflow instead of leaving them in chat threads and calls." },

      { type: "h2", id: "shipments", text: "Use case 4 — Shipment visibility and handoffs" },
      { type: "p", text: "When a shipment is dispatched, multiple teams need to know: warehouse, logistics, customer service, and sometimes finance. EasyFlow can turn shipment_dispatched and shipment_delivered events into visible handoff workflows, notifications, and audit trails." },

      { type: "h2", id: "3pl", text: "Use case 5 — 3PL and multi-client operations" },
      { type: "p", text: "Third-party logistics providers often run the same process pattern for many clients, but every client still needs isolated data and its own workflow rules. EasyFlow's tenant model fits this cleanly: one platform, many client workspaces, no data leakage." },
      { type: "callout", variant: "info", text: "This is one of EasyFlow's strongest business cases: it lets a 3PL operate like a managed workflow platform without building a separate system for each client." },

      { type: "h2", id: "why-buy", text: "Why buyers choose EasyFlow" },
      { type: "table", headers: ["Buyer concern", "How EasyFlow answers it"], rows: [
        ["'We already have an ERP'", "EasyFlow does not replace the ERP. It adds the workflow and visibility layer the ERP is missing."],
        ["'We cannot afford a large implementation'", "EasyFlow is open source, self-hostable, and can be started in hours instead of months."],
        ["'Our teams are stuck in spreadsheets'", "EasyFlow replaces manual coordination with visible, owned, trackable process steps."],
        ["'We need something our business users can understand'", "The canvas, dashboards, and workspaces are built for operators, not system administrators."],
      ]},
    ],
  },

  "project-vision": {
    section: "Why EasyFlow",
    title: "Project Vision & Status",
    description: "The product idea behind EasyFlow, the work completed so far, and the direction this project is intended to grow into.",
    toc: [
      { label: "The idea", anchor: "idea", level: 2 },
      { label: "What exists today", anchor: "today", level: 2 },
      { label: "What this can become", anchor: "future", level: 2 },
      { label: "What is not claimed yet", anchor: "not-claimed", level: 2 },
      { label: "Why open source matters", anchor: "open-source", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "idea", text: "The idea behind EasyFlow" },
      { type: "p", text: "EasyFlow starts from a simple observation: most supply chain teams already have data somewhere, but they still do the real coordination work through inboxes, calls, spreadsheets, and status chasing. The product idea is to create a supply chain coordination layer that sits above operational systems and turns data changes into visible work." },
      { type: "p", text: "In that model, the ERP remains the system of record. EasyFlow becomes the place where people see the next action, approvals, exceptions, delays, ownership, and escalation. It is less about replacing existing systems and more about making them usable for day-to-day operations." },
      { type: "callout", variant: "tip", text: "The long-term product direction is a self-hostable operational control layer for supply chain teams: workflow-first, integration-friendly, multi-tenant, and understandable by business users rather than only system administrators." },

      { type: "h2", id: "today", text: "What exists today" },
      { type: "p", text: "This project is no longer just a concept. A meaningful amount of the core platform has already been designed, implemented, and documented." },
      { type: "list", items: [
        "A Next.js web application with landing pages, product docs, login, dashboard views, workflow surfaces, and tenant-oriented UI",
        "A FastAPI backend with webhook ingestion, token validation, payload normalization, and integration entry points",
        "A local full-stack architecture using Docker Compose with web, API, Postgres, RabbitMQ, and n8n",
        "An event-driven workflow path where inbound operational events can be accepted, normalized, queued, and handed into execution logic",
        "A tenant-scoped local operational event feed that can fire stock, shipment, approval, supplier, and purchase-order signals into the automation layer for development, demos, and workflow testing",
        "n8n workflow templates and a connector catalog that define how external ERP-style systems can feed data into EasyFlow",
        "Databricks risk intelligence integration — SQL Statement API client, risk_signal_feed Delta table, hourly ingest endpoint, and live canvas overlay with colored edge propagation",
        "ML-scored risk signals surfaced live on the workflow canvas — nodes show risk level, affected edges are re-colored and animated, and FlowGuide uses Databricks signals as high-signal context",
        "Prisma schemas and Zod types on the web side to create a typed model layer and cleaner future deployment paths",
        "Beginner-friendly deployment documentation, architecture pages, webhook reference material, and integration guides",
      ]},
      { type: "callout", variant: "info", text: "The current state should be understood as an implemented open-source foundation: product UI, local architecture, typed models, webhook intake, Databricks risk pipeline, queue-backed processing, and integration patterns are all in place, even though not every production environment has been validated yet." },

      { type: "h2", id: "future", text: "What this can become" },
      { type: "p", text: "If developed further, EasyFlow can evolve into a serious operations platform for mid-market supply chain teams, 3PLs, and companies that need more than spreadsheets but do not want a heavyweight enterprise implementation." },
      { type: "table", headers: ["Direction", "What it means"], rows: [
        ["Stronger workflow execution", "More complete node types, approvals, escalation rules, SLAs, retries, and action automation"],
        ["Deeper operational visibility", "Dashboards for bottlenecks, overdue tasks, approval cycle time, supplier performance, and shipment risk"],
        ["Broader integration coverage", "More validated source mappings, more n8n templates, and more community/customer-tested ERP pathways"],
        ["3PL / multi-organization model", "A single platform serving many isolated client workspaces with different rules and workflows"],
        ["Production deployment maturity", "Cleaner hosted and self-hosted deployment patterns, secrets handling, observability, and operational hardening"],
      ]},
      { type: "p", text: "The direction is deliberate: start with workflow coordination and visibility, then expand into a more complete operating layer around procurement, inventory, supplier, and logistics workflows." },

      { type: "h2", id: "not-claimed", text: "What is not claimed yet" },
      { type: "p", text: "This documentation does not claim that EasyFlow is already a fully validated enterprise product with official vendor partnerships or certified production integrations." },
      { type: "list", items: [
        "It does not claim direct production validation inside live SAP, Oracle, Dynamics, or NetSuite customer environments",
        "It does not claim official certification, vendor partnership status, or enterprise support contracts",
        "It does not claim that every comparison point on this site has been benchmarked through paid commercial deployments",
      ]},
      { type: "callout", variant: "warning", text: "The honest position is: EasyFlow implements the architecture and product direction for this kind of platform, and it is locally testable today. Real ERP-side validation still depends on access to customer systems or community contributors who can test against them." },

      { type: "h2", id: "open-source", text: "Why open source matters here" },
      { type: "p", text: "Open source is not just a licensing choice for EasyFlow. It is part of the product strategy. Supply chain tooling is often expensive, locked down, and inaccessible to smaller teams. By keeping the platform open, EasyFlow stays inspectable, adaptable, and easier for real operators or developers to extend." },
      { type: "p", text: "Integration maturity works in stages. EasyFlow provides the integration framework first: webhook contracts, n8n-based automation patterns, tenant-safe event ingestion, and extensible connector pathways. Production validation for specific ERP environments then happens through customer deployments, implementation partners, or community contributors operating against real systems." },
      { type: "callout", variant: "tip", text: "The strongest way to read EasyFlow today is as a serious open-source product foundation: the idea is clear, the architecture is real, the workflow and integration paths are implemented, and the next stage is customer-side and community-side validation in real environments." },
    ],
  },

  "vs-alternatives": {
    section: "Why EasyFlow",
    title: "vs. Existing Solutions",
    description: "How EasyFlow is positioned against ERP workflow modules, enterprise planning suites, generic work tools, and spreadsheets.",
    toc: [
      { label: "The landscape", anchor: "landscape", level: 2 },
      { label: "vs. ERP workflow layers", anchor: "vs-erp", level: 2 },
      { label: "vs. Enterprise planning suites", anchor: "vs-enterprise", level: 2 },
      { label: "vs. Generic work tools", anchor: "vs-pm", level: 2 },
      { label: "vs. Spreadsheets", anchor: "vs-sheets", level: 2 },
      { label: "Feature comparison", anchor: "comparison", level: 2 },
      { label: "What is implemented so far", anchor: "current-status", level: 2 },
      { label: "The EasyFlow position", anchor: "position", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "landscape", text: "The landscape" },
      { type: "p", text: "Supply chain software exists on a spectrum from deeply embedded ERP workflow modules to generic collaboration tools. EasyFlow is aimed at the gap in the middle: teams that already have operational data somewhere, but still lack a clear coordination layer for approvals, handoffs, escalation, and visibility." },
      { type: "callout", variant: "info", text: "This page explains EasyFlow's product direction and architecture. It does not claim certified partnerships with SAP, Oracle, Microsoft, or other vendors. Where vendor names appear, they are examples of the kind of ERP environments EasyFlow is designed to sit alongside." },

      { type: "h2", id: "vs-erp", text: "vs. SAP, Oracle, Microsoft Dynamics" },
      { type: "p", text: "ERPs are the system of record. EasyFlow is designed as the layer on top that turns ERP events into owned work, visible status, and faster operational follow-through." },
      { type: "list", items: [
        "ERP workflow tooling is often admin-heavy and change-managed around the ERP itself, which makes day-to-day operational iteration slower.",
        "Business users usually need a simpler view of who owns the next step, what is blocked, and what is overdue right now.",
        "EasyFlow is designed so workflow structure can be changed quickly without changing the ERP's role as the source of truth.",
        "The goal is not ERP replacement. The goal is a cleaner coordination and visibility layer around the ERP data teams already rely on.",
      ]},
      { type: "callout", variant: "tip", text: "EasyFlow does not replace the ERP. It is built to receive ERP-shaped events through webhooks or n8n, then route work across teams in a way operators can understand." },

      { type: "h2", id: "vs-enterprise", text: "vs. Kinaxis, Blue Yonder, o9 Solutions" },
      { type: "p", text: "Large supply chain platforms solve broad planning and optimization problems. EasyFlow is narrower by design. It focuses on execution-side coordination: approvals, exceptions, handoffs, and multi-team visibility." },
      { type: "table", headers: ["", "Kinaxis / Blue Yonder", "EasyFlow"], rows: [
        ["Primary focus", "Enterprise planning and optimization", "Workflow coordination and operational visibility"],
        ["Typical buyer", "Large enterprises with specialist implementation teams", "Smaller teams, operators, 3PLs, and self-hosted builders"],
        ["Change model", "Platform-led implementation programs", "Team-owned workflow changes"],
        ["Hosting model", "Usually vendor-managed", "Self-hosted or customer-controlled"],
        ["Source code", "Closed, proprietary", "Fully open source"],
      ]},

      { type: "h2", id: "vs-pm", text: "vs. Monday.com, Asana, Notion" },
      { type: "p", text: "Generic project management tools are flexible, but they are not built around operational events, supplier exceptions, stock risk, or ERP-originated workflow triggers." },
      { type: "list", items: [
        "They usually start with manual cards or tasks instead of machine-generated operational events.",
        "Approval rules, escalation paths, and tenant isolation are not the core product model.",
        "They can be adapted for coordination, but supply-chain-specific workflow behavior must usually be assembled manually.",
        "EasyFlow is built around event-driven work, role ownership, and operational dashboards from the start.",
      ]},

      { type: "h2", id: "vs-sheets", text: "vs. Spreadsheets" },
      { type: "p", text: "Spreadsheets are the default because they're flexible. But they are also the root cause of most supply chain coordination failures:" },
      { type: "table", headers: ["Spreadsheet problem", "EasyFlow solution"], rows: [
        ["One person owns the master sheet. If they're sick, nothing moves.", "Flows are shared. Anyone with the right role can act."],
        ["No automatic escalation when a deadline passes.", "Every step has a deadline. Overdue tasks automatically escalate."],
        ["No audit trail — you don't know who changed what, when.", "Every action is logged. Full audit trail per tenant."],
        ["No connection to ERP — data is manually copied in.", "ERP data flows in automatically via webhook or n8n."],
        ["Version control is chaos — v12_final_FINAL_v2.xlsx", "One source of truth. Workflows are versioned automatically."],
      ]},

      { type: "h2", id: "comparison", text: "Feature comparison" },
      { type: "table", headers: ["Feature", "EasyFlow", "SAP Workflow", "Kinaxis", "Monday.com", "Spreadsheet"], rows: [
        ["Visual workflow canvas", "✓", "Limited", "✓", "✓", "✗"],
        ["ERP event ingestion", "Implemented via webhook + n8n architecture", "Native", "Native", "Manual", "Manual"],
        ["Multi-tenant isolation", "✓", "✓", "✓", "✗", "✗"],
        ["Open source", "✓", "✗", "✗", "✗", "✗"],
        ["Self-hostable", "✓", "✗", "✗", "✗", "N/A"],
        ["Automatic escalation", "✓", "✓", "✓", "Limited", "✗"],
        ["Supply chain specific", "✓", "✓", "✓", "✗", "✗"],
        ["Workflow ownership model", "Business-user oriented", "ERP-admin oriented", "Program-led", "Manual configuration", "Manual"],
      ]},

      { type: "h2", id: "current-status", text: "What is implemented so far" },
      { type: "p", text: "EasyFlow is an open-source project in active development. The core idea is already concrete, and a meaningful amount of the product has been built and documented." },
      { type: "list", items: [
        "A visual product experience for supply chain workflow creation, dashboards, and multi-workspace operations",
        "A FastAPI webhook ingestion layer with token validation, payload normalization, and queue-based event handling",
        "A local full-stack architecture with Postgres, RabbitMQ, n8n, API, and web app wired together through Docker Compose",
        "n8n workflow templates and webhook-based integration patterns for ERP-shaped event ingestion",
        "A Prisma + Zod data contract layer on the web side for typed models and future deployment paths",
        "Beginner-friendly deployment and architecture documentation for self-hosting and demo environments",
      ]},
      { type: "callout", variant: "warning", text: "What is not claimed yet: production validation against live SAP, Oracle, Dynamics, or NetSuite customer environments. The integration framework is implemented and locally testable, but real organizations still need to connect and validate it against their own systems." },

      { type: "h2", id: "position", text: "The EasyFlow position" },
      { type: "p", text: "EasyFlow sits between heavyweight enterprise systems and generic work tools. It is for teams that want a dedicated supply chain coordination layer, control over their own deployment, and a system they can actually understand and change." },
      { type: "callout", variant: "tip", text: "Think of EasyFlow as an ERP-adjacent workflow and visibility layer: open source, operationally focused, and designed so teams can start small without buying a whole enterprise transformation program." },
    ],
  },

  "who-its-for": {
    section: "Why EasyFlow",
    title: "Who It's For",
    description: "The teams and companies EasyFlow is designed to serve.",
    toc: [
      { label: "Primary users", anchor: "users", level: 2 },
      { label: "Industries", anchor: "industries", level: 2 },
      { label: "Company sizes", anchor: "sizes", level: 2 },
      { label: "Not a fit for", anchor: "not-for", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "users", text: "Primary users" },
      { type: "table", headers: ["Role", "How they use EasyFlow"], rows: [
        ["Supply Chain Manager", "Designs approval flows, monitors operations dashboard, tracks supplier performance"],
        ["Procurement Officer", "Raises and tracks purchase orders through approval workflows"],
        ["Warehouse Manager", "Sees inbound/outbound tasks, confirms receipts, dispatches shipments"],
        ["Logistics Coordinator", "Tracks shipments, manages carrier handoffs, monitors delivery SLAs"],
        ["Finance / AP", "Approves high-value POs, reconciles receipts against orders"],
        ["IT / Platform Admin", "Sets up ERP integrations via n8n, manages users, configures workspaces"],
        ["3PL / Consultant", "Manages multiple client workspaces from a single super-admin view"],
      ]},

      { type: "h2", id: "industries", text: "Industries" },
      { type: "list", items: [
        "Retail & e-commerce — seasonal replenishment, multi-supplier coordination, DC-to-store dispatch",
        "Food & beverage distribution — cold chain compliance, date-sensitive stock management",
        "Manufacturing — raw material procurement, plant dispatch, supplier quality workflows",
        "Medical & pharmaceutical supply — regulated approval gates, hospital restock, controlled substances",
        "Consumer electronics — product launch allocation, channel inventory management",
        "Third-party logistics (3PL) — multi-client operations, carrier management, SLA tracking",
      ]},

      { type: "h2", id: "sizes", text: "Company sizes" },
      { type: "p", text: "EasyFlow works best for companies with 10 to 500 people in their supply chain function. Large enough to have real coordination problems. Small enough that a seven-figure enterprise implementation isn't an option." },
      { type: "table", headers: ["Size", "Typical use"], rows: [
        ["10–50 people", "Replace spreadsheet coordination. One or two core workflows."],
        ["50–200 people", "Full procurement and logistics coordination. Multiple tenant workspaces."],
        ["200–500 people", "Multi-site operations. Supplier portal. Full ERP integration."],
        ["500+ people", "Possible, but large enterprises may prefer vendor-supported solutions."],
      ]},

      { type: "h2", id: "not-for", text: "Where EasyFlow is not the right fit" },
      { type: "list", items: [
        "Companies that need supply chain planning and demand forecasting as the primary tool — Kinaxis or Blue Yonder are better fits.",
        "Organisations that require a fully vendor-supported product with enterprise SLAs and dedicated support contracts.",
        "Teams where all coordination already happens natively inside a modern ERP module and there is no pain to solve.",
      ]},
      { type: "callout", variant: "info", text: "If you're unsure, start a free workspace and try building your most painful workflow. If it saves time in week one, EasyFlow is the right fit." },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ARCHITECTURE
  // ══════════════════════════════════════════════════════════════════════════

  "architecture": {
    section: "Architecture",
    title: "System Architecture",
    description: "How EasyFlow's layers fit together — API, workflow engine, messaging bus, and UI.",
    toc: [
      { label: "Overview", anchor: "overview", level: 2 },
      { label: "The five layers", anchor: "layers", level: 2 },
      { label: "Web app (apps/web)", anchor: "web", level: 3 },
      { label: "API server (apps/api)", anchor: "api", level: 3 },
      { label: "Workflow engine (packages/engine)", anchor: "engine", level: 3 },
      { label: "Async runtime (RabbitMQ + worker)", anchor: "runtime", level: 3 },
      { label: "Connector layer (packages/connectors)", anchor: "connectors-layer", level: 3 },
      { label: "Technology stack", anchor: "stack", level: 2 },
      { label: "Monorepo structure", anchor: "monorepo", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "overview", text: "Overview" },
      { type: "p", text: "EasyFlow is a multi-tenant supply chain process operating system. It is built as a monorepo with five distinct layers, each with a clear responsibility. They communicate via REST APIs and an async message queue." },
      { type: "callout", variant: "tip", text: "Everything is open source and self-hostable. One docker compose up command starts the full stack." },

      { type: "h2", id: "layers", text: "The five layers" },

      { type: "h3", id: "web", text: "Web app — apps/web" },
      { type: "p", text: "Next.js 14 application with Tailwind CSS and shadcn/ui. This is the product shell — the canvas, dashboards, admin portal, and all user-facing screens." },
      { type: "list", items: [
        "Business process canvas — visual drag-and-drop workflow designer built on React Flow",
        "Tenant dashboards — procurement, inventory, logistics, suppliers, users per workspace",
        "Globe view — animated entry point showing all tenant workspaces",
        "Admin portal — super admin and tenant admin management",
        "Integrations UI — n8n setup guide, webhook credentials, connector status",
        "Docs site — this documentation, built in-app",
        "Auth — Google OAuth + email/password via better-auth",
      ]},

      { type: "h3", id: "api", text: "API server — apps/api" },
      { type: "p", text: "FastAPI (Python) service that handles all business logic, access control, and data persistence." },
      { type: "list", items: [
        "Auth + RBAC — every request is verified against the actor's role and tenant scope",
        "Tenant registry — create, list, update workspaces and users",
        "Workflow APIs — save, retrieve, and simulate workflow definitions",
        "Connector APIs — register and test ERP connections per tenant",
        "Inbound webhooks — receive events from ERPs and n8n workflows",
        "Notification publisher — push events to RabbitMQ for async processing",
        "Alembic migrations — versioned database schema management",
      ]},

      { type: "h3", id: "engine", text: "Workflow engine — packages/engine" },
      { type: "p", text: "Pure Python library with no framework dependencies. The engine validates workflow graphs, simulates execution, and generates execution timelines." },
      { type: "list", items: [
        "Graph validation — detects cycles, disconnected nodes, missing required fields",
        "Workflow simulation — walks through a workflow definition and produces a step-by-step execution plan",
        "Execution modelling — tracks state transitions, assignees, deadlines, and escalation rules",
        "No database coupling — the engine is stateless and receives all context it needs as input",
      ]},

      { type: "h3", id: "runtime", text: "Async runtime — RabbitMQ + worker" },
      { type: "p", text: "RabbitMQ carries all async events between the API and the background worker. The worker consumes events, runs them through the workflow engine, and publishes results." },
      { type: "list", items: [
        "Event-driven — every workflow action is a message, not a synchronous call",
        "Retry and DLQ — failed events are retried with backoff, then moved to a dead-letter queue for inspection",
        "Prometheus metrics — execution counts, latency, and error rates exposed at /metrics",
        "Webhook inbound — events from ERPs arrive via webhook, get normalised, and published to RabbitMQ",
      ]},

      { type: "h3", id: "connectors-layer", text: "Connector layer — packages/connectors" },
      { type: "p", text: "Pluggable integration SDK. Each connector implements two methods: test_connection() and fetch_master_data(). The n8n / webhook pattern means most ERPs don't need a custom connector — n8n handles the ERP-specific auth and sends normalised payloads to EasyFlow." },

      { type: "h2", id: "stack", text: "Technology stack" },
      { type: "table", headers: ["Layer", "Technology", "Why"], rows: [
        ["Frontend", "Next.js 14, Tailwind CSS, shadcn/ui", "App router, server components, rapid UI development"],
        ["API", "FastAPI, SQLAlchemy, Alembic", "Async Python, auto-generated docs, type safety"],
        ["Database", "PostgreSQL (Neon in production)", "Multi-tenant schema, reliable, scales to large datasets"],
        ["Auth", "better-auth", "Google OAuth, email/password, session management"],
        ["Messaging", "RabbitMQ", "Reliable async delivery, DLQ, management UI"],
        ["Automation", "n8n (self-hosted)", "400+ ERP integrations, visual workflows, open source"],
        ["Analytics & ML", "Databricks (AWS us-east-2)", "Batch ML scoring for inventory risk, supplier delay, and order slip — results read via SQL Statement API"],
        ["Engine", "Pure Python", "Portable, testable, no framework coupling"],
        ["Containers", "Docker + docker compose", "One command to start everything"],
      ]},

      { type: "h2", id: "monorepo", text: "Monorepo structure" },
      { type: "code", lang: "text", code: `EasyFlow/
├── apps/
│   ├── api/                    FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py         Application entry point + routes
│   │   │   ├── connectors.py   ERP connector CRUD APIs
│   │   │   ├── webhooks.py     Inbound webhook receiver
│   │   │   ├── access.py       RBAC — roles and tenant scoping
│   │   │   ├── models.py       SQLAlchemy ORM models
│   │   │   ├── store.py        Data access layer
│   │   │   └── worker.py       RabbitMQ consumer
│   │   └── migrations/         Alembic database migrations
│   └── web/                    Next.js frontend
│       ├── app/                App router pages
│       │   ├── page.tsx        Landing page
│       │   ├── login/          Auth pages
│       │   ├── globe/          Tenant workspace selector
│       │   ├── dashboard/      Operations dashboard
│       │   ├── workflows/      Process canvas
│       │   ├── admin/          Admin portal
│       │   ├── settings/       Integrations
│       │   └── docs/           This documentation
│       ├── components/         Shared UI components
│       └── lib/                Utilities, stores, types
├── packages/
│   ├── engine/                 Workflow execution engine
│   │   └── easyflow_engine/
│   │       ├── engine.py       Graph traversal and execution
│   │       └── models.py       Workflow data models
│   └── connectors/             ERP connector SDK
│       ├── base.py             Connector interface
│       ├── factory.py          Connector catalog + factory
│       ├── http_adapter.py     Generic HTTP connector
│       └── webhook_connector.py n8n / webhook connector
├── examples/
│   └── n8n-workflows/          Ready-to-import n8n templates
│       ├── sap-to-easyflow.json
│       └── oracle-to-easyflow.json
└── docker-compose.yml          Full stack: API + n8n + Postgres + RabbitMQ` },
    ],
  },

  "data-flow": {
    section: "Architecture",
    title: "Data Flow",
    description: "How a request moves from ERP event through the webhook, into the workflow engine, and back to the dashboard.",
    toc: [
      { label: "Happy path", anchor: "happy-path", level: 2 },
      { label: "Inbound event flow", anchor: "inbound", level: 2 },
      { label: "Workflow execution flow", anchor: "execution", level: 2 },
      { label: "Dashboard update flow", anchor: "dashboard", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "happy-path", text: "The happy path — purchase order approval" },
      { type: "p", text: "Here is an example of how an ERP-shaped supply chain event flows through EasyFlow end to end. The example uses a purchase order raised in SAP, but the same path applies to any supported source that sends a normalized event." },

      { type: "h2", id: "inbound", text: "Step 1 — Inbound event" },
      { type: "steps", items: [
        { title: "SAP creates a purchase order", body: "An operator raises a PO in SAP. SAP triggers an outbound webhook, or n8n's scheduled workflow detects the new PO in the next polling cycle (every 5 minutes)." },
        { title: "n8n normalises the payload", body: "The n8n workflow maps SAP's field names (PurchaseOrder, OrderQuantity, Supplier) to EasyFlow's standard format and POSTs to /api/webhooks/inbound/{tenant_id}." },
        { title: "EasyFlow verifies and accepts", body: "The webhook endpoint validates the X-Webhook-Token header, normalises any remaining SAP field aliases, and publishes a purchase_order_created event to RabbitMQ. Returns 202 Accepted immediately." },
      ]},

      { type: "h2", id: "execution", text: "Step 2 — Workflow execution" },
      { type: "steps", items: [
        { title: "Worker consumes the event", body: "The RabbitMQ worker picks up the purchase_order_created message and loads the tenant's active workflow definition for this event type." },
        { title: "Engine validates the graph", body: "The workflow engine validates the definition — checking for cycles, missing assignments, and unreachable nodes." },
        { title: "Engine executes step one", body: "The first step (Request) is marked complete. The engine identifies the next step (Approval) and its assignee based on the workflow definition and the PO's value." },
        { title: "Notification published", body: "The worker publishes a notification event. The notification service sends an email or Slack message to the approver with a direct link to the approval screen." },
      ]},

      { type: "h2", id: "dashboard", text: "Step 3 — Dashboard update" },
      { type: "steps", items: [
        { title: "Approver opens EasyFlow", body: "The manager sees the pending approval in their Operations dashboard. They see the PO details, the supplier, the quantity, and the deadline." },
        { title: "Approver clicks Approve", body: "The approval action is posted to the API. The engine marks this step complete and moves to the next node in the workflow graph." },
        { title: "Workflow completes", body: "If all steps complete, the workflow is marked done. The procurement officer sees the approved status. The worker can optionally hand the completion back to an external system through a connector or follow-up automation." },
        { title: "Metrics updated", body: "Prometheus counters increment for workflow completions. The dashboard shows updated counts, average approval times, and pending queues." },
      ]},

      { type: "callout", variant: "info", text: "The exact timing depends on your source system, queue load, polling interval, and notification setup. The important point is that EasyFlow is designed for near-real-time operational routing rather than manual status chasing." },
    ],
  },

  "multi-tenancy": {
    section: "Architecture",
    title: "Multi-Tenancy Model",
    description: "How EasyFlow keeps every company's data completely isolated — and what that means for you.",
    toc: [
      { label: "What is a tenant?", anchor: "what", level: 2 },
      { label: "Isolation guarantees", anchor: "isolation", level: 2 },
      { label: "The role hierarchy", anchor: "roles", level: 2 },
      { label: "Cross-tenant operations", anchor: "cross", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what", text: "What is a tenant?" },
      { type: "p", text: "In EasyFlow, a tenant is one company's private workspace. Every tenant has its own team, its own workflows, its own ERP connections, and its own data. Nothing is shared between tenants." },
      { type: "p", text: "If you are a 3PL provider running operations for 10 different clients, each client is a separate tenant. You — as the super admin — can see and manage all 10. Each client's team can only see their own workspace." },

      { type: "h2", id: "isolation", text: "Isolation guarantees" },
      { type: "table", headers: ["What is isolated", "How"], rows: [
        ["Users", "Every user belongs to exactly one tenant (or is a platform-level super admin)"],
        ["Workflows", "Workflow definitions and execution history are scoped to a tenant_id"],
        ["ERP connections", "Connector configs (API keys, URLs) are stored per-tenant and never shared"],
        ["Webhook tokens", "Each tenant has its own HMAC token — tokens from other tenants are rejected"],
        ["Dashboard data", "All API queries include tenant_id filtering at the database level"],
        ["Audit logs", "Audit entries are tagged with tenant_id and cannot be cross-queried"],
      ]},
      { type: "callout", variant: "warning", text: "Super admins can view all tenants but still cannot read another tenant's ERP credentials. Connector configs are stored encrypted per tenant." },

      { type: "h2", id: "roles", text: "The role hierarchy" },
      { type: "table", headers: ["Role", "Scope", "Can do"], rows: [
        ["Super Admin", "Platform-wide", "Create/manage all tenants, view all dashboards, manage platform settings"],
        ["Tenant Admin", "Their tenant only", "Manage users, workflows, and ERP connections within their workspace"],
        ["Manager", "Their tenant only", "Approve requests, view all dashboards, run workflows"],
        ["Analyst", "Their tenant only", "View dashboards, export reports. No write access."],
        ["Operator", "Their tenant only", "Run assigned workflow steps. See only their work."],
      ]},

      { type: "h2", id: "cross", text: "Cross-tenant operations" },
      { type: "p", text: "Super admins can perform cross-tenant operations from the Admin Portal. These include:" },
      { type: "list", items: [
        "Creating a new tenant workspace (company, plan, modules, initial admin)",
        "Suspending or activating a tenant",
        "Viewing aggregate platform metrics across all tenants",
        "Resetting the platform-wide role permission matrix",
        "Enabling maintenance mode (locks all tenant access)",
      ]},
      { type: "p", text: "All cross-tenant actions are logged in the platform audit trail with the super admin's ID, timestamp, and affected tenant." },
    ],
  },

  "deployment-architecture": {
    section: "Architecture",
    title: "Deployment Architecture",
    description: "How to deploy EasyFlow for a public demo or self-hosted business setup, and what each service does.",
    toc: [
      { label: "Demo architecture", anchor: "demo", level: 2 },
      { label: "What runs where", anchor: "services", level: 2 },
      { label: "Public URLs", anchor: "urls", level: 2 },
      { label: "Free Oracle VM path", anchor: "oracle", level: 2 },
      { label: "What to harden later", anchor: "hardening", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "demo", text: "Recommended demo architecture" },
      { type: "p", text: "For a beginner-friendly public demo, the simplest architecture is one VM running the full stack with Docker Compose. This keeps cost at zero on Oracle Always Free and avoids complicated multi-service hosting." },
      { type: "code", lang: "text", code: `Internet
   ↓
EasyFlow web (Next.js)      :3000
EasyFlow API (FastAPI)      :8000
n8n                         :5678
RabbitMQ                    :5672 / :15672
Postgres                    internal Docker network` },

      { type: "h2", id: "services", text: "What runs where" },
      { type: "table", headers: ["Service", "Purpose", "Why it exists"], rows: [
        ["web", "Frontend product UI", "Landing page, dashboards, workflow canvas, settings, docs"],
        ["api", "Backend business logic", "Access control, tenants, workflows, connectors, webhooks"],
        ["postgres", "Database", "Stores tenant, user, workflow, and integration data"],
        ["rabbitmq", "Async messaging", "Moves events from API to worker-style processing paths"],
        ["n8n", "Integration automation", "Pulls from ERP APIs and pushes normalised events to EasyFlow"],
      ]},

      { type: "h2", id: "urls", text: "Public URLs for a demo" },
      { type: "list", items: [
        "EasyFlow app: http://YOUR_SERVER_IP:3000",
        "API health check: http://YOUR_SERVER_IP:8000/health",
        "n8n: http://YOUR_SERVER_IP:5678",
        "RabbitMQ management: http://YOUR_SERVER_IP:15672",
      ]},

      { type: "h2", id: "oracle", text: "Free Oracle VM path" },
      { type: "p", text: "If you want a completely free demo, Oracle Cloud Always Free is the easiest choice. One Ubuntu VM can host the whole stack. Create the VM, open the ports, copy the project, set the .env values, and run docker compose up -d --build." },
      { type: "callout", variant: "tip", text: "Use the DEPLOY_ORACLE_FREE.md guide in the repo for the exact step-by-step commands. It is the fastest path to getting a public demo live." },

      { type: "h2", id: "hardening", text: "What to harden later" },
      { type: "list", items: [
        "Add HTTPS with a reverse proxy such as Caddy or Nginx",
        "Move from raw server IP to a proper domain",
        "Set strong secrets for auth and webhooks",
        "Restrict public ports you do not need",
        "Back up the Postgres volume regularly",
      ]},
    ],
  },

  "ai-copilot": {
    section: "Architecture",
    title: "AI Copilot",
    description: "How the tenant-safe assistant uses agentic retrieval, tenant-scoped context, and swappable LLM backends.",
    toc: [
      { label: "What it is", anchor: "what-it-is", level: 2 },
      { label: "Agentic architecture", anchor: "agentic", level: 2 },
      { label: "Tenant-safe retrieval", anchor: "retrieval", level: 2 },
      { label: "Current data sources", anchor: "sources", level: 2 },
      { label: "LLM backends", anchor: "llm", level: 2 },
      { label: "Environment variables", anchor: "env", level: 2 },
      { label: "Current limitations", anchor: "limits", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what-it-is", text: "What it is" },
      { type: "p", text: "EasyFlow's copilot is a tenant-scoped retrieval assistant for supply chain operations. It is designed to answer questions about shipments, inventory, approvals, suppliers, and workflow exceptions using only the current tenant's operational context." },
      { type: "callout", variant: "tip", text: "The copilot is designed around a provider abstraction. EasyFlow can run in a fully local agentic mode through Ollama, or use hosted backends such as OpenAI or Gemini while keeping the same tenant-scoped response contract." },

      { type: "h2", id: "agentic", text: "Agentic architecture" },
      { type: "p", text: "Agentic AI in EasyFlow means the assistant does more than autocomplete a generic answer. It gathers tenant context, inspects operational records, and produces an answer grounded in current business data." },
      { type: "table", headers: ["Mode", "How it works", "Best fit"], rows: [
        ["Local agentic mode", "LangChain agent + tenant MCP tools + Ollama model", "Self-hosted demos, on-prem deployments, strict data residency"],
        ["Hosted grounded mode", "OpenAI or Gemini provider + tenant-scoped document context", "Teams that want managed models without rewriting the app"],
        ["Heuristic fallback", "Deterministic local logic over the same tenant dataset", "Safe demo fallback when no model backend is available"],
      ]},

      { type: "h2", id: "retrieval", text: "Tenant-safe retrieval" },
      { type: "list", items: [
        "The assistant receives the current tenant slug from the workspace route or request payload.",
        "Tenant data is loaded only for that tenant workspace.",
        "Operational records are transformed into tenant-scoped knowledge documents.",
        "A tenant-scoped MCP server is created in-process for that request only.",
        "LangChain loads only that MCP server's tools, so the model can query only the current tenant context.",
        "If a signed-in user is tenant-scoped in the registry, the route refuses cross-tenant access.",
      ]},

      { type: "h2", id: "sources", text: "Current data sources" },
      { type: "p", text: "Until live ERP-side data is fully wired everywhere, the copilot uses the same tenant-specific operational structures already powering the app UI." },
      { type: "table", headers: ["Source", "Used for"], rows: [
        ["Inventory data", "Low-stock, reorder, SKU, and restock questions"],
        ["Procurement data", "Purchase order status and approval questions"],
        ["Logistics data", "Shipment delay, ETA, and carrier questions"],
        ["Supplier data", "Lead-time, fill-rate, and supplier risk questions"],
        ["Automation / integration data", "Workflow trigger and integration status questions"],
        ["Tenant KPIs", "Overview, exception, and operational health questions"],
      ]},

      { type: "h2", id: "llm", text: "LLM backends" },
      { type: "p", text: "EasyFlow now supports multiple backend styles through the same provider interface. The local Ollama path is the most agentic because it can reason through tenant MCP tools directly. Hosted OpenAI and Gemini paths use the same tenant-scoped knowledge documents and return the same structured assistant payload." },
      { type: "code", lang: "text", code: `User question
   ↓
Tenant-aware API route
   ↓
Tenant-scoped knowledge documents
   ↓
Provider registry
   ↓
Ollama: LangChain + MCP tools
OpenAI / Gemini: grounded context prompt
   ↓
Grounded answer + citations` },
      { type: "p", text: "The default local path uses ChatOllama through LangChain. The hosted-provider path is designed so teams can point EasyFlow at OpenAI or Gemini later without changing the API contract or UI." },
      { type: "code", lang: "bash", code: `# Example local setup
ollama serve
ollama pull llama3.1:8b` },

      { type: "h2", id: "env", text: "Environment variables" },
      { type: "code", lang: "env", code: `AI_PROVIDER=heuristic
LOCAL_LLM_ENABLED=false
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434
LOCAL_LLM_MODEL=llama3.1:8b
LOCAL_EMBEDDING_MODEL=nomic-embed-text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=https://api.openai.com/v1/responses
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash` },
      { type: "p", text: "Set AI_PROVIDER to ollama, openai, gemini, or heuristic. If no provider is configured, EasyFlow falls back to deterministic tenant-grounded logic instead of failing closed." },

      { type: "h2", id: "limits", text: "Current limitations" },
      { type: "list", items: [
        "The current retrieval layer is lexical and tenant-scoped, not vector-search based yet.",
        "The MCP tool layer currently exposes local tenant knowledge documents rather than live ERP-backed indexed stores everywhere.",
        "The hosted-provider paths are grounded in tenant documents today, but the deeper agentic tool loop currently exists only in the local Ollama + MCP mode.",
        "Production-quality prompt and model tuning still depend on the deployment environment you choose.",
      ]},
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // GETTING STARTED
  // ══════════════════════════════════════════════════════════════════════════

  "quick-start": {
    section: "Getting Started",
    title: "Quick Start (5 min)",
    description: "Sign in with Google, create your workspace, and see your first workflow running in under 5 minutes.",
    toc: [
      { label: "Option A — Cloud (fastest)", anchor: "cloud", level: 2 },
      { label: "Option B — Self-host", anchor: "self-host-link", level: 2 },
      { label: "Create your workspace", anchor: "workspace", level: 2 },
      { label: "Your first flow", anchor: "flow", level: 2 },
      { label: "Connect your ERP", anchor: "erp", level: 2 },
    ],
    blocks: [
      { type: "callout", variant: "tip", text: "EasyFlow is open source. You can run it entirely on your own infrastructure — no account needed, no data leaves your servers. See the Self-Host guide for that path." },

      { type: "h2", id: "cloud", text: "Option A — Try it now (no install)" },
      { type: "steps", items: [
        { title: "Go to the EasyFlow home page", body: "Open localhost:3000 if you're running locally, or your deployed instance. Click 'Get started free'." },
        { title: "Sign in with Google", body: "One click. No form. Your Google account becomes your EasyFlow identity. You can also sign up with email and password." },
        { title: "You're in", body: "You land on the Globe screen — your platform home. You'll see the demo tenant workspaces. Click 'Enter platform' to explore them, or go to Admin Portal to create your own." },
      ]},

      { type: "h2", id: "self-host-link", text: "Option B — Self-host" },
      { type: "p", text: "See the Self-Host with Docker guide for full instructions. The short version:" },
      { type: "code", lang: "bash", code: `git clone https://github.com/your-org/easyflow.git
cd easyflow
docker compose up

# Web app: http://localhost:3000
# API:     http://localhost:8000
# n8n:     http://localhost:5678
# RabbitMQ management: http://localhost:15672` },

      { type: "h2", id: "workspace", text: "Create your workspace" },
      { type: "steps", items: [
        { title: "Open the Admin Portal", body: "Click the purple shield icon in the left sidebar. This is where super admins manage all company workspaces." },
        { title: "Click 'New Tenant'", body: "A 4-step wizard opens. Enter your company name, pick your industry and operational mode." },
        { title: "Select your supply chain modules", body: "Choose which parts of EasyFlow you need — Procurement, Inventory, Logistics, Suppliers. You can change these later." },
        { title: "Add your first admin", body: "Enter the name and work email of your workspace admin. They'll receive an invitation link." },
      ]},

      { type: "h2", id: "flow", text: "Build your first flow" },
      { type: "steps", items: [
        { title: "Open Business Processes", body: "Click Waypoints icon in the sidebar. This is the workflow canvas." },
        { title: "Create a new flow", body: "Click 'New flow'. A blank canvas opens." },
        { title: "Add a Request step", body: "Drag a Request node from the right panel. This is where someone initiates the process — e.g. 'Purchase order submitted'." },
        { title: "Add an Approval step", body: "Drag an Approval node and connect it to the Request. Set the approver — a specific person or a role like Manager." },
        { title: "Activate", body: "Click Activate. Your flow is live. Anyone in the workspace can now start it from the Operations dashboard." },
      ]},

      { type: "h2", id: "erp", text: "Connect your ERP (optional)" },
      { type: "p", text: "Go to Integrations in the sidebar. Follow the 5-step n8n setup guide. Your ERP data will start flowing into EasyFlow automatically. See the Connecting Your ERP guide for details." },
    ],
  },

  "self-host": {
    section: "Getting Started",
    title: "Self-Host with Docker",
    description: "Run the complete EasyFlow stack on your own server in under 10 minutes. Everything included.",
    toc: [
      { label: "What you need", anchor: "prereqs", level: 2 },
      { label: "Start the stack", anchor: "start", level: 2 },
      { label: "What starts up", anchor: "services", level: 2 },
      { label: "First-time configuration", anchor: "config", level: 2 },
      { label: "Production checklist", anchor: "production", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "prereqs", text: "What you need" },
      { type: "table", headers: ["Requirement", "Version", "Check"], rows: [
        ["Docker", "24+", "`docker --version`"],
        ["Docker Compose", "v2+", "`docker compose version`"],
        ["Git", "Any", "`git --version`"],
        ["2GB RAM", "Minimum", "For all services running simultaneously"],
      ]},

      { type: "h2", id: "start", text: "Start the stack" },
      { type: "code", lang: "bash", code: `# 1. Clone the repo
git clone https://github.com/your-org/easyflow.git
cd easyflow

# 2. Copy the env template
cp .env.example .env
# Edit .env with your public URLs and secrets

# 3. Start everything
docker compose up -d --build

# That's it. Five services start:
# ✓ web            (Next.js frontend)
# ✓ api            (FastAPI backend)
# ✓ postgres       (database)
# ✓ rabbitmq       (message bus)
# ✓ n8n            (ERP automation)` },

      { type: "callout", variant: "info", text: "The full stack is now included in docker compose. For a free public demo, one Oracle Cloud Always Free VM is enough to run all services." },

      { type: "h2", id: "services", text: "What starts up" },
      { type: "table", headers: ["Service", "URL", "What it does"], rows: [
        ["Web app (Next.js)", "localhost:3000", "The full EasyFlow product — canvas, dashboards, docs, admin portal"],
        ["API (FastAPI)", "localhost:8000", "REST API, webhooks, access control, data persistence"],
        ["n8n", "localhost:5678", "Visual ERP automation — import templates, connect SAP/Oracle/Dynamics"],
        ["RabbitMQ", "localhost:15672", "Message queue management UI (guest/guest)"],
        ["PostgreSQL", "localhost:5432", "Database for API and n8n (easyflow/easyflow)"],
      ]},

      { type: "h2", id: "config", text: "First-time configuration" },
      { type: "steps", items: [
        { title: "Set up Google OAuth (optional)", body: "If you want Google sign-in, go to Google Cloud Console → APIs → Credentials → Create OAuth 2.0 Client. Add your app URL callback. Put the client ID and secret into .env. If you skip this, email/password still works for demo use." },
        { title: "Generate your secrets", body: "Run: openssl rand -hex 32. Paste the outputs into BETTER_AUTH_SECRET and WEBHOOK_SECRET_KEY in .env." },
        { title: "Open the app", body: "Go to http://localhost:3000. Sign in with Google. You'll land on the Globe screen with the demo tenant workspaces preloaded." },
        { title: "Create your first tenant", body: "Open Admin Portal (purple shield in sidebar). Click New Tenant and follow the 4-step wizard." },
      ]},

      { type: "h2", id: "production", text: "Production checklist" },
      { type: "list", items: [
        "Replace WEBHOOK_SECRET_KEY and BETTER_AUTH_SECRET with strong random values (openssl rand -hex 32)",
        "Set NEON_DATABASE_URL to a managed Postgres instance (Neon, Supabase, RDS, or self-hosted)",
        "Update N8N_HOST and WEBHOOK_URL in docker-compose.yml to your server's public IP or domain",
        "Add your domain to Google OAuth's authorized redirect URIs",
        "Enable HTTPS with a reverse proxy (nginx + Certbot is the standard setup)",
        "Set POSTGRES_PASSWORD to a strong password, not the default",
        "Back up the postgres_data Docker volume regularly",
      ]},
    ],
  },

  "first-workflow": {
    section: "Getting Started",
    title: "Your First Workflow",
    description: "Build a real purchase order approval flow from scratch — step by step.",
    toc: [
      { label: "What we're building", anchor: "what", level: 2 },
      { label: "Open the canvas", anchor: "canvas", level: 2 },
      { label: "Build the flow", anchor: "build", level: 2 },
      { label: "Test it", anchor: "test", level: 2 },
      { label: "Connect to your ERP", anchor: "erp", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what", text: "What we're building" },
      { type: "p", text: "A four-step purchase order approval flow. When a PO is raised (manually or from your ERP), it goes to the procurement officer, then to a manager if over £5,000, then dispatches a supplier notification automatically." },
      { type: "table", headers: ["Step", "Type", "Assignee"], rows: [
        ["PO Submitted", "Request", "Procurement officer"],
        ["Finance Review", "Approval", "Finance team (if PO > £5,000)"],
        ["Manager Sign-off", "Approval", "VP Operations"],
        ["Supplier Notified", "Notify", "Automatic"],
      ]},

      { type: "h2", id: "canvas", text: "Open the canvas" },
      { type: "steps", items: [
        { title: "Go to Business Processes", body: "Click the Waypoints icon in the left sidebar." },
        { title: "Click New flow", body: "Give it a name: Purchase Order Approval." },
        { title: "You'll see a blank grid", body: "This is the canvas. Nodes on the left panel can be dragged onto the grid. Arrows connect them." },
      ]},

      { type: "h2", id: "build", text: "Build the flow" },
      { type: "steps", items: [
        { title: "Add the Request node", body: "Drag a Request node onto the canvas. Label it 'PO Submitted'. This is the trigger — someone starts the flow here, or your ERP sends a purchase_order_created webhook event." },
        { title: "Add Finance Review", body: "Drag an Approval node. Label it 'Finance Review'. In the settings panel: Assignee = Finance Role. Condition = only if PO value > 5000. Deadline = 24 hours." },
        { title: "Add Manager Sign-off", body: "Drag another Approval node. Label it 'Manager Sign-off'. Assignee = VP Operations. Deadline = 4 hours. Escalation = after deadline, notify Head of Procurement." },
        { title: "Add Supplier Notification", body: "Drag a Notify node. Label it 'Supplier Notified'. Channel = Email. Template = 'Your PO {po_id} has been approved. Expected delivery date: {delivery_date}'." },
        { title: "Draw the arrows", body: "Hover over each node to see its connection handle. Drag from Request → Finance Review → Manager Sign-off → Supplier Notified. Add a bypass arrow from Request → Manager Sign-off for POs under £5,000." },
        { title: "Activate", body: "Click Activate in the top right. The flow is live." },
      ]},

      { type: "h2", id: "test", text: "Test it" },
      { type: "steps", items: [
        { title: "Click Simulate", body: "This runs the flow without sending real notifications. You'll see each step light up as it progresses." },
        { title: "Submit a test PO", body: "Go to Operations dashboard. Click New Request. Select Purchase Order Approval. Fill in PO details. Submit." },
        { title: "Approve it", body: "As the Finance role or Manager, you'll see the pending approval in your dashboard. Approve it and watch the next step activate." },
        { title: "Check the audit trail", body: "Every action is logged with who did it and when. Open the flow run to see the full timeline." },
      ]},

      { type: "h2", id: "erp", text: "Connect to your ERP" },
      { type: "p", text: "Once your flow works manually, connect it to your ERP so purchase orders automatically trigger the flow. See the Connecting Your ERP guide for the n8n setup. The webhook event type is purchase_order_created." },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CORE CONCEPTS (abbreviated — pointing to other pages)
  // ══════════════════════════════════════════════════════════════════════════

  "workspaces": {
    section: "Core Concepts",
    title: "Workspaces",
    description: "Every company gets its own private, isolated environment inside EasyFlow.",
    toc: [
      { label: "What is a workspace", anchor: "what", level: 2 },
      { label: "Creating a workspace", anchor: "creating", level: 2 },
      { label: "Workspace settings", anchor: "settings", level: 2 },
      { label: "Workspace limits", anchor: "limits", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what", text: "What is a workspace" },
      { type: "p", text: "A workspace (also called a tenant) is one company's private home inside EasyFlow. Every workspace has its own team, its own workflows, its own ERP connections, and its own data. Two workspaces never see each other's information." },
      { type: "p", text: "Tenant isolation applies across every surface — including the Forecasting page. When you navigate to Forecasting from inside a tenant workspace, EasyFlow automatically scopes all charts, demand projections, inventory coverage data, and urgency scores to that tenant only. No other company's data is ever shown." },
      { type: "callout", variant: "info", text: "If you manage supply chain operations for multiple companies — as a 3PL, a consultant, or a holding group — each company is a separate workspace. You switch between them from the Globe screen." },

      { type: "h2", id: "creating", text: "Creating a workspace" },
      { type: "steps", items: [
        { title: "Open Admin Portal", body: "Click the purple shield icon in the sidebar. Only super admins and platform admins can create workspaces." },
        { title: "Click New Tenant", body: "A 4-step wizard opens." },
        { title: "Step 1 — Company details", body: "Company name, industry, operational mode, headquarters city, region, and plan (Starter / Professional / Enterprise)." },
        { title: "Step 2 — Supply chain modules", body: "Select which modules to enable: Procurement, Inventory, Warehouse, Suppliers, Logistics, Dispatch, Quality, Forecasting." },
        { title: "Step 3 — Admin user", body: "The person who will manage this workspace. They receive an invitation email and get Tenant Admin role automatically." },
        { title: "Step 4 — Review and create", body: "Confirm all settings. The workspace is provisioned immediately and appears on the Globe screen." },
      ]},

      { type: "h2", id: "settings", text: "Workspace settings" },
      { type: "p", text: "After creation, the Tenant Admin can update: display name, industry, timezone, default approval escalation time, notification preferences, and connected ERP systems." },

      { type: "h2", id: "limits", text: "Workspace limits by plan" },
      { type: "table", headers: ["Plan", "Users", "Active flows", "SC modules", "ERP connectors"], rows: [
        ["Starter", "Up to 5", "3 flows", "2 modules", "1"],
        ["Professional", "Up to 25", "20 flows", "5 modules", "5"],
        ["Enterprise", "Unlimited", "Unlimited", "All modules", "Unlimited"],
      ]},
    ],
  },

  "workflow-canvas": {
    section: "Core Concepts",
    title: "Workflow Canvas",
    description: "Draw your supply chain processes as visual diagrams that EasyFlow executes automatically.",
    toc: [
      { label: "What is the canvas", anchor: "what", level: 2 },
      { label: "Node types", anchor: "nodes", level: 2 },
      { label: "Connecting nodes", anchor: "connecting", level: 2 },
      { label: "Execution", anchor: "execution", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what", text: "What is the canvas" },
      { type: "p", text: "The workflow canvas is a drag-and-drop visual board where you draw the exact steps your supply chain process follows. It is purpose-built for supply chain workflows — procurement approvals, stock replenishment, supplier coordination, and logistics handoffs." },

      { type: "h2", id: "nodes", text: "Node types" },
      { type: "table", headers: ["Node", "Use it when…", "Key settings"], rows: [
        ["Request", "Someone kicks off the process", "Form fields, who can start it, ERP trigger event"],
        ["Approval", "A person needs to say yes or no", "Assignee, deadline, escalation rule, condition"],
        ["Notify", "The team needs to know something", "Recipients, channel (email/Slack), message template"],
        ["Action", "A system task runs automatically", "System target (ERP write-back, webhook), payload"],
        ["Branch", "The path splits based on a condition", "Condition field, comparison operator, value"],
        ["End", "The flow is complete", "Outcome label (Approved, Rejected, Cancelled)"],
      ]},

      { type: "h2", id: "connecting", text: "Connecting nodes" },
      { type: "p", text: "Hover over any node to see the connection handles on each edge. Drag from one handle to another node to draw an arrow. Arrows represent 'what happens next'. You can have multiple arrows from one node — for example, Approved goes one way and Rejected goes another." },

      { type: "h2", id: "execution", text: "Execution" },
      { type: "p", text: "Once you activate a workflow, every run is tracked individually. You can see the current step, who's assigned, how long they've had it, and whether any escalation has fired. The full timeline of every action is preserved as the audit trail." },
      { type: "callout", variant: "tip", text: "Use Simulate to test a workflow before activating it. Simulation walks through every step without sending real notifications or writing to your ERP." },
    ],
  },

  "key-concepts": {
    section: "Core Concepts",
    title: "Roles & Access",
    description: "Who can see and do what inside each workspace.",
    toc: [
      { label: "How roles work", anchor: "how", level: 2 },
      { label: "Role reference", anchor: "reference", level: 2 },
      { label: "Changing roles", anchor: "changing", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "how", text: "How roles work" },
      { type: "p", text: "Every person in EasyFlow has a role. Roles are assigned when you invite someone and can be changed any time by a workspace admin. Roles control what a person can see, what they can change, and what actions they can take." },
      { type: "callout", variant: "info", text: "Super Admin is a platform-level role — above all workspaces. All other roles are scoped to a single workspace. A person cannot have different roles in different workspaces — they are invited to each workspace separately." },

      { type: "h2", id: "reference", text: "Role reference" },
      { type: "table", headers: ["Role", "Scope", "Key permissions"], rows: [
        ["Super Admin", "All workspaces", "Create workspaces, manage platform settings, view all data, set role permissions"],
        ["Tenant Admin", "One workspace", "Manage team, configure ERP connections, edit workflows, view all dashboards"],
        ["Manager", "One workspace", "Approve requests, view all dashboards, run flows, view reports"],
        ["Analyst", "One workspace", "View all dashboards and reports, export data. No write access."],
        ["Operator", "One workspace", "Run assigned workflow steps, view their own work queue only"],
      ]},

      { type: "h2", id: "changing", text: "Changing roles" },
      { type: "p", text: "Open Admin Portal → Users tab. Find the person and click the role badge to change it. Changes take effect the next time they load the page. Downgrading a role (e.g. Admin → Operator) immediately restricts their access." },
      { type: "callout", variant: "warning", text: "Only Tenant Admins and Super Admins can change roles. You cannot change your own role." },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INTEGRATIONS
  // ══════════════════════════════════════════════════════════════════════════

  "connect-erp": {
    section: "Integrations",
    title: "Connecting Your ERP",
    description: "Webhook- and n8n-based ERP integration architecture for self-hosted deployments and customer-side validation.",
    toc: [
      { label: "The approach", anchor: "approach", level: 2 },
      { label: "Why n8n + webhooks", anchor: "why", level: 2 },
      { label: "Setup — 5 steps", anchor: "setup", level: 2 },
      { label: "Direct webhook (no n8n)", anchor: "direct", level: 2 },
      { label: "Supported ERPs", anchor: "erps", level: 2 },
      { label: "What data flows in", anchor: "data", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "approach", text: "The approach — n8n as the integration layer" },
      { type: "p", text: "EasyFlow does not try to embed every ERP connector directly inside the product. Instead it uses n8n and a webhook-based ingestion layer so organizations can connect their own ERP environment without turning EasyFlow into a vendor-specific integration monolith." },
      { type: "p", text: "n8n handles the hard part: authentication, API pagination, field mapping, polling, and retry logic. EasyFlow receives normalized events via a secure webhook and routes them through the workflow engine." },
      { type: "callout", variant: "warning", text: "Current project status: the webhook receiver, token auth, payload normalization, connector catalog, and n8n templates are implemented. Production validation against specific SAP, Oracle, Dynamics, or NetSuite customer environments still depends on access to those systems." },
      { type: "callout", variant: "info", text: "EasyFlow includes a built-in local operational event feed for development and demos. That makes it possible to exercise low-stock alerts, shipment delays, approval aging, supplier breaches, and purchase-order events end to end while the integration layer is still being validated in real customer environments." },
      { type: "callout", variant: "tip", text: "n8n is already included in EasyFlow's docker-compose. Run 'docker compose up' and n8n starts automatically at localhost:5678. No extra installation." },

      { type: "h2", id: "why", text: "Why n8n + webhooks instead of custom connectors" },
      { type: "table", headers: ["Typical custom connector burden", "EasyFlow integration approach"], rows: [
        ["Write and maintain vendor-specific connector code inside the product", "Keep EasyFlow vendor-neutral and use webhook ingestion plus external automation"],
        ["Own token refresh and API edge cases for every ERP", "Let n8n or the customer's chosen integration layer handle those concerns"],
        ["Store ERP credentials in the main app", "Keep credentials in the customer's integration environment"],
        ["Hard-couple product releases to vendor API behavior", "Keep the ingestion contract stable and let source-side mapping evolve independently"],
        ["Rebuild similar plumbing for each new ERP", "Reuse the same normalized event contract across many sources"],
      ]},

      { type: "h2", id: "setup", text: "Setup — 5 steps" },
      { type: "steps", items: [
        { title: "Open n8n at localhost:5678", body: "It starts automatically with docker compose. Create your n8n account on first visit." },
        { title: "Import the EasyFlow workflow template", body: "Go to Workflows → Import From File. Open one of the example templates in examples/n8n-workflows/. Today the repo includes SAP and Oracle examples, and the same pattern can be extended to other systems." },
        { title: "Add your ERP credentials in n8n", body: "The imported workflow will prompt for your ERP's URL and API credentials. Enter them in n8n's credential manager. EasyFlow never sees or stores your ERP credentials." },
        { title: "Copy your webhook token from EasyFlow", body: "Go to Integrations in the EasyFlow sidebar. Copy the X-Webhook-Token for your workspace. Paste it into the n8n workflow's header field." },
        { title: "Activate the n8n workflow", body: "Click Activate. n8n will start polling or receiving events from your ERP and pushing normalized data into EasyFlow." },
      ]},

      { type: "h2", id: "direct", text: "Direct webhook (no n8n needed)" },
      { type: "p", text: "If your ERP supports outbound webhooks, you can skip n8n entirely and send events directly to EasyFlow:" },
      { type: "code", lang: "bash", code: `curl -X POST \\
  http://localhost:8000/api/webhooks/inbound/your-tenant-slug \\
  -H "Content-Type: application/json" \\
  -H "X-Source: sap" \\
  -H "X-Webhook-Token: your-token-from-integrations-page" \\
  -d '{
    "event_type": "purchase_order_created",
    "source": "sap",
    "data": {
      "purchase_order_id": "PO-4901",
      "supplier_name": "Supplier Alpha",
      "quantity": 500,
      "currency": "GBP",
      "status": "pending_approval"
    }
  }'` },

      { type: "h2", id: "erps", text: "Supported ERP systems" },
      { type: "table", headers: ["System type", "Method", "What exists today", "Validation status"], rows: [
        ["SAP S/4HANA", "n8n OData + scheduled polling", "Example template in repo", "Local template + payload pathway implemented"],
        ["Oracle ERP Cloud", "n8n REST API", "Example template in repo", "Local template + payload pathway implemented"],
        ["Microsoft Dynamics 365", "n8n Dataverse API", "Planned source type", "Production validation pending"],
        ["NetSuite", "n8n REST / SuiteQL", "Planned source type", "Production validation pending"],
      ]},

      { type: "h2", id: "data", text: "What data flows in" },
      { type: "table", headers: ["Event type", "Triggered when"], rows: [
        ["purchase_order_created", "A new PO is raised in the ERP"],
        ["purchase_order_approved", "A PO approval is recorded"],
        ["stock_updated", "Stock level changes for any SKU"],
        ["stock_low_alert", "Stock falls below the reorder point"],
        ["shipment_dispatched", "A shipment leaves the warehouse"],
        ["shipment_delivered", "A delivery is confirmed"],
        ["supplier_confirmed", "A supplier accepts a PO"],
        ["workflow_trigger", "A custom event from your ERP or script"],
      ]},
    ],
  },

  "webhook-reference": {
    section: "Integrations",
    title: "Webhook Reference",
    description: "All event types, headers, payload formats, and how token auth works.",
    toc: [
      { label: "Endpoint", anchor: "endpoint", level: 2 },
      { label: "Headers", anchor: "headers", level: 2 },
      { label: "Payload format", anchor: "payload", level: 2 },
      { label: "Token auth", anchor: "auth", level: 2 },
      { label: "All event types", anchor: "events", level: 2 },
      { label: "Response codes", anchor: "responses", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "endpoint", text: "Endpoint" },
      { type: "code", lang: "text", code: `POST /api/webhooks/inbound/{tenant_id}

# Example:
POST http://localhost:8000/api/webhooks/inbound/acme-retail` },

      { type: "h2", id: "headers", text: "Required headers" },
      { type: "table", headers: ["Header", "Value", "Required"], rows: [
        ["Content-Type", "application/json", "Yes"],
        ["X-Webhook-Token", "Your tenant's HMAC token", "Yes (in production)"],
        ["X-Source", "sap | oracle | dynamics | netsuite | n8n | generic", "Recommended"],
      ]},
      { type: "callout", variant: "info", text: "In development (when WEBHOOK_SECRET_KEY=change-me-in-production), the token check is skipped. Set a real secret in production." },

      { type: "h2", id: "payload", text: "Payload format" },
      { type: "code", lang: "json", code: `{
  "event_type": "purchase_order_created",
  "source":     "sap",
  "tenant_id":  "acme-retail",
  "data": {
    "purchase_order_id": "PO-4901",
    "supplier_name":     "Supplier Alpha",
    "quantity":          500,
    "currency":          "GBP",
    "status":            "pending_approval",
    "created_date":      "2026-06-01"
  }
}` },
      { type: "p", text: "EasyFlow normalises common ERP field aliases automatically. SAP's PurchaseOrder becomes purchase_order_id. Oracle's PONumber becomes purchase_order_id. You don't need to rename fields in n8n for supported source types." },

      { type: "h2", id: "auth", text: "Token authentication" },
      { type: "p", text: "Each tenant's token is an HMAC-SHA256 hash of the tenant ID signed with the platform's webhook secret key. To get your token:" },
      { type: "code", lang: "bash", code: `# Get your webhook token from the API
curl http://localhost:8000/api/webhooks/token/your-tenant-id

# Response:
# {
#   "tenant_id": "your-tenant-id",
#   "token": "abc123...",
#   "endpoint": "/api/webhooks/inbound/your-tenant-id",
#   "n8n_header": "X-Webhook-Token"
# }

# Or find it in the EasyFlow Integrations page (lightning bolt in sidebar)` },

      { type: "h2", id: "events", text: "All event types" },
      { type: "table", headers: ["Event type", "Category", "Typical trigger"], rows: [
        ["purchase_order_created", "Procurement", "New PO raised in ERP"],
        ["purchase_order_approved", "Procurement", "PO approved in ERP or by manager"],
        ["purchase_order_rejected", "Procurement", "PO rejected"],
        ["purchase_order_received", "Procurement", "Goods receipt confirmed"],
        ["stock_updated", "Inventory", "Any stock level change"],
        ["stock_low_alert", "Inventory", "Stock below reorder point"],
        ["stock_replenishment_needed", "Inventory", "Calculated need for restock"],
        ["shipment_dispatched", "Logistics", "Shipment leaves warehouse"],
        ["shipment_delivered", "Logistics", "Delivery confirmed"],
        ["shipment_delayed", "Logistics", "Expected delivery date missed"],
        ["supplier_confirmed", "Suppliers", "Supplier accepts PO"],
        ["supplier_rejected", "Suppliers", "Supplier rejects or modifies PO"],
        ["supplier_sla_breach", "Suppliers", "Fill rate or lead time SLA missed"],
        ["workflow_trigger", "General", "Custom trigger from any system"],
        ["custom_event", "General", "Fallback for unknown event types"],
      ]},

      { type: "h2", id: "responses", text: "Response codes" },
      { type: "table", headers: ["Code", "Meaning"], rows: [
        ["202 Accepted", "Event received, queued for processing"],
        ["400 Bad Request", "Invalid JSON or missing required fields"],
        ["401 Unauthorized", "Invalid or missing X-Webhook-Token"],
        ["404 Not Found", "Tenant ID not found"],
        ["503 Service Unavailable", "Event accepted but could not be queued (RabbitMQ down)"],
      ]},
    ],
  },

  "databricks-integration": {
    section: "Integrations",
    title: "Databricks Risk Intelligence",
    description: "How ML-scored risk signals flow from Databricks into the canvas, Risk Intelligence panel, and FlowGuide context.",
    toc: [
      { label: "What it does", anchor: "what", level: 2 },
      { label: "Architecture", anchor: "architecture", level: 2 },
      { label: "The risk_signal_feed table", anchor: "table", level: 2 },
      { label: "Five risk features", anchor: "features", level: 2 },
      { label: "Configuration", anchor: "config", level: 2 },
      { label: "Ingest endpoint", anchor: "ingest", level: 2 },
      { label: "Canvas overlay", anchor: "canvas", level: 2 },
      { label: "FlowGuide context", anchor: "flowguide", level: 2 },
      { label: "Fallback behaviour", anchor: "fallback", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "what", text: "What it does" },
      { type: "p", text: "EasyFlow's Databricks integration connects a Databricks SQL warehouse to the operational risk layer. ML scoring jobs in Databricks write structured risk signals into a Delta table. EasyFlow reads those signals hourly and surfaces them as live risk badges on canvas nodes, colored edge overlays on affected flow paths, a Risk Intelligence panel per tenant, and high-signal context for FlowGuide." },
      { type: "callout", variant: "tip", text: "When Databricks is not configured, EasyFlow falls back to a local heuristic scorer that uses the same operational data already in the app. There is no broken state." },

      { type: "h2", id: "architecture", text: "Architecture" },
      { type: "p", text: "The integration has four components." },
      { type: "table", headers: ["Component", "What it does"], rows: [
        ["Databricks ML notebook", "Hourly job that scores inventory, orders, suppliers, and shipments and writes results to easyflow.risk_signal_feed"],
        ["lib/databricks.ts", "SQL Statement API client — PAT auth, execute statement, async polling"],
        ["lib/databricks-risk-cache.ts", "In-process TTL cache (2h) that holds scored rows between ingest calls"],
        ["/api/integrations/databricks/ingest", "POST endpoint — pulls risk_signal_feed from Databricks and warms the cache"],
        ["lib/canvas-risk.ts", "Maps signals to canvas node types and propagates risk along affected edges"],
      ]},
      { type: "p", text: "Data flows like this:" },
      { type: "code", lang: "text", code: `Operational data (ERP / events)
   ↓
Databricks ML scoring notebook (hourly)
   ↓
easyflow.risk_signal_feed (Delta table)
   ↓
POST /api/integrations/databricks/ingest
   ↓
In-process risk cache (2h TTL)
   ↓
Canvas nodes  ·  Edge overlay  ·  Risk Intelligence panel  ·  FlowGuide` },

      { type: "h2", id: "table", text: "The risk_signal_feed table" },
      { type: "p", text: "All risk signals share a common schema. Your Databricks ML jobs write rows here; EasyFlow reads them." },
      { type: "code", lang: "sql", code: `CREATE TABLE IF NOT EXISTS easyflow.risk_signal_feed (
  tenant             STRING    NOT NULL,  -- EasyFlow tenant slug
  entity_type        STRING    NOT NULL,  -- inventory_sku | order | supplier | shipment
  entity_id          STRING    NOT NULL,
  entity_label       STRING,
  signal_type        STRING    NOT NULL,  -- stockout_risk | order_slip_risk | ...
  risk_level         STRING    NOT NULL,  -- low | medium | high | critical
  risk_score         DOUBLE    NOT NULL,  -- 0–99
  summary            STRING,
  recommended_action STRING,
  predicted_impact   STRING,
  metric_coverage    STRING,
  metric_fill_rate   STRING,
  metric_lead_time   STRING,
  computed_at        TIMESTAMP NOT NULL
)
USING DELTA
PARTITIONED BY (tenant);` },
      { type: "callout", variant: "info", text: "The full DDL is in docs/databricks/risk_signal_feed.sql. A synthetic data notebook for demos is in docs/databricks/easyflow_risk_scorer.py — it generates realistic scored rows for all five EasyFlow tenants and can be scheduled hourly." },

      { type: "h2", id: "features", text: "Five risk features" },
      { type: "table", headers: ["Feature", "entity_type", "What Databricks scores", "What EasyFlow shows"], rows: [
        ["Inventory risk forecasting", "inventory_sku", "Stockout risk, days of coverage, replenishment urgency", "Risk badge on raw_material / inventory_control nodes, stockout summary in risk panel"],
        ["Supplier delay / SLA scoring", "supplier", "Lead-time variability, fill rate, delay history, region instability", "Risk badge on supplier nodes, delay probability in risk panel"],
        ["Order / shipment delay prediction", "order / shipment", "Open orders likely to miss SLA, shipment exception risk", "Risk badge on procurement / dispatch nodes, at-risk order count in risk panel"],
        ["Operations KPI layer", "overview", "Warehouse utilisation, on-time delivery, approval backlog", "KPI context in risk panel and FlowGuide answers"],
        ["AI-ready risk table for FlowGuide", "all", "Daily or hourly scored table with top operational risks and explanation factors", "FlowGuide uses this as high-signal context instead of raw operational tables"],
      ]},

      { type: "h2", id: "config", text: "Configuration" },
      { type: "p", text: "Add three environment variables to apps/web/.env.local:" },
      { type: "code", lang: "env", code: `DATABRICKS_HOST=https://dbc-xxxxxxxx-xxxx.cloud.databricks.com
DATABRICKS_TOKEN=dapi...
DATABRICKS_WAREHOUSE_ID=abc123def456

# Optional — defaults shown
DATABRICKS_CATALOG=hive_metastore
DATABRICKS_SCHEMA=easyflow` },
      { type: "callout", variant: "tip", text: "Go to Integrations → Databricks in the app to check config status and run a live test connection. The Test connection button runs SELECT 1 against your SQL warehouse." },

      { type: "h2", id: "ingest", text: "Ingest endpoint" },
      { type: "p", text: "Call this endpoint to pull the latest risk signals from Databricks into EasyFlow. In production, schedule it with a Vercel Cron or n8n trigger to run every hour." },
      { type: "code", lang: "bash", code: `# Pull all tenants
curl -X POST https://your-easyflow.com/api/integrations/databricks/ingest

# Pull a specific tenant only
curl -X POST https://your-easyflow.com/api/integrations/databricks/ingest?tenant=acme-retail` },
      { type: "table", headers: ["Response field", "What it means"], rows: [
        ["ok", "true if the pull succeeded"],
        ["rowsIngested", "Number of risk signal rows pulled from Databricks"],
        ["tenantsUpdated", "List of tenant slugs whose cache was updated"],
      ]},

      { type: "h2", id: "canvas", text: "Canvas overlay" },
      { type: "p", text: "Once the cache is warm, the workflow canvas reads risk signals automatically and overlays them on the relevant nodes and edges." },
      { type: "table", headers: ["Databricks entity_type", "Canvas node type affected"], rows: [
        ["supplier", "Supplier nodes"],
        ["inventory_sku", "Raw Material + Inventory Control nodes"],
        ["order", "Procurement nodes"],
        ["shipment", "Dispatch nodes"],
        ["overview", "Warehouse nodes"],
      ]},
      { type: "list", items: [
        "Critical risk — red border glow, pulsing Databricks pill, inline summary strip",
        "High risk — orange border glow, pulsing risk badge",
        "Medium risk — yellow badge, no border glow",
        "Affected edges — re-colored red / orange / yellow with ⚠ warning label, animated stroke",
        "Canvas refreshes risk signals every 5 minutes automatically",
      ]},

      { type: "h2", id: "flowguide", text: "FlowGuide context" },
      { type: "p", text: "FlowGuide (the AI assistant) automatically uses the latest Databricks risk signals as high-signal context when answering questions. You can ask:" },
      { type: "list", items: [
        "Which SKUs are likely to stock out this week?",
        "Which supplier is most likely to cause a disruption next?",
        "Which orders are likely to slip their SLA?",
        "What are the top operational risks right now?",
      ]},
      { type: "callout", variant: "info", text: "When Databricks data is present, FlowGuide answers are grounded in ML-scored risk rather than raw operational tables, which significantly improves answer quality and specificity." },

      { type: "h2", id: "fallback", text: "Fallback behaviour" },
      { type: "p", text: "If Databricks is not configured or the ingest cache is cold, EasyFlow automatically falls back to the local heuristic risk scorer. The local scorer uses the same inventory, order, supplier, and shipment data already in the app and produces risk signals in an identical format. The canvas and FlowGuide work identically in both modes — the only difference is the data source and the provider field in the snapshot (local-heuristic vs databricks)." },
    ],
  },

  "connectors": {
    section: "Integrations",
    title: "Available Connectors",
    description: "Current connector architecture, example templates, and what has been implemented so far.",
    toc: [
      { label: "Connector types", anchor: "types", level: 2 },
      { label: "n8n templates", anchor: "templates", level: 2 },
      { label: "Adding a new ERP", anchor: "new", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "types", text: "Connector types" },
      { type: "table", headers: ["Connector path", "Method", "Data shape", "Status"], rows: [
        ["SAP S/4HANA example", "n8n OData polling", "POs and related procurement events", "Template in repo"],
        ["Oracle ERP Cloud example", "n8n REST polling", "Purchase orders and inventory-style events", "Template in repo"],
        ["Microsoft Dynamics 365 pathway", "n8n Dataverse", "Sales, inventory, supplier-style events", "Design path documented"],
        ["NetSuite pathway", "n8n SuiteQL / REST", "Items, POs, vendor and inventory events", "Design path documented"],
      ]},

      { type: "h2", id: "templates", text: "n8n workflow templates" },
      { type: "p", text: "Ready-to-import n8n workflows are in examples/n8n-workflows/. Each file contains a complete n8n workflow with pre-configured nodes, field mappings, and EasyFlow endpoint settings." },
      { type: "list", items: [
        "sap-to-easyflow.json — SAP S/4HANA purchase orders via OData, runs every 5 minutes",
        "oracle-to-easyflow.json — Oracle ERP Cloud purchase orders via REST, runs every 10 minutes",
        "More templates can be added by contributors or customers validating against their own ERP environments",
      ]},
      { type: "callout", variant: "info", text: "The connector story today is best understood as an open integration framework. Some templates and source mappings already exist, while other ERP pathways are documented and ready for customer-side or community-side validation." },

      { type: "h2", id: "new", text: "Adding a new ERP not on the list" },
      { type: "steps", items: [
        { title: "Check if n8n has a node for it", body: "Go to localhost:5678, click Add Node, and search for your ERP name. n8n has 400+ integrations. If it's there, you can build a workflow without any custom code." },
        { title: "Use the generic HTTP node", body: "If n8n doesn't have a dedicated node, use n8n's HTTP Request node with your ERP's REST API. Configure auth, set the endpoint, map the fields, and POST to EasyFlow's webhook." },
        { title: "Use the direct webhook", body: "If your ERP supports outbound webhooks natively (most modern cloud ERPs do), configure it to POST directly to /api/webhooks/inbound/{tenant_id} when events occur. No n8n needed." },
        { title: "Contribute a template", body: "If you build a working n8n template for a new ERP, submit it to the examples/n8n-workflows/ directory via a pull request. The community benefits from every new template." },
      ]},
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // OPERATIONS
  // ══════════════════════════════════════════════════════════════════════════

  "create-workspace": {
    section: "Operations",
    title: "Managing Tenants",
    description: "Create, configure, and manage company workspaces from the Admin Portal.",
    toc: [
      { label: "Creating a workspace", anchor: "creating", level: 2 },
      { label: "Suspending a workspace", anchor: "suspending", level: 2 },
      { label: "Workspace plan", anchor: "plan", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "creating", text: "Creating a workspace" },
      { type: "callout", variant: "info", text: "Only Super Admins can create new workspaces." },
      { type: "p", text: "You can start tenant creation from two places: click New Tenant on the Globe page (/globe), or open the Admin Portal directly (/admin) and click + New Tenant in the Tenants tab." },
      { type: "steps", items: [
        { title: "Open Admin Portal", body: "Click the purple shield icon in the sidebar, or use the New Tenant button on the Globe page." },
        { title: "Click New Tenant", body: "Top-right of the Tenants table." },
        { title: "Step 1 — Company details", body: "Name, industry, operational mode, headquarters, region, plan." },
        { title: "Step 2 — Supply chain modules", body: "Select which modules to enable." },
        { title: "Step 3 — Admin user", body: "Name and email of the workspace admin." },
        { title: "Step 4 — Review", body: "Confirm and create. The workspace is live immediately." },
      ]},

      { type: "h2", id: "suspending", text: "Suspending a workspace" },
      { type: "p", text: "In the Tenants table, click the ⋯ menu next to the workspace and choose Suspend. All users in that workspace lose access immediately. The data is preserved. You can reactivate at any time." },
      { type: "callout", variant: "warning", text: "Suspending a workspace is instant and affects all users. Use with care." },

      { type: "h2", id: "plan", text: "Changing a workspace plan" },
      { type: "p", text: "In the Tenants table, click ⋯ → Edit. Change the plan in the dropdown. Changes take effect immediately. Downgrading may disable modules or users that exceed the new plan's limits." },
    ],
  },

  "manage-users": {
    section: "Operations",
    title: "Managing Users",
    description: "Invite people to workspaces and manage their access.",
    toc: [
      { label: "Inviting users", anchor: "invite", level: 2 },
      { label: "Changing a role", anchor: "role", level: 2 },
      { label: "Suspending access", anchor: "suspend", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "invite", text: "Inviting users" },
      { type: "steps", items: [
        { title: "Open Admin Portal → Users tab", body: "Shows all users across all workspaces (super admin) or just your workspace (tenant admin)." },
        { title: "Click Invite User", body: "Enter full name, work email, and role." },
        { title: "They receive an email", body: "With a link to join EasyFlow. Link expires after 48 hours." },
      ]},

      { type: "h2", id: "role", text: "Changing a role" },
      { type: "p", text: "There are two places to change a user's role:" },
      { type: "list", items: [
        "Admin Portal → Users tab: click the role badge next to a user to pick a new role from the dropdown.",
        "Settings → Users & Roles tab: shows all platform users with an inline role selector. Changes save immediately without leaving Settings.",
      ]},
      { type: "callout", variant: "info", text: "Only Super Admins can change roles. The Super Admin role itself cannot be reassigned from either surface." },

      { type: "h2", id: "suspend", text: "Suspending access" },
      { type: "p", text: "Click Suspend next to a user's name. Their account is disabled but their history is preserved. Click Activate to restore access." },
      { type: "table", headers: ["Plan", "Max users"], rows: [
        ["Starter", "5"],
        ["Professional", "25"],
        ["Enterprise", "Unlimited"],
      ]},
    ],
  },

  "permissions": {
    section: "Operations",
    title: "Permissions",
    description: "Control exactly what each role can see and do in EasyFlow.",
    toc: [
      { label: "How permissions work", anchor: "how", level: 2 },
      { label: "Permission matrix", anchor: "matrix", level: 2 },
      { label: "Customising permissions", anchor: "custom", level: 2 },
    ],
    blocks: [
      { type: "h2", id: "how", text: "How permissions work" },
      { type: "p", text: "Every role has a set of permissions — things members of that role are allowed to do. Permissions can be viewed and changed in Admin Portal → Roles & Permissions. Changes save immediately and apply to all members of that role." },
      { type: "callout", variant: "info", text: "Super Admin permissions are fixed and cannot be changed. All other roles are fully customisable." },

      { type: "h2", id: "matrix", text: "Permission matrix" },
      { type: "table", headers: ["Permission", "Super Admin", "Tenant Admin", "Manager", "Analyst", "Operator"], rows: [
        ["View dashboards", "✓", "✓", "✓", "✓", "✓"],
        ["Run workflow steps", "✓", "✓", "✓", "✗", "✓"],
        ["Approve requests", "✓", "✓", "✓", "✗", "✗"],
        ["Edit workflows", "✓", "✓", "✓", "✗", "✗"],
        ["Invite users", "✓", "✓", "✗", "✗", "✗"],
        ["Change user roles", "✓", "✓", "✗", "✗", "✗"],
        ["Manage ERP connections", "✓", "✓", "✗", "✗", "✗"],
        ["View reports", "✓", "✓", "✓", "✓", "✗"],
        ["Export data", "✓", "✓", "✓", "✓", "✗"],
        ["Create workspaces", "✓", "✗", "✗", "✗", "✗"],
        ["Platform settings", "✓", "✗", "✗", "✗", "✗"],
        ["View audit log", "✓", "✓", "✗", "✗", "✗"],
      ]},

      { type: "h2", id: "custom", text: "Customising permissions" },
      { type: "p", text: "Open Admin Portal → Roles & Permissions tab. Click any checkbox to toggle a permission for a role. Changes save automatically and take effect immediately." },
      { type: "callout", variant: "tip", text: "Start with the defaults. They reflect how most supply chain teams are structured. Only adjust when a specific person or situation needs it." },
    ],
  },
};
