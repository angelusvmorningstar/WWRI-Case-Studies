import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EngagementTabBar } from "@/components/layout/EngagementTabBar";

export default async function EngagementLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const engagement = await prisma.engagement.findUnique({
    where: { accessKey },
    select: { clientName: true },
  });

  if (!engagement) notFound();

  return (
    <div>
      <EngagementTabBar
        accessKey={accessKey}
        clientName={engagement.clientName}
      />
      {children}
    </div>
  );
}
