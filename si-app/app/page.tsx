import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  });

  return (
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-ww-text">Engagements</h1>
            <p className="text-sm text-ww-text-muted">
              {engagements.length} active{archived.length > 0 && ` · ${archived.length} archived`}
            </p>
          </div>
          <Link href="/engagement/new">
            <Button>New Engagement</Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {engagements.map((eng) => {
            const total = eng.interviewees.length;
            const complete = eng.interviewees.filter((i) => i.status === "complete").length;
            return (
              <Link
                key={eng.id}
                href={`/engagement/${eng.accessKey}`}
                className="no-underline"
              >
                <div className="bg-ww-surface border border-ww-border rounded-lg p-4 hover:border-ww-teal/40 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-md font-semibold text-ww-text">{eng.clientName}</h2>
                      <p className="text-sm text-ww-text-muted mt-1">
                        {total > 0
                          ? `${complete}/${total} interviews complete`
                          : "No interviewees yet"}
                      </p>
                    </div>
                    <Badge variant="teal">Active</Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {engagements.length === 0 && (
          <div className="text-center mt-8">
            <p className="text-ww-text-secondary mb-2">No engagements yet.</p>
            <p className="text-sm text-ww-text-muted mb-6">
              Create your first engagement to start conducting structured interviews.
            </p>
            <Link href="/engagement/new">
              <Button>New Engagement</Button>
            </Link>
          </div>
        )}

        {archived.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-ww-text-muted mb-3">Archived</h2>
            <div className="flex flex-col gap-2">
              {archived.map((eng) => (
                <Link
                  key={eng.id}
                  href={`/engagement/${eng.accessKey}`}
                  className="no-underline"
                >
                  <div className="bg-ww-surface border border-ww-border rounded-lg p-3 opacity-60 hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-between">
                    <span className="text-[13px] text-ww-text">{eng.clientName}</span>
                    <Badge variant="muted">Archived</Badge>
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
