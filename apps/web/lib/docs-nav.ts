export type DocPage = {
  slug: string;
  title: string;
  description: string;
};

export type DocSection = {
  title: string;
  pages: DocPage[];
};

export const docsNav: DocSection[] = [
  {
    title: "Why EasyFlow",
    pages: [
      { slug: "the-problem",       title: "The Problem We Solve",      description: "Why supply chain teams are still drowning in spreadsheets and emails." },
      { slug: "business-use-cases",title: "Business Use Cases",        description: "Real business scenarios where EasyFlow saves time and reduces operational risk." },
      { slug: "project-vision",    title: "Project Vision & Status",   description: "What EasyFlow is trying to become, what is already built, and what still needs validation." },
      { slug: "vs-alternatives",   title: "vs. Existing Solutions",     description: "How EasyFlow is positioned against ERP workflow layers, planning suites, generic tools, and spreadsheets." },
      { slug: "who-its-for",       title: "Who It's For",               description: "The teams and companies EasyFlow is built for." },
    ],
  },
  {
    title: "Architecture",
    pages: [
      { slug: "architecture",      title: "System Architecture",        description: "How EasyFlow's layers fit together — API, engine, messaging, and UI." },
      { slug: "data-flow",         title: "Data Flow",                  description: "How a request moves from ERP event to workflow execution." },
      { slug: "multi-tenancy",     title: "Multi-Tenancy Model",        description: "How EasyFlow keeps every company's data completely isolated." },
      { slug: "deployment-architecture", title: "Deployment Architecture", description: "How to deploy the full stack for a public demo or self-hosted setup." },
      { slug: "ai-copilot",        title: "AI Copilot",                 description: "How the tenant-safe assistant uses LangChain, MCP, and a local LLM backend." },
    ],
  },
  {
    title: "Getting Started",
    pages: [
      { slug: "quick-start",       title: "Quick Start (5 min)",        description: "Sign in, create a workspace, and build your first flow." },
      { slug: "self-host",         title: "Self-Host with Docker",      description: "Run EasyFlow on your own server in under 10 minutes." },
      { slug: "first-workflow",    title: "Your First Workflow",        description: "Build a purchase order approval flow step by step." },
    ],
  },
  {
    title: "Core Concepts",
    pages: [
      { slug: "workspaces",        title: "Workspaces",                 description: "Every company gets its own private, isolated environment." },
      { slug: "workflow-canvas",   title: "Workflow Canvas",            description: "Draw approval flows and processes on a visual board." },
      { slug: "key-concepts",      title: "Roles & Access",             description: "Who can see and do what inside each workspace." },
    ],
  },
  {
    title: "Integrations",
    pages: [
      { slug: "connect-erp",            title: "Connecting Your ERP",        description: "Webhook- and n8n-based ERP integration architecture for self-hosted deployments." },
      { slug: "connectors",             title: "Available Connectors",       description: "What connector pathways, templates, and source mappings exist so far." },
      { slug: "webhook-reference",      title: "Webhook Reference",          description: "All event types, headers, and payload formats." },
      { slug: "databricks-integration", title: "Databricks Risk Intelligence", description: "How ML-scored risk signals flow from Databricks into the canvas, risk panel, and FlowGuide." },
    ],
  },
  {
    title: "Operations",
    pages: [
      { slug: "create-workspace",  title: "Managing Tenants",           description: "Create, configure, and suspend company workspaces." },
      { slug: "manage-users",      title: "Managing Users",             description: "Invite people and control what they can access." },
      { slug: "permissions",       title: "Permissions",                description: "Role-based access — who can do what." },
    ],
  },
];

export function findPage(slug: string): DocPage | undefined {
  for (const section of docsNav) {
    const page = section.pages.find((p) => p.slug === slug);
    if (page) return page;
  }
  return undefined;
}

export function findSection(slug: string): DocSection | undefined {
  return docsNav.find((s) => s.pages.some((p) => p.slug === slug));
}

export function adjacentPages(slug: string): { prev?: DocPage; next?: DocPage } {
  const all = docsNav.flatMap((s) => s.pages);
  const idx = all.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : undefined,
    next: idx < all.length - 1 ? all[idx + 1] : undefined,
  };
}
