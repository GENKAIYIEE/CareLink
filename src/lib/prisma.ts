import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  // PrismaPg adapter requires a DIRECT connection — it is NOT compatible with
  // PgBouncer transaction-mode pooling (pgbouncer=true / port 6543).
  // Use DIRECT_URL (port 5432) so the server never closes the connection prematurely.
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Neither DIRECT_URL nor DATABASE_URL environment variable is set.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Force a new client if the current one is missing new models (like activityLog)
const prismaInstance = globalForPrisma.prisma;
export const prisma = (prismaInstance && 'activityLog' in prismaInstance) 
  ? prismaInstance 
  : createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
