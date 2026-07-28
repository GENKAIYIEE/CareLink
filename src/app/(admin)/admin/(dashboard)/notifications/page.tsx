import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import NotificationsList from '@/components/shared/NotificationsList';

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const session = await getSession();
  
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  const notifications = await prisma.notification.findMany({
    where: { adminId: session.userId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
        <p className="text-slate-500 mt-2">Manage all your system alerts, messages, and updates.</p>
      </div>

      <NotificationsList initialNotifications={notifications} />
    </div>
  );
}
