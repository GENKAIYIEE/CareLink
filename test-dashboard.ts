import { prisma } from './src/lib/prisma';

async function main() {
  console.log("Testing senior query...");
  try {
    const senior = await prisma.senior.findFirst({
      include: {
        delegate: true,
        claims: {
          include: {
            program: true,
            claimedBy: true,
          },
          orderBy: {
            program: {
              distributionDate: 'desc',
            },
          },
        },
      },
    });
    console.log("Senior query passed.", senior ? "Found senior" : "No senior");
  } catch (e) {
    console.error("Senior query failed:", e);
  }

  console.log("Testing findFirst program...");
  try {
    const upcomingProgram = await prisma.benefitProgram.findFirst({
      where: {
        distributionDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        distributionDate: 'asc',
      },
    });
    console.log("findFirst passed.");
  } catch (e) {
    console.error("findFirst failed:", e);
  }

  console.log("Testing count program...");
  try {
    const upcomingProgramsCount = await prisma.benefitProgram.count({
      where: {
        distributionDate: {
          gte: new Date(),
        },
      },
    });
    console.log("count passed.");
  } catch (e) {
    console.error("count failed:", e);
  }

  console.log("Testing announcements...");
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'Published',
        OR: [
          { targetBarangay: null },
          { targetBarangay: "Barangay Test" },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });
    console.log("announcements passed.");
  } catch (e) {
    console.error("announcements failed:", e);
  }
}

main().finally(() => prisma.$disconnect());
