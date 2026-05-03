'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { comparePasswords } from '@/lib/password';

// ─── Unified Login (Smart Routing) ───────────────────────────────────────────

export type LoginState = {
  error?: string;
} | undefined;

/**
 * Unified login action that accepts either an Admin email/username or a
 * Senior's OSCA ID as the identifier, then routes the session to the
 * correct portal based on which model matched.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = (formData.get('identifier') as string)?.trim();
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Please fill in all fields.' };
  }

  // ── Step 1: Try Admin model (match by email) ──────────────────────────────
  const admin = await prisma.admin.findUnique({
    where: { email: identifier },
  });

  if (admin) {
    const valid = await comparePasswords(password, admin.passwordHash ?? '');
    if (!valid) {
      return { error: 'Invalid credentials.' };
    }
    // Admin matched — create session with ADMIN role and redirect
    await createSession(admin.id, 'ADMIN');
    redirect('/admin');
  }

  // ── Step 2: Try Senior model (match by OSCA ID) ───────────────────────────
  const senior = await prisma.senior.findUnique({
    where: { oscaId: identifier },
  });

  if (senior) {
    const valid = await comparePasswords(password, senior.passwordHash ?? '');
    if (!valid) {
      return { error: 'Invalid credentials.' };
    }
    // Senior matched — create session with SENIOR role and redirect
    await createSession(senior.id, 'SENIOR');
    redirect('/senior');
  }

  // ── Neither model matched ─────────────────────────────────────────────────
  return { error: 'Invalid credentials.' };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout() {
  await deleteSession();
  redirect('/admin/login');
}
