import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const nodes = [
  {
    id: "inventory-check",
    title: "Inventory Check",
    kind: "inventory_check",
    copy: "Validate stock thresholds before creating procurement demand.",
  },
  {
    id: "manager-approval",
    title: "Manager Approval",
    kind: "approval",
    copy: "Route low-stock requests to warehouse managers with SLA controls.",
  },
  {
    id: "supplier-allocation",
    title: "Supplier Allocation",
    kind: "supplier_assignment",
    copy: "Choose the preferred vendor using cost, reliability, and lead time.",
  },
  {
    id: "shipment-create",
    title: "Shipment Creation",
    kind: "shipment",
    copy: "Issue outbound shipment creation after approval and vendor selection.",
  },
];

export function WorkflowBuilderPreview() {
  return (
    <div className="grid gap-4">
      {nodes.map((node, index) => (
        <div key={node.id}>
          <Card className="rounded-[24px] bg-slate-900/70">
            <CardContent className="p-5">
              <Badge variant="secondary" className="mb-4 w-fit">
                {node.kind}
              </Badge>
              <h3 className="text-lg font-semibold">{node.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{node.copy}</p>
            </CardContent>
          </Card>
          {index < nodes.length - 1 ? (
            <div className="pl-4 pt-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
              transition
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
