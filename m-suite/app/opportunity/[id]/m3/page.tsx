import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import fs from "fs";
import path from "path";

export default async function M3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m3-guidance.md"), "utf-8");

  return (
    <StagePage
      opportunity={opp}
      stageKey="M3"
      stageLabel="M3 — The Pitch"
      guidanceHtml={markdownToHtml(md)}
    />
  );
}
