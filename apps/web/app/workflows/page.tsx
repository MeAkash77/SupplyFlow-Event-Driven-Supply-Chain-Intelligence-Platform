import { CanvasShell } from "../../components/canvas-shell";
import { ProcessBuilder } from "../../components/process-builder";

export default function WorkflowsPage() {
  return (
    <CanvasShell
      title="Business Processes"
      subtitle="Define each tenant's business process on a shared canvas"
    >
      <ProcessBuilder />
    </CanvasShell>
  );
}
