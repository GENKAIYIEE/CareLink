'use server';

import { prisma } from '@/lib/prisma';

export async function getSeniorByOscaId(oscaId: string) {
  try {
    const senior = await prisma.senior.findUnique({
      where: { oscaId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        oscaId: true,
        barangay: true,
        photoUrl: true,
        status: true,
      },
    });
    return senior;
  } catch (error) {
    console.error('Error fetching senior by OSCA ID:', error);
    return null;
  }
}
