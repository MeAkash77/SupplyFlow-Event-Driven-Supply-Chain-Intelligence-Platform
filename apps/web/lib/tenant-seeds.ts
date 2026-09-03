export type TenantSeed = {
  name: string;
  slug: string;
  industry: string;
  headquarters: string;
  mode: string;
  region: string;
};

export type TenantTemplate = {
  key: string;
  label: string;
  industry: string;
  headquarters: string;
  mode: string;
  region: string;
  description: string;
};

export const tenantTemplates: TenantTemplate[] = [
  {
    key: "retail",
    label: "Retail Replenishment",
    industry: "Retail",
    headquarters: "Chicago, IL",
    mode: "Seasonal replenishment",
    region: "Midwest United States",
    description: "For retailers coordinating demand signals, warehouse allocation, and store dispatch.",
  },
  {
    key: "manufacturing",
    label: "Manufacturing Dispatch",
    industry: "Manufacturing",
    headquarters: "Detroit, MI",
    mode: "Plant dispatch flow",
    region: "Great Lakes",
    description: "For plant operations teams managing raw materials, supplier coordination, and line feed.",
  },
  {
    key: "food",
    label: "Cold Chain Distribution",
    industry: "Food Distribution",
    headquarters: "Jacksonville, FL",
    mode: "Cold chain dispatch",
    region: "Southeast United States",
    description: "For temperature-sensitive inventory, compliance checks, and route-based store fulfillment.",
  },
  {
    key: "medical",
    label: "Medical Supply Fulfillment",
    industry: "Medical Supply",
    headquarters: "Minneapolis, MN",
    mode: "Hospital restock approvals",
    region: "North Central",
    description: "For regulated replenishment flows with approval gates, warehouse staging, and courier handoff.",
  },
  {
    key: "electronics",
    label: "Launch Allocation",
    industry: "Consumer Electronics",
    headquarters: "Austin, TX",
    mode: "Launch allocation flow",
    region: "Southwest United States",
    description: "For channel allocation, launch inventory controls, and coordinated dispatch planning.",
  },
];

export const tenantSeeds: TenantSeed[] = [
  {
    name: "Acme Retail",
    slug: "acme-retail",
    industry: "Retail",
    headquarters: "Chicago, IL",
    mode: "Seasonal replenishment",
    region: "Midwest United States",
  },
  {
    name: "Nova Manufacturing",
    slug: "nova-manufacturing",
    industry: "Manufacturing",
    headquarters: "Detroit, MI",
    mode: "Plant dispatch flow",
    region: "Great Lakes",
  },
  {
    name: "BlueHarbor Foods",
    slug: "blueharbor-foods",
    industry: "Food Distribution",
    headquarters: "Jacksonville, FL",
    mode: "Cold chain dispatch",
    region: "Southeast United States",
  },
  {
    name: "Northstar Medical Supply",
    slug: "northstar-medical-supply",
    industry: "Medical Supply",
    headquarters: "Minneapolis, MN",
    mode: "Hospital restock approvals",
    region: "North Central",
  },
  {
    name: "Solstice Consumer Electronics",
    slug: "solstice-consumer-electronics",
    industry: "Consumer Electronics",
    headquarters: "Austin, TX",
    mode: "Launch allocation flow",
    region: "Southwest United States",
  },
];
