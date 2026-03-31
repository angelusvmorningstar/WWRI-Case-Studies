import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentUser } from "@/lib/mock-auth";
import { getOpportunities } from "@/lib/mock-data";

const STAGES = [
  {
    key: "M0",
    label: "M0",
    title: "Identifying Prospects",
    description: "Research and identify potential transformational leaders. Casual engagement to assess fit.",
    tools: [],
    guideSlug: "m0",
  },
  {
    key: "M1",
    label: "M1",
    title: "1st Formal Meeting",
    description: "Explore dreams and challenges. Listen — do not add solutions. Play back 2-3 key challenges.",
    tools: [],
    guideSlug: "m1",
  },
  {
    key: "M2",
    label: "M2",
    title: "Options Development",
    description: "Internal option development with 5 Whys, then co-create solutions with the client.",
    tools: [{ label: "Costing Sheet", href: "#costing" }],
    guideSlug: "m2",
  },
  {
    key: "M3",
    label: "M3",
    title: "The Pitch",
    description: "Prepare and co-present to the full exec team. Sponsor presents, WW supports.",
    tools: [],
    guideSlug: "m3",
  },
  {
    key: "M4",
    label: "M4/M5",
    title: "Contract & Sign-off",
    description: "Finalise contract, QC review, negotiate terms, and secure sign-off and PO.",
    tools: [],
    guideSlug: "m4",
  },
];

const stageColor: Record<string, string> = {
  M0: "border-t-ww-text-muted",
  M1: "border-t-ww-teal",
  M2: "border-t-ww-teal",
  M3: "border-t-ww-amber",
  M4: "border-t-ww-green",
};

export default function Home() {
  const user = getCurrentUser();
  const allOpportunities =
    user.role === "ADMIN" ? getOpportunities() : getOpportunities(user.id);

  const active = allOpportunities.filter((o) => o.status === "ACTIVE");
  const stopped = allOpportunities.filter((o) => o.status === "STOPPED");

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="max-w-[1400px] mx-auto flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-ww-text">M+ Pipeline</h1>
          <p className="text-sm text-ww-text-muted">
            {active.length} active{stopped.length > 0 && ` · ${stopped.length} stopped`}
          </p>
        </div>
        <Link href="/opportunity/new">
          <Button>New Opportunity</Button>
        </Link>
      </div>

      {/* Kanban Ribbon */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-5 gap-3">
        {STAGES.map((stage) => {
          const stageOpps = active.filter((o) => o.currentStage === stage.key);
          return (
            <div key={stage.key} className="flex flex-col">
              {/* Stage Header */}
              <div className={`bg-ww-surface border border-ww-border border-t-[3px] ${stageColor[stage.key]} rounded-t-lg px-3 py-3`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-ww-text">{stage.label}</span>
                  {stageOpps.length > 0 && (
                    <span className="text-[11px] text-ww-text-muted bg-ww-text-muted/10 rounded-full px-2 py-0.5">
                      {stageOpps.length}
                    </span>
                  )}
                </div>
                <h3 className="text-[13px] font-semibold text-ww-text mb-1">{stage.title}</h3>
                <p className="text-[11px] text-ww-text-muted leading-relaxed mb-2">
                  {stage.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {stage.tools.map((tool) => (
                    <span
                      key={tool.label}
                      className="inline-flex items-center px-2 py-0.5 rounded bg-ww-teal/10 text-ww-teal text-[10px] font-semibold"
                    >
                      {tool.label}
                    </span>
                  ))}
                  <Link
                    href={`/guide/${stage.guideSlug}`}
                    className="text-[10px] text-ww-teal no-underline hover:underline font-medium"
                  >
                    Full guide &rarr;
                  </Link>
                </div>
              </div>

              {/* Opportunity Cards */}
              <div className="flex flex-col gap-2 bg-ww-bg border-x border-b border-ww-border rounded-b-lg p-2 min-h-[100px] flex-1">
                {stageOpps.map((opp) => (
                  <Link
                    key={opp.id}
                    href={`/opportunity/${opp.id}/${opp.currentStage.toLowerCase()}`}
                    className="no-underline"
                  >
                    <div className="bg-ww-surface border border-ww-border rounded-md p-3 hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer">
                      <h4 className="text-[13px] font-semibold text-ww-text leading-tight">
                        {opp.clientName}
                      </h4>
                      {opp.prospect && (
                        <p className="text-[11px] text-ww-text-muted mt-1 truncate">
                          {opp.prospect}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stopped Opportunities */}
      {stopped.length > 0 && (
        <div className="max-w-[1400px] mx-auto mt-6">
          <h2 className="text-sm font-semibold text-ww-text-muted mb-3">Stopped</h2>
          <div className="flex flex-wrap gap-2">
            {stopped.map((opp) => (
              <Link
                key={opp.id}
                href={`/opportunity/${opp.id}/${opp.currentStage.toLowerCase()}`}
                className="no-underline"
              >
                <div className="bg-ww-surface border border-ww-border rounded-md px-3 py-2 opacity-60 hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-2">
                  <span className="text-[13px] text-ww-text">{opp.clientName}</span>
                  <Badge variant="red">Stopped at {opp.currentStage}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allOpportunities.length === 0 && (
        <div className="max-w-[1400px] mx-auto mt-8 text-center">
          <p className="text-ww-text-secondary mb-2">No opportunities yet.</p>
          <p className="text-sm text-ww-text-muted mb-6">
            Create your first opportunity to start the M+ Process.
          </p>
          <Link href="/opportunity/new">
            <Button>New Opportunity</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
