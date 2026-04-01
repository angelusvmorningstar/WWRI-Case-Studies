import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TOPIC_LIBRARY } from "@/lib/topic-library";
import { InterviewClient } from "@/components/interview/InterviewClient";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ accessKey: string; intervieweeId: string }>;
}) {
  const { accessKey, intervieweeId } = await params;

  const engagement = await prisma.engagement.findUnique({
    where: { accessKey },
    include: {
      topicConfigs: true,
      questionOverrides: true,
      guidanceOverride: true,
      interviewees: {
        orderBy: { createdAt: "asc" },
        include: {
          sessions: { select: { id: true, status: true } },
          assignments: { include: { interviewer: true } },
        },
      },
    },
  });

  if (!engagement) notFound();

  const interviewee = engagement.interviewees.find((i) => i.id === intervieweeId);
  if (!interviewee) notFound();

  // Build questions from topic config
  const topicConfigMap: Record<string, { enabled: boolean; selectedSubtopics: string[] }> = {};
  for (const tc of engagement.topicConfigs) {
    topicConfigMap[tc.topicId] = { enabled: tc.enabled, selectedSubtopics: tc.selectedSubtopics as string[] };
  }
  // Default config
  for (const topic of TOPIC_LIBRARY) {
    if (!topicConfigMap[topic.id]) {
      topicConfigMap[topic.id] = { enabled: true, selectedSubtopics: [topic.subtopics[0].id] };
    }
  }

  // Build question overrides
  const questionOverrideMap: Record<string, { customQuestion: string | null; customMins: number | null }> = {};
  for (const qo of engagement.questionOverrides) {
    questionOverrideMap[qo.subtopicId] = { customQuestion: qo.customQuestion, customMins: qo.customMins };
  }

  // Build flat question list
  const questions: {
    id: string;
    topicId: string;
    topicName: string;
    subtopicId: string;
    subtopicName: string;
    question: string;
    purpose: string;
    mins: number;
    criteria: { id: string; name: string; hi: string; lo: string }[];
  }[] = [];

  for (const topic of TOPIC_LIBRARY) {
    const config = topicConfigMap[topic.id];
    if (!config?.enabled) continue;
    for (const sub of topic.subtopics) {
      if (!config.selectedSubtopics.includes(sub.id)) continue;
      const override = questionOverrideMap[sub.id];
      questions.push({
        id: `${topic.id}_${sub.id}`,
        topicId: topic.id,
        topicName: topic.name,
        subtopicId: sub.id,
        subtopicName: sub.name,
        question: override?.customQuestion || sub.examples[0],
        purpose: sub.purpose,
        mins: override?.customMins ?? sub.defaultMins,
        criteria: sub.crit.map((c) => ({ id: c.id, name: c.name, hi: c.hi, lo: c.lo })),
      });
    }
  }

  // Load existing session data
  const existingSession = interviewee.sessions[0];
  let sessionData = null;
  if (existingSession) {
    const session = await prisma.session.findUnique({
      where: { id: existingSession.id },
      include: { scores: true, notes: true, background: true },
    });
    if (session) {
      sessionData = {
        id: session.id,
        status: session.status,
        scores: Object.fromEntries(session.scores.map((s) => [s.criteriaId, s.value])),
        notes: Object.fromEntries(session.notes.map((n) => [n.questionId, n.text])),
        background: (session.background?.data as Record<string, string>) || {},
      };
    }
  }

  // Guidance
  const guidance = engagement.guidanceOverride;
  const guidanceData = guidance
    ? {
        boilerplateOverrides: guidance.boilerplateOverrides as Record<string, string>,
        bespokeSection: guidance.bespokeSection,
      }
    : null;

  // Sidebar data
  const sidebarData = engagement.interviewees.map((i) => ({
    id: i.id,
    name: i.name,
    title: i.title || "",
    category: i.category,
    status: i.sessions[0]?.status ?? "pending",
    isCurrent: i.id === intervieweeId,
  }));

  return (
    <InterviewClient
      accessKey={accessKey}
      engagementId={engagement.id}
      interviewee={{ id: interviewee.id, name: interviewee.name, title: interviewee.title || "", category: interviewee.category, interviewerNames: interviewee.assignments.map((a) => a.interviewer.name) }}
      questions={questions}
      existingSession={sessionData}
      guidanceData={guidanceData}
      activeTopicNames={[...new Set(questions.map((q) => q.topicName))]}
      sidebarData={engagement.interviewees.map((i) => ({
        id: i.id,
        name: i.name,
        title: i.title || "",
        category: i.category,
        status: i.sessions[0]?.status ?? "pending",
        isCurrent: i.id === intervieweeId,
      }))}
    />
  );
}
