import "dotenv/config";
import { PrismaClient, Role } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL!;
console.log("Connecting to:", connectionString.substring(0, 40) + "...");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  await prisma.user.upsert({
    where: { email: "angelus@whitewater.com" },
    update: {},
    create: {
      entraId: "admin-placeholder",
      name: "Angelus Morningstar",
      email: "angelus@whitewater.com",
      role: Role.ADMIN,
    },
  });

  // Create reviewer users
  const reviewers = [
    { name: "Adam Salzer", email: "adam.salzer@whitewater.com" },
    { name: "Bernard Leung", email: "bernard.leung@whitewater.com" },
    { name: "Bruce Hamilton", email: "bruce.hamilton@whitewater.com" },
    { name: "Ian Riley", email: "ian.riley@whitewater.com" },
    { name: "Niel Malan", email: "niel.malan@whitewater.com" },
    { name: "Nicolette Grams", email: "nicolette.grams@whitewater.com" },
    { name: "Robert Bruce", email: "robert.bruce@whitewater.com" },
  ];

  for (const reviewer of reviewers) {
    await prisma.user.upsert({
      where: { email: reviewer.email },
      update: {},
      create: {
        entraId: `reviewer-${reviewer.name.toLowerCase().replace(/\s/g, "-")}`,
        name: reviewer.name,
        email: reviewer.email,
        role: Role.REVIEWER,
      },
    });
  }

  console.log("Seed data created: 1 admin + 7 reviewers");
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
