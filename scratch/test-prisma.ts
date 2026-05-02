
import { prisma } from '../src/lib/prisma';

async function test() {
  console.log('Prisma keys:', Object.keys(prisma));
  console.log('Announcement model:', prisma.announcement);
}

test().catch(console.error);
