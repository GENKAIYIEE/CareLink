'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from "@/lib/session";
export async function createProgram(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const distributionDateStr = formData.get('distributionDate') as string;
    const description = formData.get('description') as string;

    if (!title || !type || !distributionDateStr) {
      return { success: false, error: 'Missing required fields' };
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

    const session = await getSession();
    if (session && session.role === 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          action: "Created Program",
          details: `Created benefit program ${title}`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath('/admin/programs');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error("Error creating program:", error);
    return { success: false, error: error.message || "Failed to create program" };
  }
}
