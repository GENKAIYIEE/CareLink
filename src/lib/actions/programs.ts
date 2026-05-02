'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProgram(formData: FormData) {
  const title = formData.get('title') as string;
  const type = formData.get('type') as string;
  const distributionDateStr = formData.get('distributionDate') as string;
  const description = formData.get('description') as string;

  if (!title || !type || !distributionDateStr) {
    throw new Error('Missing required fields');
  }

  // Convert distributionDate to a JavaScript Date object
  const distributionDate = new Date(distributionDateStr);

  await prisma.benefitProgram.create({
    data: {
      title,
      type,
      distributionDate,
      description: description || null,
    },
  });

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}
