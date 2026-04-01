import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create a sample engagement for demo purposes
  const engagement = await prisma.engagement.upsert({
    where: { accessKey: "demo-engagement" },
    update: {},
    create: {
      accessKey: "demo-engagement",
      clientName: "Demo Engagement",
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

  console.log(`Seed data created: demo engagement (${engagement.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
