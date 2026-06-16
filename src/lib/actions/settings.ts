'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { comparePasswords, hashPassword } from '@/lib/password';
import { revalidatePath } from 'next/cache';

export type SettingsState = {
  success?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
} | undefined;

export async function updateSystemName(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  const systemName = (formData.get('systemName') as string)?.trim();
  if (!systemName) {
    return { error: 'System name is required.' };
  }

  try {
    await prisma.systemSetting.upsert({
      where: { key: 'SYSTEM_NAME' },
      update: { value: systemName },
      create: { key: 'SYSTEM_NAME', value: systemName },
    });
    
    revalidatePath('/', 'layout');
    
    return { success: 'System name updated successfully.' };
  } catch (err) {
    console.error('Error updating system name:', err);
    return { error: 'Failed to update system name.' };
  }
}

export async function updateAdminPassword(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { error: 'Unauthorized.' };
  }

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All fields are required.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  if (newPassword.length < 6) {
    return { error: 'New password must be at least 6 characters long.' };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId }
    });

    if (!admin) {
      return { error: 'Admin account not found.' };
    }

    const isValid = await comparePasswords(currentPassword, admin.passwordHash);
    if (!isValid) {
      return { error: 'Incorrect current password.' };
    }

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.admin.update({
      where: { id: session.userId },
      data: { passwordHash: newHashedPassword }
    });

    return { success: 'Password updated successfully.' };
  } catch (err) {
    console.error('Error updating password:', err);
    return { error: 'Failed to update password.' };
  }
}
