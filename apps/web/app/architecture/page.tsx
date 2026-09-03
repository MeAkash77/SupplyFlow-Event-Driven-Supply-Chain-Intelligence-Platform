import { AppShell } from "@/components/app-shell";
import { ArchitectureDiagrams } from "@/components/architecture-diagrams";

export default function ArchitecturePage() {
  return (
    <AppShell title="Architecture" subtitle="System diagrams — how EasyFlow is built and how data flows">
      <ArchitectureDiagrams />
    </AppShell>
  );
}
