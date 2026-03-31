import Link from "next/link";

const STAGES = [
  { key: "M0", label: "M0", slug: "m0" },
  { key: "M1", label: "M1", slug: "m1" },
  { key: "M2", label: "M2", slug: "m2" },
  { key: "M3", label: "M3", slug: "m3" },
  { key: "M4", label: "M4/M5", slug: "m4" },
];

interface MStageProgressBarProps {
  opportunityId: string;
  currentStage: string;
  status: string;
}

export function MStageProgressBar({
  opportunityId,
  currentStage,
  status,
}: MStageProgressBarProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);
  const isStopped = status === "STOPPED";

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        let bgClass = "bg-ww-text-muted/20 text-ww-text-muted"; // future
        if (isCompleted) bgClass = "bg-ww-green/15 text-ww-green";
        if (isCurrent && !isStopped) bgClass = "bg-ww-teal/15 text-ww-teal";
        if (isCurrent && isStopped) bgClass = "bg-ww-red/15 text-ww-red";

        return (
          <Link
            key={stage.key}
            href={`/opportunity/${opportunityId}/${stage.slug}`}
            className={`px-3 py-1 rounded text-xs font-semibold no-underline transition-colors hover:opacity-80 ${bgClass}`}
          >
            {stage.label}
          </Link>
        );
      })}
    </div>
  );
}
