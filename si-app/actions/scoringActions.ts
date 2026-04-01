"use server";

import { prisma } from "@/lib/db";

export async function startSessionAction(intervieweeId: string): Promise<string> {
  // Check for existing session
  const existing = await prisma.session.findFirst({
    where: { intervieweeId },
  });
  if (existing) return existing.id;

  const session = await prisma.session.create({
    data: {
      intervieweeId,
      status: "in-progress",
      startedAt: new Date(),
    },
  });

  // Update interviewee status
  await prisma.interviewee.update({
    where: { id: intervieweeId },
    data: { status: "in-progress" },
  });

  return session.id;
}

export async function saveScoresAction(
  sessionId: string,
  scores: { criteriaId: string; value: number }[]
) {
  for (const score of scores) {
    await prisma.score.upsert({
      where: {
        sessionId_criteriaId: { sessionId, criteriaId: score.criteriaId },
      },
      update: { value: score.value },
      create: { sessionId, criteriaId: score.criteriaId, value: score.value },
    });
  }
}

export async function saveNoteAction(
  sessionId: string,
  questionId: string,
  text: string
) {
  await prisma.note.upsert({
    where: {
      sessionId_questionId: { sessionId, questionId },
    },
    update: { text },
    create: { sessionId, questionId, text },
  });
}

export async function saveBackgroundAction(
  sessionId: string,
  data: Record<string, string>
) {
  await prisma.background.upsert({
    where: { sessionId },
    update: { data },
    create: { sessionId, data },
  });
}

export async function completeSessionAction(sessionId: string) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status: "complete", completedAt: new Date() },
  });

  await prisma.interviewee.update({
    where: { id: session.intervieweeId },
    data: { status: "complete" },
  });
}

export async function reopenSessionAction(sessionId: string) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status: "in-progress", completedAt: null },
  });

  await prisma.interviewee.update({
    where: { id: session.intervieweeId },
    data: { status: "in-progress" },
  });
}

export async function loadSessionData(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      scores: true,
      notes: true,
      background: true,
    },
  });
  return session;
}
