import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting database cleanup...");

  // Based on schema.prisma:
  // 1. Claim depends on Senior, BenefitProgram, Delegate -> Delete Claim first
  // 2. Senior depends on Delegate (delegateId foreign key) -> Delete Senior before Delegate
  // 3. Delegate can be deleted after Claim and Senior are gone
  // 4. BenefitProgram can be deleted after Claim is gone
  // 5. Announcement depends on Admin
  // 6. ActivityLog depends on Admin
  
  try {
    const [
      claims,
      seniors,
      delegates,
      programs,
      announcements,
      logs
    ] = await prisma.$transaction([
      prisma.claim.deleteMany({}),
      prisma.senior.deleteMany({}),
      prisma.delegate.deleteMany({}),
      prisma.benefitProgram.deleteMany({}),
      prisma.announcement.deleteMany({}),
      prisma.activityLog.deleteMany({}),
    ]);

    console.log(`  ✅ Claims deleted: ${claims.count}`);
    console.log(`  ✅ Seniors deleted: ${seniors.count}`);
    console.log(`  ✅ Delegates deleted: ${delegates.count}`);
    console.log(`  ✅ BenefitPrograms deleted: ${programs.count}`);
    console.log(`  ✅ Announcements deleted: ${announcements.count}`);
    console.log(`  ✅ ActivityLogs deleted: ${logs.count}`);
    console.log(`  🎉 Database cleanup complete.`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
