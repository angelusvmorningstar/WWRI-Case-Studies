import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing demo data
  const existing = await prisma.engagement.findUnique({ where: { accessKey: "demo-engagement" } });
  if (existing) {
    await prisma.engagement.delete({ where: { id: existing.id } });
  }

  // Create engagement: "Meridian Foods Group"
  const engagement = await prisma.engagement.create({
    data: {
      accessKey: "demo-engagement",
      clientName: "Meridian Foods Group",
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

  // Create interviewers
  const adam = await prisma.interviewer.create({ data: { engagementId: engagement.id, name: "Adam", adjustment: 0 } });
  const luis = await prisma.interviewer.create({ data: { engagementId: engagement.id, name: "Luis", adjustment: 0 } });
  const tom = await prisma.interviewer.create({ data: { engagementId: engagement.id, name: "Tom", adjustment: 0 } });

  // Create topic configs — first subtopic of each topic enabled
  const topicIds = ["t1", "t2", "t3", "t4", "t5", "t6"];
  const firstSubtopics = ["st1a", "st2a", "st3a", "st4a", "st5a", "st6a"];
  for (let i = 0; i < topicIds.length; i++) {
    await prisma.topicConfig.create({
      data: {
        id: `${engagement.id}_${topicIds[i]}`,
        engagementId: engagement.id,
        topicId: topicIds[i],
        enabled: true,
        selectedSubtopics: [firstSubtopics[i]],
      },
    });
  }

  // Create interviewees
  const claire = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "Claire Beaumont", title: "Chief Operating Officer", category: "Executive", status: "complete" },
  });
  const david = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "David Okafor", title: "Chief Financial Officer", category: "Senior Management", status: "complete" },
  });
  const sandra = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "Sandra Veltman", title: "Chief Marketing Officer", category: "Executive", status: "in-progress" },
  });
  const james = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "James Hartley", title: "Head of Strategy & Planning", category: "Senior Management", status: "pending" },
  });
  const priya = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "Priya Menon", title: "Head of People & Culture", category: "Senior Management", status: "pending" },
  });
  const tomR = await prisma.interviewee.create({
    data: { engagementId: engagement.id, name: "Tom Reinders", title: "Regional Operations Manager", category: "Middle Management", status: "pending" },
  });

  // Assign interviewers
  await prisma.interviewerAssignment.createMany({
    data: [
      { intervieweeId: claire.id, interviewerId: tom.id },
      { intervieweeId: david.id, interviewerId: tom.id },
      { intervieweeId: sandra.id, interviewerId: luis.id },
      { intervieweeId: james.id, interviewerId: adam.id },
      { intervieweeId: priya.id, interviewerId: luis.id },
      { intervieweeId: tomR.id, interviewerId: adam.id },
    ],
  });

  // Claire Beaumont — complete session with scores
  const claireSession = await prisma.session.create({
    data: { intervieweeId: claire.id, status: "complete", startedAt: new Date(), completedAt: new Date() },
  });
  await prisma.score.createMany({
    data: [
      { sessionId: claireSession.id, criteriaId: "c_st1a_1", value: 75 },
      { sessionId: claireSession.id, criteriaId: "c_st1a_2", value: 80 },
      { sessionId: claireSession.id, criteriaId: "c_st2a_1", value: 70 },
      { sessionId: claireSession.id, criteriaId: "c_st2a_2", value: 65 },
      { sessionId: claireSession.id, criteriaId: "c_st3a_1", value: 55 },
      { sessionId: claireSession.id, criteriaId: "c_st3a_2", value: 60 },
      { sessionId: claireSession.id, criteriaId: "c_st6a_1", value: 78 },
      { sessionId: claireSession.id, criteriaId: "c_st6a_2", value: 72 },
      { sessionId: claireSession.id, criteriaId: "c_st4a_1", value: 72 },
      { sessionId: claireSession.id, criteriaId: "c_st4a_2", value: 68 },
      { sessionId: claireSession.id, criteriaId: "c_st5a_1", value: 85 },
    ],
  });

  // David Okafor — complete session with scores
  const davidSession = await prisma.session.create({
    data: { intervieweeId: david.id, status: "complete", startedAt: new Date(), completedAt: new Date() },
  });
  await prisma.score.createMany({
    data: [
      { sessionId: davidSession.id, criteriaId: "c_st1a_1", value: 45 },
      { sessionId: davidSession.id, criteriaId: "c_st1a_2", value: 50 },
      { sessionId: davidSession.id, criteriaId: "c_st2a_1", value: 35 },
      { sessionId: davidSession.id, criteriaId: "c_st2a_2", value: 40 },
      { sessionId: davidSession.id, criteriaId: "c_st3a_1", value: 60 },
      { sessionId: davidSession.id, criteriaId: "c_st3a_2", value: 55 },
      { sessionId: davidSession.id, criteriaId: "c_st6a_1", value: 50 },
      { sessionId: davidSession.id, criteriaId: "c_st6a_2", value: 45 },
      { sessionId: davidSession.id, criteriaId: "c_st4a_1", value: 30 },
      { sessionId: davidSession.id, criteriaId: "c_st4a_2", value: 35 },
      { sessionId: davidSession.id, criteriaId: "c_st5a_1", value: 65 },
    ],
  });

  // Sandra Veltman — in-progress session with partial scores
  const sandraSession = await prisma.session.create({
    data: { intervieweeId: sandra.id, status: "in-progress", startedAt: new Date() },
  });
  await prisma.score.createMany({
    data: [
      { sessionId: sandraSession.id, criteriaId: "c_st1a_1", value: 60 },
      { sessionId: sandraSession.id, criteriaId: "c_st1a_2", value: 55 },
      { sessionId: sandraSession.id, criteriaId: "c_st2a_1", value: 70 },
      { sessionId: sandraSession.id, criteriaId: "c_st2a_2", value: 65 },
      { sessionId: sandraSession.id, criteriaId: "c_st3a_1", value: 45 },
      { sessionId: sandraSession.id, criteriaId: "c_st3a_2", value: 50 },
      { sessionId: sandraSession.id, criteriaId: "c_st6a_1", value: 65 },
      { sessionId: sandraSession.id, criteriaId: "c_st6a_2", value: 60 },
    ],
  });

  console.log("Seed complete: Meridian Foods Group with 6 interviewees, 3 interviewers, 3 sessions with scores");
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
