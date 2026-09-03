import Link from "next/link";
import { ArrowRight, Boxes, Package, Search, Truck, Users } from "lucide-react";
import { getTenantSearchResults, groupTenantSearchResults } from "@/lib/tenant-search";

type SearchPageProps = {
  params: { tenant: string };
  searchParams?: { q?: string };
};

const sectionConfig = {
  Inventory: { icon: Package, colour: "text-cyan-300" },
  Shipments: { icon: Truck, colour: "text-orange-300" },
  Suppliers: { icon: Users, colour: "text-lime-300" },
  Orders: { icon: Boxes, colour: "text-blue-300" },
} as const;

export default async function TenantSearchPage({ params, searchParams }: SearchPageProps) {
  const query = (searchParams?.q ?? "").trim();
  const tenantName = decodeURIComponent(params.tenant).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const results = query ? await getTenantSearchResults(params.tenant, query) : [];
  const grouped = groupTenantSearchResults(results) as Array<[keyof typeof sectionConfig, typeof results]>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="mb-3 flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.34em] text-secondary/85">
          <Search className="h-4 w-4" />
          Tenant Search
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Search {tenantName}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-white/55">
          Search across inventory, shipments, suppliers, and recent orders from one place.
        </p>
      </section>

      {!query ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="text-lg font-medium text-white">Start with a keyword</div>
          <p className="mt-2 text-white/50">
            Try a SKU, shipment ID, supplier name, destination, or customer.
          </p>
        </section>
      ) : results.length === 0 ? (
        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="text-lg font-medium text-white">No results for “{query}”</div>
          <p className="mt-2 text-white/50">
            Try a broader term such as a warehouse, carrier, supplier, or SKU family.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {grouped.map(([section, items]) => {
            const { icon: Icon, colour } = sectionConfig[section];
            return (
              <section key={section} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${colour}`} />
                  <div className="text-[0.72rem] uppercase tracking-[0.34em] text-white/45">
                    {section}
                  </div>
                </div>
                <div className="overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.02]">
                  <div className="divide-y divide-white/[0.06]">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <div className="text-base font-medium text-white">{item.title}</div>
                          <div className="mt-1 text-sm text-white/60">{item.subtitle}</div>
                          <div className="mt-1 text-sm text-white/40">{item.meta}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/35" />
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
