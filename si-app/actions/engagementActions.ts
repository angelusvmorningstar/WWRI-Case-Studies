"use server";

import { prisma } from "@/lib/db";

export async function createEngagementAction(clientName: string): Promise<string> {
  const engagement = await prisma.engagement.create({
    data: {
      clientName,
      status: "active",
      benchmarks: {
        create: [
          { category: "Executive", adequate: 40, best: 85 },
          { category: "Senior Management", adequate: 20, best: 60 },
          { category: "Middle Management", adequate: 10, best: 40 },
        ],
      },
    },
  });

  return engagement.accessKey;
}
