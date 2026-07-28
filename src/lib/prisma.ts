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

  // ⚠ Serverless connection pool limit:
  // Vercel runs each request in an isolated serverless function. The default pg.Pool
  // opens up to 10 connections per instance. During builds, Next.js spawns 11 workers
  // simultaneously — potentially 110 connections, blowing past Supabase's 15-connection
  // session-pooler cap. Capping at 1 keeps the total safely under the limit.
  const adapter = new PrismaPg({ connectionString, max: 1 });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Force a new client if the current one is missing new models
const prismaInstance = globalForPrisma.prisma;
export const prisma = (prismaInstance && 'activityLog' in prismaInstance && 'systemSetting' in prismaInstance) 
  ? prismaInstance 
  : createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
