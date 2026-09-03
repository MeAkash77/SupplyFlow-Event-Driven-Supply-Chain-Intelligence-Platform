import { DocsPage } from "@/components/docs/docs-page";

export default function DocSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  return <DocsPage slug={params.slug} />;
}
