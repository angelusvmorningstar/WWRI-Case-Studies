import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { pursueStageAction, stopOpportunityAction } from "@/actions/opportunityActions";
import type { Opportunity } from "@/lib/queries";

interface StagePageProps {
  opportunity: Opportunity;
  stageKey: string;
  stageLabel: string;
  guidanceHtml: string;
  showSelfCheck?: boolean;
  selfCheckQuestion?: string;
}

export function StagePage({
  opportunity,
  stageKey,
  stageLabel,
  guidanceHtml,
  showSelfCheck = false,
  selfCheckQuestion,
}: StagePageProps) {
  const isCurrent = opportunity.currentStage === stageKey;
  const isCompleted = ["M0", "M1", "M2", "M3", "M4"].indexOf(opportunity.currentStage) >
    ["M0", "M1", "M2", "M3", "M4"].indexOf(stageKey);
  const isStopped = opportunity.status === "STOPPED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold text-ww-text">{stageLabel}</h1>
        {isCompleted && <Badge variant="green">Completed</Badge>}
        {isCurrent && !isStopped && <Badge variant="teal">Current Stage</Badge>}
        {isStopped && <Badge variant="red">Stopped</Badge>}
      </div>

      <Card className="mb-6">
        <div
          className="prose prose-sm max-w-none
            [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-ww-text [&_h1]:mb-4
            [&_h2]:text-md [&_h2]:font-semibold [&_h2]:text-ww-text [&_h2]:mt-6 [&_h2]:mb-3
            [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-ww-text [&_h3]:mt-4 [&_h3]:mb-2
            [&_p]:text-[13px] [&_p]:text-ww-text-secondary [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:text-[13px] [&_ul]:text-ww-text-secondary [&_ul]:mb-3 [&_ul]:pl-5
            [&_li]:mb-1
            [&_strong]:text-ww-text [&_strong]:font-semibold"
          dangerouslySetInnerHTML={{ __html: guidanceHtml }}
        />
      </Card>

      {showSelfCheck && isCurrent && !isStopped && (
        <Card className="border-l-4 border-l-ww-teal">
          <h2 className="text-md font-semibold text-ww-text mb-3">Self-Check</h2>
          <p className="text-[13px] text-ww-text-secondary mb-4">
            {selfCheckQuestion}
          </p>
          <div className="flex flex-col gap-3">
            <textarea
              form="pursue-form"
              name="notes"
              placeholder="Optional notes about your decision..."
              rows={2}
              className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] font-sans text-ww-text bg-ww-surface outline-none transition-colors focus:border-ww-teal focus:shadow-[0_0_0_2px_var(--color-ww-teal-ring)] placeholder:text-ww-text-muted resize-y"
            />
            <div className="flex gap-3">
              <form id="pursue-form" action={pursueStageAction}>
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <Button type="submit">
                  Pursue — Move to Next Stage
                </Button>
              </form>
              <form action={stopOpportunityAction}>
                <input type="hidden" name="opportunityId" value={opportunity.id} />
                <Button type="submit" variant="danger">
                  Do Not Pursue
                </Button>
              </form>
            </div>
          </div>
        </Card>
      )}

      {isCompleted && (
        <Card className="border-l-4 border-l-ww-green bg-ww-green/5">
          <p className="text-[13px] text-ww-text-secondary">
            You have progressed past this stage.
          </p>
        </Card>
      )}
    </div>
  );
}
