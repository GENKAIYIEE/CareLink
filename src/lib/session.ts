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

function getEncodedKey() {
  const secretKey = process.env.SESSION_SECRET;
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
  
  // 1. Try unified session
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const payload = await decrypt(token);
    if (payload) {
      return payload;
    }
  }

  // 2. Fallback to legacy admin token
  const adminToken = cookieStore.get('admin_token')?.value;
  if (adminToken) {
    try {
      const legacyKey = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!legacyKey) return null;
      const secret = new TextEncoder().encode(legacyKey);
      const { payload } = await jwtVerify(adminToken, secret);
      return {
        userId: payload.adminId as string,
        role: "ADMIN" as const,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      } as SessionPayload;
    } catch {
      // Fall through to senior token
    }
  }

  // 3. Fallback to legacy senior token
  const seniorToken = cookieStore.get('senior_token')?.value;
  if (seniorToken) {
    try {
      const legacyKey = process.env.JWT_SECRET || process.env.SESSION_SECRET;
      if (!legacyKey) return null;
      const secret = new TextEncoder().encode(legacyKey);
      const { payload } = await jwtVerify(seniorToken, secret);
      return {
        userId: payload.seniorId as string,
        role: "SENIOR" as const,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000)
      } as SessionPayload;
    } catch {
      return null;
    }
  }

  return null;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
