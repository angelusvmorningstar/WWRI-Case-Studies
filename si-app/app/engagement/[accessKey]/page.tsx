import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TOPIC_LIBRARY } from "@/lib/topic-library";
import { SetupTab } from "@/components/setup/SetupTab";

export default async function EngagementSetupPage({
  params,
}: {
  params: Promise<{ accessKey: string }>;
}) {
  const { accessKey } = await params;
  const engagement = await prisma.engagement.findUnique({
    where: { accessKey },
    include: {
      topicConfigs: true,
      questionOverrides: true,
      guidanceOverride: true,
      interviewees: {
        orderBy: { createdAt: "asc" },
        include: {
          assignments: { include: { interviewer: true } },
          sessions: { select: { status: true } },
        },
      },
      interviewers: true,
    },
  });

  if (!engagement) notFound();

  // Build topic config state
  const topicConfigMap: Record<string, { enabled: boolean; selectedSubtopics: string[] }> = {};
  for (const tc of engagement.topicConfigs) {
    topicConfigMap[tc.topicId] = { enabled: tc.enabled, selectedSubtopics: tc.selectedSubtopics as string[] };
  }
  for (const topic of TOPIC_LIBRARY) {
    if (!topicConfigMap[topic.id]) {
      topicConfigMap[topic.id] = { enabled: true, selectedSubtopics: [topic.subtopics[0].id] };
    }
  }

  // Question overrides
  const questionOverrideMap: Record<string, { customQuestion: string | null; customMins: number | null }> = {};
  for (const qo of engagement.questionOverrides) {
    questionOverrideMap[qo.subtopicId] = { customQuestion: qo.customQuestion, customMins: qo.customMins };
  }

  return (
    <SetupTab
      engagementId={engagement.id}
      accessKey={accessKey}
      clientName={engagement.clientName}
      topicConfigMap={topicConfigMap}
      questionOverrideMap={questionOverrideMap}
      guidanceOverride={engagement.guidanceOverride ? {
        boilerplateOverrides: engagement.guidanceOverride.boilerplateOverrides as Record<string, string>,
        bespokeSection: engagement.guidanceOverride.bespokeSection,
      } : null}
      interviewees={engagement.interviewees.map((i) => ({
        id: i.id,
        name: i.name,
        title: i.title || "",
        category: i.category,
        status: i.sessions[0]?.status ?? "pending",
        interviewerNames: i.assignments.map((a) => a.interviewer.name),
        interviewerIds: i.assignments.map((a) => a.interviewerId),
      }))}
      interviewers={engagement.interviewers.map((iv) => ({
        id: iv.id,
        name: iv.name,
        adjustment: iv.adjustment,
        assignedCount: engagement.interviewees.filter((i) =>
          i.assignments.some((a) => a.interviewerId === iv.id)
        ).length,
      }))}
    />
  );
}
