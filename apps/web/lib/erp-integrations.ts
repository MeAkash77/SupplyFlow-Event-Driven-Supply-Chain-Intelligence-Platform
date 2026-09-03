// ─── ERP connector catalogue ──────────────────────────────────────────────────

export type ConnectorId =
  | "sap_s4hana"
  | "oracle_fusion"
  | "ms_dynamics"
  | "netsuite"
  | "workday"
  | "rest_api";

export type ConnectionStatus = "connected" | "syncing" | "error" | "pending" | "disconnected";

export interface ERPConnector {
  id:          ConnectorId;
  name:        string;
  vendor:      string;
  description: string;
  logoColor:   string;
  modules:     string[];      // ERP modules this connector surfaces
  authType:    "oauth2" | "basic" | "api_key" | "saml";
  fields:      CredentialField[];
}

export interface CredentialField {
  key:         string;
  label:       string;
  type:        "text" | "password" | "url" | "select";
  placeholder: string;
  required:    boolean;
  options?:    string[];
}

export interface FieldMapping {
  erpObject:    string;
  erpField:     string;
  easyflowField:string;
  module:       string;
  enabled:      boolean;
}

export interface SyncRecord {
  id:        string;
  startedAt: string;
  duration:  string;
  records:   number;
  status:    "success" | "partial" | "failed";
  module:    string;
}

export interface InstalledConnection {
  id:          string;
  connectorId: ConnectorId;
  tenantName:  string;
  name:        string;              // user-given name e.g. "Production SAP"
  environment: "production" | "sandbox";
  status:      ConnectionStatus;
  lastSync:    string;
  recordsSynced: number;
  mappings:    FieldMapping[];
  syncHistory: SyncRecord[];
  syncFrequency: string;
}

// ─── Connector catalogue ──────────────────────────────────────────────────────

