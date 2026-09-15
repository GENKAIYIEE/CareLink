const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function run() {
  const yearPrefix = '2026-';
  try {
    const result = await prisma.$queryRaw`
      SELECT MAX(CAST(SUBSTRING("oscaId" FROM ${yearPrefix.length + 1}) AS INTEGER)) AS max_seq
      FROM "Senior"
      WHERE "oscaId" LIKE ${yearPrefix + '%'}
    `;
    console.log("Success:", result);
  } catch(e) {
    console.error("Prisma Error:", e);
  }
}
run();
