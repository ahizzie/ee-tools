import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/layout/print-button";
import { AssumptionsPanel } from "@/components/tools/assumptions-panel";
import { ToolView } from "@/components/tools/tool-view";
import { getTool, tools } from "@/config/tools";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | EE Tools`,
      description: tool.description,
    },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  return (
    <article className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {tool.category} · IEC / metric
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {tool.description}
          </p>
        </div>
        <PrintButton />
      </div>
      <ToolView slug={tool.slug} />
      <AssumptionsPanel slug={tool.slug} />
    </article>
  );
}
