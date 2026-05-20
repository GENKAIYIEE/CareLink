import 'server-only';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function getSeniorSession(): Promise<{
  seniorId: string;
  oscaId: string;
  role: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('senior_token')?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback_secret_key_that_is_at_least_32_chars_long');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload && typeof payload.seniorId === 'string' && typeof payload.oscaId === 'string') {
      return {
        seniorId: payload.seniorId,
        oscaId: payload.oscaId,
        role: payload.role as string,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}
