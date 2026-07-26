'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function changeSeniorPassword(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SENIOR') {
      return { error: 'Unauthorized' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { error: 'All fields are required' };
    }

    if (newPassword.length < 8) {
      return { error: 'New password must be at least 8 characters long' };
    }

    if (newPassword !== confirmPassword) {
      return { error: 'New passwords do not match' };
    }

    const senior = await prisma.senior.findUnique({
      where: { id: session.userId },
    });

    if (!senior || !senior.passwordHash) {
      return { error: 'Account not found or password not set' };
    }

    const isMatch = await bcrypt.compare(currentPassword, senior.passwordHash);
    if (!isMatch) {
      return { error: 'Incorrect current password' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.senior.update({
      where: { id: session.userId },
      data: { passwordHash: hashedNewPassword },
    });

    return { success: 'Password changed successfully' };
  } catch (error) {
    console.error('Change password error:', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}
