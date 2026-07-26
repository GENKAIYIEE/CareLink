import { prisma } from './src/lib/prisma';

async function main() {
  console.log("Checking pgvector...");
  const exts = await prisma.$queryRaw`SELECT * FROM pg_extension WHERE extname = 'vector'`;
  console.log("Vector extension:", exts);

  console.log("\nChecking face_embedding column...");
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = 'Senior' AND column_name = 'face_embedding'
  `;
  console.log("face_embedding column:", cols);

  console.log("\nChecking match_face function...");
  const funcs = await prisma.$queryRaw<Array<{ proname: string; prosrc: string }>>`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE proname = 'match_face'
  `;
  console.log("match_face function:");
  funcs.forEach(f => console.log(f.prosrc));
}
main().catch(console.error).finally(() => prisma.$disconnect());