export const CONNECTORS: ERPConnector[] = [
  {
    id:          "sap_s4hana",
    name:        "SAP S/4HANA",
    vendor:      "SAP",
    description: "Connect to SAP S/4HANA Cloud or on-premise. Sync purchase orders, inventory, suppliers, and production orders in real time.",
    logoColor:   "#0070F2",
    modules:     ["Materials Management", "Procurement", "Inventory", "Production Planning", "Sales & Distribution"],
    authType:    "oauth2",
    fields: [
      { key: "host",        label: "SAP Host URL",     type: "url",      placeholder: "https://your-tenant.s4hana.cloud",     required: true },
      { key: "client_id",   label: "OAuth Client ID",  type: "text",     placeholder: "SAPClientID_xxxxxxxx",                 required: true },
      { key: "client_secret",label:"OAuth Secret",     type: "password", placeholder: "••••••••••••••••",                    required: true },
      { key: "company_code",label: "Company Code",     type: "text",     placeholder: "1000",                                  required: true },
      { key: "environment", label: "Environment",      type: "select",   placeholder: "",                                      required: true, options: ["Production", "Sandbox", "Development"] },
    ],
  },
  {
    id:          "oracle_fusion",
    name:        "Oracle Fusion Cloud",
    vendor:      "Oracle",
    description: "Integrate with Oracle Fusion Cloud ERP for procurement, financials, and supply chain management modules.",
    logoColor:   "#F80000",
    modules:     ["Procurement", "Inventory Management", "Order Management", "Financials", "Manufacturing"],
    authType:    "oauth2",
    fields: [
      { key: "host",         label: "Pod URL",          type: "url",      placeholder: "https://your-pod.oraclecloud.com",     required: true },
      { key: "client_id",    label: "Client ID",        type: "text",     placeholder: "oracle_client_id",                     required: true },
      { key: "client_secret",label: "Client Secret",   type: "password", placeholder: "••••••••••••••••",                    required: true },
      { key: "environment",  label: "Environment",      type: "select",   placeholder: "",                                      required: true, options: ["Production", "Test"] },
    ],
  },
  {
    id:          "ms_dynamics",
    name:        "Microsoft Dynamics 365",
    vendor:      "Microsoft",
    description: "Connect Dynamics 365 Supply Chain Management for end-to-end visibility of orders, warehouses, and transportation.",
    logoColor:   "#00A4EF",
    modules:     ["Supply Chain Management", "Warehouse Management", "Transportation", "Procurement", "Finance"],
    authType:    "oauth2",
    fields: [
      { key: "tenant_id",    label: "Azure Tenant ID",  type: "text",     placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
      { key: "client_id",    label: "App (Client) ID",  type: "text",     placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
      { key: "client_secret",label: "Client Secret",   type: "password", placeholder: "••••••••••••••••",                    required: true },
      { key: "d365_url",     label: "D365 Environment URL", type: "url", placeholder: "https://your-env.crm.dynamics.com",  required: true },
    ],
  },
  {
    id:          "netsuite",
    name:        "Oracle NetSuite",
    vendor:      "Oracle",
    description: "Pull inventory, purchase orders, vendor data, and fulfilment records from NetSuite into your supply chain canvas.",
    logoColor:   "#009DDD",
    modules:     ["Inventory", "Purchasing", "Order Management", "Financials", "WMS"],
    authType:    "oauth2",
    fields: [
      { key: "account_id",   label: "Account ID",       type: "text",     placeholder: "TSTDRV1234567",                        required: true },
      { key: "consumer_key", label: "Consumer Key",     type: "text",     placeholder: "netsuite_consumer_key",                required: true },
      { key: "consumer_secret",label:"Consumer Secret", type: "password", placeholder: "••••••••••••••••",                    required: true },
      { key: "token_id",     label: "Token ID",         type: "text",     placeholder: "token_id",                             required: true },
      { key: "token_secret", label: "Token Secret",     type: "password", placeholder: "••••••••••••••••",                    required: true },
    ],
  },
  {
    id:          "workday",
    name:        "Workday",
    vendor:      "Workday",
    description: "Sync supplier contracts, procurement workflows, and spend analytics from Workday Financial Management.",
    logoColor:   "#F5821F",
    modules:     ["Procurement", "Supplier Contracts", "Spend Analytics", "Inventory Accounting"],
    authType:    "basic",
    fields: [
      { key: "tenant",       label: "Workday Tenant",   type: "text",     placeholder: "your_tenant_name",                     required: true },
      { key: "username",     label: "Integration User", type: "text",     placeholder: "integration_user@yourcompany.com",     required: true },
      { key: "password",     label: "Password",         type: "password", placeholder: "••••••••••••••••",                    required: true },
      { key: "endpoint",     label: "WSDL Endpoint",    type: "url",      placeholder: "https://wd2-impl-services1.workday.com/ccx/service/...", required: false },
    ],
  },
  {
    id:          "rest_api",
    name:        "Custom REST API",
    vendor:      "Custom",
    description: "Connect any ERP or supply chain system that exposes a REST API. Configure endpoints, authentication, and field mappings manually.",
    logoColor:   "#6366F1",
    modules:     ["Custom — any module via endpoint mapping"],
    authType:    "api_key",
    fields: [
      { key: "base_url",     label: "Base URL",          type: "url",     placeholder: "https://api.yourcompany.com/v1",       required: true },
      { key: "api_key",      label: "API Key",           type: "password",placeholder: "sk_live_••••••••••••••••",            required: true },
      { key: "auth_header",  label: "Auth Header Name",  type: "text",    placeholder: "X-API-Key",                           required: false },
      { key: "environment",  label: "Environment",       type: "select",  placeholder: "",                                     required: true, options: ["Production", "Staging", "Development"] },
    ],
  },
];

// ─── Default field mappings per connector ────────────────────────────────────

export const DEFAULT_MAPPINGS: Record<ConnectorId, FieldMapping[]> = {
  sap_s4hana: [
    { erpObject: "PurchaseOrder",     erpField: "PurchaseOrder",     easyflowField: "procurement.openPOs",        module: "Procurement",  enabled: true  },
    { erpObject: "PurchaseOrder",     erpField: "DocumentDate",      easyflowField: "procurement.poDate",         module: "Procurement",  enabled: true  },
    { erpObject: "Vendor",            erpField: "Supplier",          easyflowField: "suppliers.name",             module: "Suppliers",    enabled: true  },
    { erpObject: "Vendor",            erpField: "SupplierCountry",   easyflowField: "suppliers.country",          module: "Suppliers",    enabled: true  },
    { erpObject: "MaterialStock",     erpField: "MatlStkAvailQty",   easyflowField: "inventory.stock",            module: "Inventory",    enabled: true  },
    { erpObject: "MaterialStock",     erpField: "Plant",             easyflowField: "inventory.location",         module: "Inventory",    enabled: true  },
    { erpObject: "DeliveryDocument",  erpField: "ShippingPoint",     easyflowField: "logistics.origin",           module: "Logistics",    enabled: true  },
    { erpObject: "DeliveryDocument",  erpField: "ActualDelivDate",   easyflowField: "logistics.eta",              module: "Logistics",    enabled: false },
    { erpObject: "ProductionOrder",   erpField: "PlannedQuantity",   easyflowField: "inventory.plannedQty",       module: "Inventory",    enabled: false },
  ],
  oracle_fusion: [
    { erpObject: "PurchaseOrders",    erpField: "OrderNumber",       easyflowField: "procurement.openPOs",        module: "Procurement",  enabled: true  },
    { erpObject: "Suppliers",         erpField: "SupplierName",      easyflowField: "suppliers.name",             module: "Suppliers",    enabled: true  },
    { erpObject: "InventoryItems",    erpField: "OnHandQuantity",    easyflowField: "inventory.stock",            module: "Inventory",    enabled: true  },
    { erpObject: "ShipmentLines",     erpField: "ShipmentNumber",    easyflowField: "logistics.tracking",         module: "Logistics",    enabled: true  },
  ],
  ms_dynamics: [
    { erpObject: "PurchaseOrderLine", erpField: "PurchaseOrderNumber",easyflowField:"procurement.openPOs",       module: "Procurement",  enabled: true  },
    { erpObject: "InventoryWarehouse",erpField: "WarehouseName",     easyflowField: "logistics.warehouseName",   module: "Logistics",    enabled: true  },
    { erpObject: "VendorV2",          erpField: "VendorAccountNumber",easyflowField:"suppliers.id",             module: "Suppliers",    enabled: true  },
    { erpObject: "SalesOrderLine",    erpField: "ShippingCarrierId", easyflowField: "logistics.carrier",         module: "Logistics",    enabled: true  },
  ],
  netsuite: [
    { erpObject: "purchaseOrder",     erpField: "tranId",            easyflowField: "procurement.openPOs",        module: "Procurement",  enabled: true  },
    { erpObject: "vendor",            erpField: "entityId",          easyflowField: "suppliers.name",             module: "Suppliers",    enabled: true  },
    { erpObject: "inventoryItem",     erpField: "quantityOnHand",    easyflowField: "inventory.stock",            module: "Inventory",    enabled: true  },
    { erpObject: "itemFulfillment",   erpField: "shipDate",          easyflowField: "logistics.dispatched",       module: "Logistics",    enabled: true  },
  ],
  workday: [
    { erpObject: "Purchase_Order",    erpField: "Document_Number",   easyflowField: "procurement.openPOs",        module: "Procurement",  enabled: true  },
    { erpObject: "Supplier_Contract", erpField: "Supplier_Name",     easyflowField: "suppliers.name",             module: "Suppliers",    enabled: true  },
    { erpObject: "Spend_Category",    erpField: "Amount",            easyflowField: "procurement.spend",          module: "Procurement",  enabled: true  },
  ],
  rest_api: [
    { erpObject: "custom",            erpField: "custom_field_1",    easyflowField: "procurement.openPOs",        module: "Custom",       enabled: false },
    { erpObject: "custom",            erpField: "custom_field_2",    easyflowField: "inventory.stock",            module: "Custom",       enabled: false },
  ],
};

// ─── Generate mock installed connections per tenant ────────────────────────────

import { tenantRng } from "./tenant-utils";

const STORAGE_KEY = "easyflow-erp-connections-v1";

export function getConnections(tenantName: string): InstalledConnection[] {
  if (typeof window === "undefined") return seedConnections(tenantName);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedConnections(tenantName);
    const all: InstalledConnection[] = JSON.parse(raw);
    return all.filter(c => c.tenantName === tenantName);
  } catch { return seedConnections(tenantName); }
}

export function saveConnection(conn: InstalledConnection) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: InstalledConnection[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex(c => c.id === conn.id);
    if (idx >= 0) all[idx] = conn; else all.push(conn);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function deleteConnection(id: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all: InstalledConnection[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all.filter(c => c.id !== id)));
  } catch {}
}

