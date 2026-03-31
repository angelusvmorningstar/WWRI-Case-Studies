import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/mock-data";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import fs from "fs";
import path from "path";

export default async function M4Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m4-guidance.md"), "utf-8");

  return (
    <StagePage
      opportunity={opp}
      stageKey="M4"
      stageLabel="M4 & M5 — Negotiation & Sign-off of Contract"
      guidanceHtml={markdownToHtml(md)}
    />
  );
}
