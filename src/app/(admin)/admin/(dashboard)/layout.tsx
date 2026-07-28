import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { prisma } from '@/lib/prisma';

// Force all admin pages to be server-rendered on demand.
// This prevents Next.js from attempting to pre-render admin routes at build time,
// which would otherwise spin up 11 parallel workers — each opening their own DB
// connections — and exhaust the Supabase session-pooler limit (15 connections max).
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'SYSTEM_NAME' }
  });
  const systemName = setting?.value || 'CareLink Admin';

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans print:bg-white print:min-h-0">
      <div className="print:hidden">
        <AdminSidebar systemName={systemName} />
        <AdminHeader systemName={systemName} />
      </div>
      <main className="md:ml-64 mt-16 p-6 md:p-8 pb-32 md:pb-8 max-w-[1280px] w-full flex flex-col gap-8 print:m-0 print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  );
}