// Default seeded connection for demo tenants
function seedConnections(tenantName: string): InstalledConnection[] {
  const rng = tenantRng(`${tenantName}::erp`);
  const connectorId: ConnectorId = rng.pick(["sap_s4hana", "oracle_fusion", "ms_dynamics"]) as ConnectorId;
  const connector = CONNECTORS.find(c => c.id === connectorId)!;
  const synced = Math.floor(rng.between(8000, 80000, 0));
  const minsAgo = Math.floor(rng.between(5, 120, 0));
  const modules = ["Procurement", "Inventory", "Suppliers", "Logistics"];

  return [{
    id:            `${tenantName.toLowerCase().replace(/\s+/g, "-")}-default`,
    connectorId,
    tenantName,
    name:          `${connector.name} — Production`,
    environment:   "production",
    status:        rng.next() > 0.15 ? "connected" : "error",
    lastSync:      `${minsAgo} min ago`,
    recordsSynced: synced,
    syncFrequency: "Every 15 minutes",
    mappings:      DEFAULT_MAPPINGS[connectorId],
    syncHistory:   Array.from({ length: 8 }, (_, i) => ({
      id:        `sync-${i}`,
      startedAt: `${(i + 1) * 15}m ago`,
      duration:  `${Math.floor(rng.between(8, 45, 0))}s`,
      records:   Math.floor(rng.between(200, 3000, 0)),
      status:    (rng.next() > 0.12 ? "success" : rng.next() > 0.5 ? "partial" : "failed") as SyncRecord["status"],
      module:    rng.pick(modules),
    })),
  }];
}
