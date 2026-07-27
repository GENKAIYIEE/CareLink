'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createSession, deleteSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { comparePasswords } from '@/lib/password';
import {
  checkRateLimit,
  recordFailedAttempt,
  clearAttempts,
  getRemainingAttempts,
} from '@/lib/rateLimit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get('x-forwarded-for')?.split(',')[0].trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

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

  // ── Rate Limit Check (first — before any DB access or field validation) ──
  const ip = await getClientIp();
  const rateLimitKey = `login:${ip}`;
  const { allowed, retryAfterMs } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    const minutesLeft = Math.ceil((retryAfterMs ?? 0) / 60_000);
    return {
      error: `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`,
    };
  }

  // ── Field validation (after rate limit so probes consume attempts) ─────────
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
      recordFailedAttempt(rateLimitKey);
      const remaining = getRemainingAttempts(rateLimitKey);
      return {
        error: remaining > 0
          ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many failed login attempts. Please try again in 15 minutes.',
      };
    }
    // Admin matched — clear any failed attempts and create session
    clearAttempts(rateLimitKey);
    await createSession(admin.id, 'ADMIN');
    redirect('/admin');
  }

  // ── Neither model matched ─────────────────────────────────────────────────
  recordFailedAttempt(rateLimitKey);
  const remaining = getRemainingAttempts(rateLimitKey);
  return {
    error: remaining > 0
      ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
      : 'Too many failed login attempts. Please try again in 15 minutes.',
  };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers';

export async function logout() {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/login');
}

