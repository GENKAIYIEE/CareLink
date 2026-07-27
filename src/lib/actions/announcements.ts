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
    if (!session || session.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
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

    await prisma.activityLog.create({
      data: {
        action: "Created Announcement",
        details: `Created announcement ${announcement.title}`,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/admin"); // Revalidate dashboard
    return { success: true, announcement };
  } catch (error: unknown) {
    console.error("Error creating announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "An error occurred" };
  }
}

export async function getAnnouncements(page: number = 1, take: number = 10) {
  try {
    const skip = (page - 1) * take;
    const [announcements, totalCount] = await Promise.all([
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              fullName: true,
            },
          },
        },
        take,
        skip,
      }),
      prisma.announcement.count()
    ]);
    const totalPages = Math.ceil(totalCount / take);
    return { success: true, announcements, totalCount, totalPages };
  } catch (error: unknown) {
    console.error("Error fetching announcements:", error);
    return { success: false, error: error instanceof Error ? error.message : "An error occurred" };
  }
}

export async function getPublishedAnnouncements() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        status: "Published",
      },
      orderBy: { createdAt: "desc" },
      take: 50, // never pull unbounded rows — senior feed needs at most 50
      include: {
        author: {
          select: {
            fullName: true,
          },
        },
      },
    });
    return { success: true, announcements };
  } catch (error: unknown) {
    console.error("Error fetching published announcements:", error);
    return { success: false, error: error instanceof Error ? error.message : "An error occurred" };
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
    // Auth guard must happen BEFORE the DB write
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data,
    });

    await prisma.activityLog.create({
      data: {
        action: "Updated Announcement",
        details: `Updated announcement ${announcement.title}`,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/announcements");
    revalidatePath("/admin");
    return { success: true, announcement };
  } catch (error: unknown) {
    console.error("Error updating announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "An error occurred" };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const announcement = await prisma.announcement.findUnique({ where: { id } });

    await prisma.announcement.delete({
      where: { id },
    });

    const session = await getSession();
    if (session && session.role === 'ADMIN' && announcement) {
      await prisma.activityLog.create({
        data: {
          action: "Deleted Announcement",
          details: `Deleted announcement ${announcement.title}`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath("/admin/announcements");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting announcement:", error);
    return { success: false, error: error instanceof Error ? error.message : "An error occurred" };
  }
}
