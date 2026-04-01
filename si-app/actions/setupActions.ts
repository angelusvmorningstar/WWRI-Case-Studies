"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// --- Topic Config ---

export async function updateTopicConfigAction(
  engagementId: string,
  topicId: string,
  enabled: boolean,
  selectedSubtopics: string[]
) {
  await prisma.topicConfig.upsert({
    where: {
      id: `${engagementId}_${topicId}`,
    },
    update: { enabled, selectedSubtopics },
    create: {
      id: `${engagementId}_${topicId}`,
      engagementId,
      topicId,
      enabled,
      selectedSubtopics,
    },
  });
}

export async function saveQuestionOverrideAction(
  engagementId: string,
  subtopicId: string,
  customQuestion: string | null,
  customMins: number | null
) {
  await prisma.questionOverride.upsert({
    where: {
      id: `${engagementId}_${subtopicId}`,
    },
    update: { customQuestion, customMins },
    create: {
      id: `${engagementId}_${subtopicId}`,
      engagementId,
      subtopicId,
      customQuestion,
      customMins,
    },
  });
}

// --- Interviewees ---

export async function addIntervieweeAction(
  engagementId: string,
  name: string,
  title: string,
  category: string
) {
  await prisma.interviewee.create({
    data: { engagementId, name, title, category },
  });
  revalidatePath(`/engagement`);
}

export async function updateIntervieweeAction(
  id: string,
  name: string,
  title: string,
  category: string
) {
  await prisma.interviewee.update({
    where: { id },
    data: { name, title, category },
  });
  revalidatePath(`/engagement`);
}

export async function deleteIntervieweeAction(id: string) {
  await prisma.interviewee.delete({ where: { id } });
  revalidatePath(`/engagement`);
}

// --- Interviewers ---

export async function addInterviewerAction(engagementId: string, name: string) {
  await prisma.interviewer.create({
    data: { engagementId, name },
  });
  revalidatePath(`/engagement`);
}

export async function updateInterviewerAdjustmentAction(id: string, adjustment: number) {
  await prisma.interviewer.update({
    where: { id },
    data: { adjustment },
  });
}

export async function deleteInterviewerAction(id: string) {
  await prisma.interviewer.delete({ where: { id } });
  revalidatePath(`/engagement`);
}

// --- Interviewer Assignments ---

export async function assignInterviewersAction(
  intervieweeId: string,
  interviewerIds: string[]
) {
  // Delete existing assignments
  await prisma.interviewerAssignment.deleteMany({
    where: { intervieweeId },
  });
  // Create new assignments
  if (interviewerIds.length > 0) {
    await prisma.interviewerAssignment.createMany({
      data: interviewerIds.map((interviewerId) => ({
        intervieweeId,
        interviewerId,
      })),
    });
  }
  revalidatePath(`/engagement`);
}

// --- Guidance ---

export async function saveGuidanceAction(
  engagementId: string,
  boilerplateOverrides: Record<string, string>,
  bespokeSection: string
) {
  await prisma.guidanceOverride.upsert({
    where: { engagementId },
    update: { boilerplateOverrides, bespokeSection },
    create: { engagementId, boilerplateOverrides, bespokeSection },
  });
}
