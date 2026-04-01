import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function InterviewListPage({
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
          assignments: { include: { interviewer: true } },
        },
      },
    },
  });

  if (!engagement) notFound();

  const statusColour: Record<string, string> = {
    complete: "bg-ww-green/15 text-ww-green",
    "in-progress": "bg-ww-amber/15 text-ww-amber",
    pending: "bg-ww-text-muted/10 text-ww-text-muted",
  };

  const statusLabel = (s: string) => s === "in-progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>
      <h2 className="text-[20px] font-bold mb-1">Select Interviewee</h2>
      <p className="text-ww-text-secondary text-[13px] m-0 mb-6">
        Choose a person to interview. You can resume in-progress interviews or review completed ones.
      </p>

      {engagement.interviewees.length === 0 ? (
        <div className="ww-card text-center py-12 text-ww-text-muted">
          <div className="text-[40px] mb-2.5 opacity-30">👥</div>
          <p className="m-0 text-[16px]">No interviewees added yet.</p>
          <p className="m-0 mt-1.5 text-[14px]">
            Go to the{" "}
            <Link href={`/engagement/${accessKey}`} className="text-ww-teal no-underline hover:underline">
              Setup tab
            </Link>{" "}
            to add interviewees.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {engagement.interviewees.map((person) => {
            const status = person.sessions[0]?.status ?? "pending";
            const interviewerNames = person.assignments.map((a) => a.interviewer.name);
            return (
              <Link
                key={person.id}
                href={`/engagement/${accessKey}/interview/${person.id}`}
                className="no-underline"
              >
                <div className="ww-card !p-0 hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer overflow-hidden">
                  <div className="grid items-center px-5 py-3.5" style={{ gridTemplateColumns: "1.4fr 1fr 170px 120px" }}>
                    <div>
                      <div className="font-bold text-[15px] text-ww-text">{person.name}</div>
                      <div className="text-[12px] text-ww-text-muted mt-0.5">
                        {interviewerNames.length > 0 ? `Interviewer: ${interviewerNames.join(", ")}` : "No interviewer assigned"}
                      </div>
                    </div>
                    <span className="text-ww-text-secondary text-[14px]">{person.title}</span>
                    <span className="text-ww-text-muted text-[13px]">{person.category}</span>
                    <span className={`inline-flex items-center gap-[5px] px-3 py-[3px] rounded-full text-[12px] font-semibold w-fit ${statusColour[status] || statusColour.pending}`}>
                      <span className="w-[6px] h-[6px] rounded-full bg-current" />
                      {statusLabel(status)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
