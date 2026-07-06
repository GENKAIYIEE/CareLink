import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans print:bg-white print:min-h-0">
      <div className="print:hidden">
        <AdminSidebar />
        <AdminHeader />
      </div>
      <main className="md:ml-64 mt-16 p-6 md:p-8 pb-32 md:pb-8 max-w-[1280px] w-full flex flex-col gap-8 print:m-0 print:p-0 print:max-w-none">
        {children}
      </main>
    </div>
  );
}
