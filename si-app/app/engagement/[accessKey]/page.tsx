import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function EngagementDashboard({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const engagement = await prisma.engagement.findUnique({
    where: { accessKey },
    include: {
      interviewees: {
        orderBy: { createdAt: "asc" },
        include: {
          sessions: { select: { status: true } },
        },
      },
      interviewers: true,
    },
  });

  if (!engagement) notFound();

  const total = engagement.interviewees.length;
  const complete = engagement.interviewees.filter(
    (i) => i.sessions.some((s) => s.status === "complete")
  ).length;
  const inProgress = engagement.interviewees.filter(
    (i) => i.sessions.some((s) => s.status === "in-progress")
  ).length;

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="text-sm text-ww-teal no-underline hover:underline">
            &larr; Engagements
          </Link>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-ww-text">{engagement.clientName}</h1>
            <p className="text-sm text-ww-text-muted">
              {total > 0
                ? `${complete} complete · ${inProgress} in progress · ${total - complete - inProgress} pending`
                : "No interviewees yet — go to Setup to add them"}
            </p>
          </div>
          <Badge variant="teal">{engagement.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href={`/engagement/${accessKey}/setup`} className="no-underline">
            <Card className="hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer">
              <h3 className="text-md font-semibold text-ww-text mb-1">Setup</h3>
              <p className="text-sm text-ww-text-muted">
                Topics, interviewees, interviewers, guidance
              </p>
            </Card>
          </Link>
          <Link href={`/engagement/${accessKey}/results`} className="no-underline">
            <Card className="hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer">
              <h3 className="text-md font-semibold text-ww-text mb-1">Results</h3>
              <p className="text-sm text-ww-text-muted">
                Heatmap, radar charts, benchmarks
              </p>
            </Card>
          </Link>
        </div>

        {/* Interview list */}
        <h2 className="text-md font-semibold text-ww-text mb-3">Interviews</h2>
        {engagement.interviewees.length === 0 ? (
          <Card>
            <p className="text-sm text-ww-text-muted text-center py-4">
              No interviewees added yet.{" "}
              <Link href={`/engagement/${accessKey}/setup`} className="text-ww-teal no-underline hover:underline">
                Go to Setup
              </Link>{" "}
              to add them.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {engagement.interviewees.map((person) => {
              const sessionStatus = person.sessions[0]?.status ?? "pending";
              const statusVariant = sessionStatus === "complete" ? "green" : sessionStatus === "in-progress" ? "teal" : "muted" as const;
              return (
                <Link
                  key={person.id}
                  href={`/engagement/${accessKey}/interview/${person.id}`}
                  className="no-underline"
                >
                  <div className="bg-ww-surface border border-ww-border rounded-lg p-3 hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between">
                    <div>
                      <span className="text-[13px] font-semibold text-ww-text">{person.name}</span>
                      {person.title && (
                        <span className="text-[12px] text-ww-text-muted ml-2">{person.title}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-ww-text-muted">{person.category}</span>
                      <Badge variant={statusVariant}>{sessionStatus}</Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
