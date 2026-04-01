import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";

export default async function Home() {
  const engagements = await prisma.engagement.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "desc" },
    include: {
      interviewees: { select: { id: true, status: true } },
    },
  });

  const archived = await prisma.engagement.findMany({
    where: { status: "archived" },
    orderBy: { updatedAt: "desc" },
    include: {
      interviewees: { select: { id: true, status: true } },
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Image src="/ww-logo.jpg" alt="Whitewater Reinventions" width={140} height={45} className="mx-auto mb-4" />
          <h1 className="text-lg font-bold text-ww-text">Structured Interview</h1>
          <p className="text-[13px] text-ww-text-muted mt-1">Select an engagement or start a new one</p>
        </div>

        {/* New engagement */}
        <Link href="/engagement/new" className="no-underline block mb-6">
          <div className="bg-ww-teal text-white rounded-lg py-3.5 px-5 text-center text-[15px] font-semibold cursor-pointer hover:bg-ww-teal-hover transition-colors">
            + New Engagement
          </div>
        </Link>

        {/* Active engagements */}
        {engagements.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] text-ww-text-muted font-bold uppercase tracking-[0.07em] mb-2">Active engagements</div>
            <div className="flex flex-col gap-2">
              {engagements.map((eng) => {
                const total = eng.interviewees.length;
                const complete = eng.interviewees.filter((i) => i.status === "complete").length;
                const inProg = eng.interviewees.filter((i) => i.status === "in_progress" || i.status === "in-progress").length;
                return (
                  <Link key={eng.id} href={`/engagement/${eng.accessKey}`} className="no-underline">
                    <div className="bg-ww-surface border border-ww-border rounded-lg px-4 py-3 hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer">
                      <div className="font-bold text-[15px] text-ww-text">{eng.clientName}</div>
                      <div className="text-[12px] text-ww-text-muted mt-1">
                        {total === 0
                          ? "No interviewees yet"
                          : `${complete} complete${inProg > 0 ? ` · ${inProg} in progress` : ""} · ${total} total`}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Archived */}
        {archived.length > 0 && (
          <div>
            <div className="text-[11px] text-ww-text-muted font-bold uppercase tracking-[0.07em] mb-2">Archived</div>
            <div className="flex flex-col gap-1.5">
              {archived.map((eng) => (
                <Link key={eng.id} href={`/engagement/${eng.accessKey}`} className="no-underline">
                  <div className="bg-ww-surface border border-ww-border rounded-lg px-4 py-2.5 opacity-60 hover:opacity-80 transition-opacity cursor-pointer">
                    <span className="text-[13px] text-ww-text">{eng.clientName}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
