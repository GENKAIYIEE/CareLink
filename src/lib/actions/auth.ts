'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// ─── Admin Login ──────────────────────────────────────────────────────────────

export type AdminLoginState = {
  error?: string;
} | undefined;

export async function adminLogin(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please fill in all fields.' };
  }

  // Look up admin in the database by email
  const admin = await prisma.admin.findUnique({ where: { email } });

  // Validate credentials using bcrypt
  // NOTE: Passwords must be pre-hashed (bcryptjs) when stored.
  if (!admin) {
    return { error: 'Invalid email or password.' };
  }

  // Simple placeholder check — replace with bcrypt.compare once Admin model has a `password` field
  const { comparePasswords } = await import('@/lib/password');
  const valid = await comparePasswords(password, admin.passwordHash ?? '');
  if (!valid) {
    return { error: 'Invalid email or password.' };
  }

  await createSession(admin.id, 'admin');
  redirect('/admin');
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession();
  redirect('/');
}

