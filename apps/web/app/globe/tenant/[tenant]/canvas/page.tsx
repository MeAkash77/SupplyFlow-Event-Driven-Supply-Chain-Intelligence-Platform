"use client";

import { ProcessBuilder } from "@/components/process-builder";

export default function TenantCanvasPage({ params }: { params: { tenant: string } }) {
  const tenantName = params.tenant
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="-mx-4 -my-6 md:-mx-8 md:-my-8 h-[calc(100vh-64px)]">
      <ProcessBuilder defaultTenant={tenantName} />
    </div>
  );
}
