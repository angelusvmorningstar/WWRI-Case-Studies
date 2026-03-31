import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/mock-data";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import fs from "fs";
import path from "path";

export default async function M2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m2-guidance.md"), "utf-8");

  return (
    <StagePage
      opportunity={opp}
      stageKey="M2"
      stageLabel="M2 — Options Development"
      guidanceHtml={markdownToHtml(md)}
      showSelfCheck
      selfCheckQuestion="Is this solution ready for M3 presentation to the Full Exec Team? Have you mapped roles, decision-making authority, and influencers?"
    />
  );
}
