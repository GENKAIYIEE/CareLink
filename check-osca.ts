import { prisma } from './src/lib/prisma';

async function main() {
  const yearPrefix = '2026-';
  const result = await prisma.$queryRaw<{ max_seq: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("oscaId" FROM CAST(${yearPrefix.length + 1} AS INTEGER)) AS INTEGER)) AS max_seq
    FROM "Senior"
    WHERE "oscaId" LIKE ${yearPrefix + '%'}
  `;
  console.log('Result with CAST:', result);
  
  const result2 = await prisma.$queryRaw<{ max_seq: number | null }[]>`
    SELECT MAX(CAST(SUBSTRING("oscaId" FROM 6) AS INTEGER)) AS max_seq
    FROM "Senior"
    WHERE "oscaId" LIKE ${yearPrefix + '%'}
  `;
  console.log('Result hardcoded:', result2);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
