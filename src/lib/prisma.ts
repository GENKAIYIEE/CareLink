import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrismaClient() {
  // PrismaPg adapter requires a DIRECT connection — it is NOT compatible with
  // PgBouncer transaction-mode pooling (pgbouncer=true / port 6543).
  // Use DIRECT_URL (port 5432) so the server never closes the connection prematurely.
  let connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Neither DIRECT_URL nor DATABASE_URL environment variable is set.');
  }

  // Defensive fix for Vercel + Supabase: If the user provided a transaction pooler URL (6543)
  // we automatically convert it to the session pooler / direct URL (5432) required by PrismaPg.
  if (connectionString.includes(':6543') || connectionString.includes('pgbouncer=true')) {
    connectionString = connectionString.replace(':6543', ':5432').replace('?pgbouncer=true', '').replace('&pgbouncer=true', '');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Force a new client if the current one is missing new models
const prismaInstance = globalForPrisma.prisma;
export const prisma = (prismaInstance && 'activityLog' in prismaInstance && 'systemSetting' in prismaInstance) 
  ? prismaInstance 
  : createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
