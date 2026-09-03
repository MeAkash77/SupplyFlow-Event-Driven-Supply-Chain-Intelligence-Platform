import { ArrowLeft, ArrowRight } from "lucide-react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { WorkInProgress } from "@/components/docs/work-in-progress";
import { docsNav, adjacentPages, findPage } from "@/lib/docs-nav";
import { DOCS_CONTENT, DocContent } from "@/lib/docs-content";
import { cn } from "@/lib/utils";

export function DocsPage({ slug }: { slug: string }) {
  const page = findPage(slug);
  const hasContent = Boolean(DOCS_CONTENT[slug]);
  const content = DOCS_CONTENT[slug] ?? DOCS_CONTENT["the-problem"];
  const { prev, next } = adjacentPages(slug);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(214,55%,4%)] text-white">
      <div className="hidden w-[320px] shrink-0 lg:flex lg:flex-col">
        <DocsSidebar activeSlug={slug} />
      </div>

      <main className="flex flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-1 flex-col">
          <div className="sticky top-0 z-10 border-b border-white/8 bg-[hsl(214,55%,4%)]/90 px-8 py-3.5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[0.8rem] text-white/35">
              <a href="/docs/quick-start" className="hover:text-white/60 transition">
                Docs
              </a>
              <span className="text-white/20">/</span>
              {page && (
                <>
                  <span className="text-white/30">
                    {docsNav.find((s) => s.pages.some((p) => p.slug === slug))?.title}
                  </span>
                  <span className="text-white/20">/</span>
                </>
              )}
              <span className="text-white/70">{page?.title ?? "Page"}</span>
            </div>
          </div>

          <div className="flex flex-1 gap-12 px-10 py-12 xl:px-20 2xl:px-28">
            <article className="min-w-0 max-w-3xl flex-1">
              {hasContent ? (
                <DocRenderer content={content} />
              ) : (
                <>
                  <div className="mb-10 border-b border-white/8 pb-10">
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
                      {findPage(slug)
                        ? docsNav.find((section) =>
                            section.pages.some((entry) => entry.slug === slug)
                          )?.title
                        : "Docs"}
                    </p>
                    <h1
                      className="mt-3 text-4xl font-semibold tracking-tight text-white leading-tight"
                      style={{ fontFamily: "var(--font-brand)" }}
                    >
                      {page?.title ?? "Coming soon"}
                    </h1>
                    <p className="mt-3 max-w-2xl text-[1.02rem] leading-8 text-white/45">{page?.description}</p>
                  </div>
                  <WorkInProgress eta="Next release" />
                </>
              )}

              <div className="mt-14 flex items-center justify-between gap-4 border-t border-white/8 pt-8">
                {prev ? (
                  <a
                    href={`/docs/${prev.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 text-sm transition hover:border-white/15 hover:bg-white/5"
                  >
                    <ArrowLeft className="h-4 w-4 text-white/30 transition group-hover:text-[hsl(184,73%,61%)]" />
                    <div>
                      <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">
                        Previous
                      </div>
                      <div className="mt-0.5 font-medium text-white/70 group-hover:text-white">
                        {prev.title}
                      </div>
                    </div>
                  </a>
                ) : (
                  <div />
                )}
                {next ? (
                  <a
                    href={`/docs/${next.slug}`}
                    className="group ml-auto flex items-center gap-3 rounded-2xl border border-white/8 bg-white/3 px-5 py-4 text-right text-sm transition hover:border-white/15 hover:bg-white/5"
                  >
                    <div>
                      <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/30">
                        Next
                      </div>
                      <div className="mt-0.5 font-medium text-white/70 group-hover:text-white">
                        {next.title}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/30 transition group-hover:text-[hsl(184,73%,61%)]" />
                  </a>
                ) : (
                  <div />
                )}
              </div>
            </article>

            <aside className="hidden w-56 shrink-0 xl:block">
              <div className="sticky top-24">
                <div className="mb-3 border-l-2 border-white/10 pl-3">
                  <div className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/30">
                    On this page
                  </div>
                </div>
                <nav className="space-y-0.5">
                  {content.toc.map((item, index) => (
                    <a
                      key={index}
                      href={`#${item.anchor}`}
                      className={cn(
                        "block rounded-lg py-1.5 text-[0.78rem] transition-colors hover:text-white/80",
                        item.level === 2
                          ? "pl-3 text-white/50"
                          : "pl-5 text-[0.73rem] text-white/30 hover:text-white/55"
                      )}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/25 mb-2">Resources</div>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 py-1 text-[0.75rem] text-white/35 hover:text-white/65 transition">
                    → GitHub
                  </a>
                  <a href="/settings" className="flex items-center gap-2 py-1 text-[0.75rem] text-white/35 hover:text-white/65 transition">
                    → Integrations
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function DocRenderer({ content }: { content: DocContent }) {
  return (
    <div>
      {/* Page header */}
      <div className="mb-12 border-b border-white/8 pb-10">
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em] text-[hsl(184,73%,61%)]">
          {content.section}
        </p>
        <h1
          className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-[2.75rem] leading-tight"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          {content.title}
        </h1>
        <p className="mt-4 max-w-2xl text-[1.05rem] leading-8 text-white/50">{content.description}</p>
      </div>

      <div className="space-y-6">
        {content.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </div>
    </div>
  );
}

type BlockDef =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "callout"; variant: "info" | "warning" | "tip"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "steps"; items: { title: string; body: string }[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; items: string[] };

function Block({ block }: { block: BlockDef }) {
  if (block.type === "h2") {
    return (
      <div className="mt-10 mb-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <h2
          id={block.id}
          className="scroll-mt-24 text-[1.45rem] font-semibold tracking-tight text-white"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          {block.text}
        </h2>
        <div className="h-px flex-1 bg-white/8" />
      </div>
    );
  }

  if (block.type === "h3") {
    return (
      <h3
        id={block.id}
        className="scroll-mt-24 mt-6 mb-1 flex items-center gap-2 text-[1.1rem] font-semibold text-white/90"
      >
        <span className="inline-block h-1 w-4 rounded-full bg-[hsl(184,73%,61%)]/60" />
        {block.text}
      </h3>
    );
  }

  if (block.type === "p") {
    return <p className="text-[0.97rem] leading-8 text-white/60">{block.text}</p>;
  }

  if (block.type === "callout") {
    const styles = {
      info:    { wrap: "border-sky-500/25 bg-sky-500/8",    icon: "ℹ", text: "text-sky-200"   },
      warning: { wrap: "border-amber-500/25 bg-amber-500/8", icon: "⚠", text: "text-amber-200" },
      tip:     { wrap: "border-[hsl(184,73%,61%)]/25 bg-[hsl(184,73%,61%)]/8", icon: "✦", text: "text-[hsl(184,73%,61%)]" },
    };
    const s = styles[block.variant];
    return (
      <div className={cn("flex gap-3 rounded-2xl border px-5 py-4", s.wrap)}>
        <span className={cn("shrink-0 text-base leading-7", s.text)}>{s.icon}</span>
        <span className={cn("text-[0.93rem] leading-7", s.text)}>{block.text}</span>
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/8 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-5 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <span className="ml-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/30">
              {block.lang}
            </span>
          </div>
          <button type="button" className="text-[0.72rem] text-white/30 transition hover:text-[hsl(184,73%,61%)]">
            Copy
          </button>
        </div>
        <pre className="overflow-x-auto bg-[hsl(214,55%,3%)] px-6 py-5 text-[0.83rem] leading-7 text-[hsl(184,73%,61%)]">
          <code>{block.code}</code>
        </pre>
      </div>
    );
  }

  if (block.type === "steps") {
    return (
      <div className="space-y-0">
        {block.items.map((step, index) => (
          <div key={index} className="flex gap-5">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[hsl(184,73%,61%)]/35 bg-[hsl(184,73%,61%)]/12 text-xs font-bold text-[hsl(184,73%,61%)]">
                {index + 1}
              </div>
              {index < block.items.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-[hsl(184,73%,61%)]/15" style={{ minHeight: "2rem" }} />
              )}
            </div>
            <div className="flex-1 pb-6 pt-0.5">
              <div className="text-[1rem] font-semibold text-white">{step.title}</div>
              <p className="mt-1.5 text-[0.92rem] leading-7 text-white/50">{step.body}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg">
        <table className="w-full text-[0.9rem]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {block.headers.map((header) => (
                <th
                  key={header}
                  className="px-5 py-3.5 text-left text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/45"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition-colors hover:bg-white/[0.03]">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn("px-5 py-3.5", cellIndex === 0 ? "font-medium text-white/85" : "text-white/50")}
                  >
                    {cell.startsWith("`") ? (
                      <code className="rounded-lg bg-[hsl(184,73%,61%)]/10 px-2 py-0.5 font-mono text-[0.78rem] text-[hsl(184,73%,61%)]">
                        {cell.slice(1, -1)}
                      </code>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
        {block.items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-[0.95rem] leading-7 text-white/60">
            <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(184,73%,61%)]/70" />
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return null;
}
