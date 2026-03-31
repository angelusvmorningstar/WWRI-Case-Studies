import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import fs from "fs";
import path from "path";

export default async function M0Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m0-guidance.md"), "utf-8");

  return (
    <StagePage
      opportunity={opp}
      stageKey="M0"
      stageLabel="M0 — Identifying Potential Leaders & Organisation Clients"
      guidanceHtml={markdownToHtml(md)}
      showSelfCheck
      selfCheckQuestion="Is this prospect transformational and interested? Are they facing genuine transformation challenges with the appetite and authority for change?"
    />
  );
}
