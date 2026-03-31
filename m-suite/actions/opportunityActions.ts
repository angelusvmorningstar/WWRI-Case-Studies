"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/mock-auth";
import {
  createOpportunity as createOpp,
  progressStage as progressOppStage,
} from "@/lib/mock-data";

export async function createOpportunityAction(formData: FormData): Promise<void> {
  const user = getCurrentUser();
  const clientName = formData.get("clientName") as string;
  const prospect = formData.get("prospect") as string;
  const description = formData.get("description") as string;

  if (!clientName?.trim()) {
    redirect("/opportunity/new");
  }

  const opp = createOpp({
    clientName: clientName.trim(),
    prospect: prospect?.trim() || "",
    description: description?.trim() || "",
    ieId: user.id,
  });

  redirect(`/opportunity/${opp.id}/m0`);
}

export async function pursueStageAction(formData: FormData): Promise<void> {
  const user = getCurrentUser();
  const opportunityId = formData.get("opportunityId") as string;
  const notes = formData.get("notes") as string;

  const opp = progressOppStage(opportunityId, "pursue", notes || null, user.id);

  if (!opp) {
    redirect("/");
  }

  const stageSlug = opp.currentStage.toLowerCase();
  redirect(`/opportunity/${opp.id}/${stageSlug}`);
}

export async function stopOpportunityAction(formData: FormData): Promise<void> {
  const user = getCurrentUser();
  const opportunityId = formData.get("opportunityId") as string;
  const notes = formData.get("notes") as string;

  progressOppStage(opportunityId, "stop", notes || null, user.id);

  redirect("/");
}
