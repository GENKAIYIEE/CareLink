import "dotenv/config";
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email,
      fullName: 'System Administrator',
      passwordHash: hashedPassword,
      role: 'SuperAdmin',
    },
  });

  console.log('Admin user created/updated:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
