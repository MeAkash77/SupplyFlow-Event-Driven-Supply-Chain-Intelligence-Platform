export type ConnectorCatalogItem = {
  type: string;
  label: string;
  description: string;
  fields: string[];
};

export type TenantConnectorItem = {
  id: number;
  tenant_id: string;
  connector_type: string;
  config: Record<string, unknown>;
  created_by: string;
};

async function apiRequest(path: string, options: RequestInit = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json", "X-Actor-Id": "superadmin-1" }, ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? res.statusText);
  }
  return res.json();
}

export async function getConnectorCatalog() {
  return apiRequest("/api/connectors");
}

export async function getTenantConnectors(tenantId: string) {
  return apiRequest(`/api/tenants/${tenantId}/connectors`);
}

export async function createTenantConnector(tenantId: string, payload: { connector_type: string; config: Record<string, unknown> }) {
  return apiRequest(`/api/tenants/${tenantId}/connectors`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTenantConnector(tenantId: string, connectorId: number, payload: { config?: Record<string, unknown>; connector_type?: string }) {
  return apiRequest(`/api/tenants/${tenantId}/connectors/${connectorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function testTenantConnector(tenantId: string, connectorId: number) {
  return apiRequest(`/api/tenants/${tenantId}/connectors/${connectorId}/test`, {
    method: "POST",
  });
}
