import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SessionPayload = {
  userId: string;
  role: 'ADMIN' | 'SENIOR';
  expiresAt: Date;
};

// ─── Keys ────────────────────────────────────────────────────────────────────

const secretKey = process.env.SESSION_SECRET;

function getEncodedKey() {
  if (!secretKey) {
    throw new Error('SESSION_SECRET environment variable is not set.');
  }
  return new TextEncoder().encode(secretKey);
}

// ─── Encrypt / Decrypt ───────────────────────────────────────────────────────

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey());
}

export async function decrypt(token: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Cookie Helpers ───────────────────────────────────────────────────────────

const COOKIE_NAME = 'carelink_session';

export async function createSession(userId: string, role: 'ADMIN' | 'SENIOR') {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, role, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return decrypt(token);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
