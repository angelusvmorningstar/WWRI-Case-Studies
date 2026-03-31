import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries";
import { MStageProgressBar } from "@/components/layout/MStageProgressBar";
import Link from "next/link";

export default async function OpportunityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const opp = await getOpportunity(id);

  if (!opp) notFound();

  return (
    <div>
      <div className="border-b border-ww-border bg-ww-surface px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-ww-teal no-underline hover:underline">
              Home
            </Link>
            <span className="text-ww-text-muted">/</span>
            <span className="text-sm font-semibold text-ww-text">{opp.clientName}</span>
          </div>
          <MStageProgressBar
            opportunityId={opp.id}
            currentStage={opp.currentStage}
            status={opp.status}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
