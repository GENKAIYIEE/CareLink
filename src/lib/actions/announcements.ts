"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/session";

export async function createAnnouncement(data: {
  title: string;
  content: string;
  category: string;
  status: string;
  targetBarangay?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      throw new Error("Unauthorized");
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category,
        status: data.status,
        targetBarangay: data.targetBarangay || null,
        authorId: session.userId,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/admin"); // Revalidate dashboard
    return { success: true, announcement };
  } catch (error: any) {
    console.error("Error creating announcement:", error);
    return { success: false, error: error.message };
  }
}

export async function getAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            fullName: true,
          },
        },
      },
    });
    return { success: true, announcements };
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    return { success: false, error: error.message };
  }
}

export async function getPublishedAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        status: "Published",
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            fullName: true,
          },
        },
      },
    });
    return { success: true, announcements };
  } catch (error: any) {
    console.error("Error fetching published announcements:", error);
    return { success: false, error: error.message };
  }
}

export async function updateAnnouncement(
  id: string,
  data: Partial<{
    title: string;
    content: string;
    category: string;
    status: string;
    targetBarangay: string | null;
  }>
) {
  try {
    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/admin");
    return { success: true, announcement };
  } catch (error: any) {
    console.error("Error updating announcement:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await prisma.announcement.delete({
      where: { id },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error.message };
  }
}
