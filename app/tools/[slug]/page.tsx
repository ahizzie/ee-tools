import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AssumptionsPanel } from "@/components/tools/assumptions-panel";
import { ToolSessionProvider } from "@/components/tools/tool-session";
import { ToolToolbar } from "@/components/tools/tool-toolbar";
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
    <ToolSessionProvider slug={tool.slug} name={tool.name}>
      <article className="grid gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="grid min-w-0 gap-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {tool.category} · IEC / metric
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {tool.description}
            </p>
          </div>
          <ToolToolbar />
        </div>
        <Suspense
          fallback={<p className="text-sm text-muted-foreground">Loading calculator…</p>}
        >
          <ToolView slug={tool.slug} />
        </Suspense>
        <AssumptionsPanel slug={tool.slug} />
      </article>
    </ToolSessionProvider>
  );
}
