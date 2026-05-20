'use server';

import { deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function logout() {
  await deleteSession();
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  redirect('/login');
}
