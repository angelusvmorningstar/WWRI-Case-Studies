"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function saveBenchmarks(
  engagementId: string,
  accessKey: string,
  benchmarks: { category: string; adequate: number; best: number }[]
) {
  for (const b of benchmarks) {
    await prisma.benchmark.upsert({
      where: {
        engagementId_category: {
          engagementId,
          category: b.category,
        },
      },
      update: {
        adequate: b.adequate,
        best: b.best,
      },
      create: {
        engagementId,
        category: b.category,
        adequate: b.adequate,
        best: b.best,
      },
    });
  }

  revalidatePath(`/engagement/${accessKey}/results`);
}
