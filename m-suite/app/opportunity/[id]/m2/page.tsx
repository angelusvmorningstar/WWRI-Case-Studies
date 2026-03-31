import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries";
import { StagePage } from "@/components/guidance/StagePage";
import { markdownToHtml } from "@/lib/markdown";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import fs from "fs";
import path from "path";

export default async function M2Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = await getOpportunity(id);
  if (!opp) notFound();

  const md = fs.readFileSync(path.join(process.cwd(), "content/m2-guidance.md"), "utf-8");

  return (
    <div>
      {/* Costing Sheet Link */}
      {opp.currentStage === "M2" && opp.status === "ACTIVE" && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <Card className="border-l-4 border-l-ww-amber bg-ww-amber/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-semibold text-ww-text">Costing Sheet</h3>
                <p className="text-[13px] text-ww-text-secondary mt-1">
                  Build and calibrate the engagement cost estimate.
                </p>
              </div>
              <Link href={`/opportunity/${opp.id}/costing`}>
                <Button>Open Costing Sheet</Button>
              </Link>
            </div>
          </Card>
        </div>
      )}

      <StagePage
        opportunity={opp}
        stageKey="M2"
        stageLabel="M2 — Options Development"
        guidanceHtml={markdownToHtml(md)}
        showSelfCheck
        selfCheckQuestion="Is this solution ready for M3 presentation to the Full Exec Team? Have you mapped roles, decision-making authority, and influencers?"
      />
    </div>
  );
}
