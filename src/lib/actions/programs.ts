'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from "@/lib/session";
export async function createProgram(formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const distributionDateStr = formData.get('distributionDate') as string;
    const startTime = formData.get('startTime') as string | null;
    const endTime = formData.get('endTime') as string | null;
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
        startTime: startTime || null,
        endTime: endTime || null,
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
  } catch (error: unknown) {
    console.error("Error creating program:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to create program" };
  }
}

export async function updateProgram(id: string, formData: FormData) {
  try {
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const distributionDateStr = formData.get('distributionDate') as string;
    const startTime = formData.get('startTime') as string | null;
    const endTime = formData.get('endTime') as string | null;
    const description = formData.get('description') as string;

    if (!title || !type || !distributionDateStr) {
      return { success: false, error: 'Missing required fields' };
    }

    const distributionDate = new Date(distributionDateStr);

    await prisma.benefitProgram.update({
      where: { id },
      data: {
        title,
        type,
        distributionDate,
        startTime: startTime || null,
        endTime: endTime || null,
        description: description || null,
      },
    });

    const session = await getSession();
    if (session && session.role === 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          action: "Updated Program",
          details: `Updated benefit program: ${title}`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath('/admin/programs');
    revalidatePath(`/admin/programs/${id}`);
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating program:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to update program" };
  }
}

export async function deleteProgram(id: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const program = await prisma.benefitProgram.findUnique({
      where: { id },
      select: { title: true }
    });

    if (!program) {
      return { success: false, error: 'Program not found' };
    }

    // Delete claims associated with the program first
    await prisma.claim.deleteMany({
      where: { programId: id }
    });

    // Delete the program
    await prisma.benefitProgram.delete({
      where: { id }
    });

    await prisma.activityLog.create({
      data: {
        action: "Deleted Program",
        details: `Deleted benefit program: ${program.title}`,
        adminId: session.userId,
      },
    });

    revalidatePath('/admin/programs');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting program:", error);
    return { success: false, error: "Failed to delete program" };
  }
}
