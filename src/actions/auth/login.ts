'use server';

import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginState = {
  error?: string;
  fieldErrors?: {
    identifier?: string[];
    password?: string[];
  };
} | undefined;

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const identifier = formData.get('identifier') as string;
  const password = formData.get('password') as string;

  const parsed = loginSchema.safeParse({ identifier, password });
  if (!parsed.success) {
    return {
      error: 'Invalid inputs',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // 1. Try Admin table first
  const admin = await prisma.admin.findFirst({
    where: {
      OR: [
        { email: identifier },
        { fullName: identifier }
      ]
    }
  });

  if (admin) {
    if (!admin.passwordHash) {
      return { error: 'Invalid credentials. Please try again.' };
    }
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (match) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback_secret_key_that_is_at_least_32_chars_long');
      const token = await new SignJWT({
        adminId: admin.id,
        role: admin.role
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('8h')
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/'
      });

      redirect('/admin');
    }
  }



  // 2. Try Senior table next
  const senior = await prisma.senior.findFirst({
    where: {
      OR: [
        { oscaId: identifier },
        { contactNumber: identifier }
      ]
    }
  });

  if (senior) {
    if (!senior.passwordHash) {
      return { error: 'Account has no password set. Please contact OSCA.' };
    }
    const match = await bcrypt.compare(password, senior.passwordHash);
    if (match) {
      // Import createSession dynamically to avoid circular dependencies or use existing if imported at top
      const { createSession } = await import('@/lib/session');
      await createSession(senior.id, 'SENIOR');
      redirect('/senior/dashboard');
    }
  }

  // 3. If neither matched
  return { error: 'Invalid credentials. Please try again.' };
}
