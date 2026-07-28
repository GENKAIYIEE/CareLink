'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/session';

export async function getNotifications(limit?: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const where = session.role === 'ADMIN' || session.role === 'SUPERADMIN' 
      ? { adminId: session.userId } 
      : { seniorId: session.userId };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { ...where, isRead: false },
    });

    return { success: true, notifications, unreadCount };
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

export async function markAsRead(notificationId: string) {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) return { success: false, error: 'Not found' };

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to mark as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

export async function markAllAsRead() {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  try {
    const where = session.role === 'ADMIN' || session.role === 'SUPERADMIN'
      ? { adminId: session.userId, isRead: false } 
      : { seniorId: session.userId, isRead: false };

    await prisma.notification.updateMany({
      where,
      data: { isRead: true },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

export async function createNotification(data: {
  title: string;
  message: string;
  type?: string;
  adminId?: string;
  seniorId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'System',
        adminId: data.adminId,
        seniorId: data.seniorId,
      }
    });
    return { success: true, notification };
  } catch (error) {
    console.error('Failed to create notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}
