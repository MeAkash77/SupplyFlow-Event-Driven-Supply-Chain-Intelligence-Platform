import { AppShell } from "../../components/app-shell";
import { ForecastingDashboard } from "../../components/forecasting-dashboard";
import { Badge } from "../../components/ui/badge";

export default function ForecastingPage({ searchParams }: { searchParams?: { tenant?: string } }) {
  const tenantSlug = searchParams?.tenant;

  return (
    <AppShell
      title="Forecasting"
      subtitle="Demand projections, inventory coverage, supplier performance, and bottleneck risk"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="accent" className="border-white/10 bg-white/5 text-foreground">
            Analytics
          </Badge>
          <h1 className="mt-3 text-2xl font-medium tracking-tight md:text-3xl">
            Forward-looking signals.
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-[0.95rem]">
            12-week demand forecast, inventory coverage gaps, supplier fill rate trends, and workflow bottleneck risk — all in one view.
          </p>
        </div>
      </header>

      <div className="mt-6">
        <ForecastingDashboard tenantSlug={tenantSlug} />
      </div>
    </AppShell>
  );
}
