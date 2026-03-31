import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import fs from "fs";
import path from "path";

export default async function M1Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m1-guidance.md"), "utf-8");

  return (
    <StagePage
      opportunity={opp}
      stageKey="M1"
      stageLabel="M1 — 1st Formal Meeting: Exploring Dreams & Challenges"
      guidanceHtml={markdownToHtml(md)}
      showSelfCheck
      selfCheckQuestion="Is this person transformational and interested? Did they engage genuinely with the challenges? Are they accountable for driving transformation?"
    />
  );
}
