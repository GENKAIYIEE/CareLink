import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default async function ActivityLogPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const pageParam = searchParams?.page;
  const dateParam = searchParams?.date;
  
  const page = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
  const dateStr = typeof dateParam === 'string' ? dateParam : undefined;

  const take = 15;
  const skip = (page - 1) * take;

  let whereClause: any = {};
  if (dateStr) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    // Adjusting for timezone if needed, but standard GMT works for now
    whereClause.createdAt = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: whereClause,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    }),
    prisma.activityLog.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(total / take) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">System Activity Log</h2>
          <p className="mt-1 text-sm text-gray-500">
            Audit trail of administrative actions across the system.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <form method="GET" action="/admin/activity" className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              name="date"
              defaultValue={dateStr || ''}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-2 border outline-none"
            />
          </div>
          <button type="submit" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md font-semibold text-sm hover:bg-slate-200">
            Filter
          </button>
          {dateStr && (
            <Link href="/admin/activity" className="text-sm text-slate-500 hover:text-slate-700 underline">
              Clear Filter
            </Link>
          )}
        </form>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Admin</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                    No activity found for this period.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true
                      }).format(new Date(log.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs mr-3">
                          {log.admin.fullName.charAt(0)}
                        </div>
                        <div className="text-sm font-medium text-slate-900">{log.admin.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{total === 0 ? 0 : skip + 1}</span> to <span className="font-medium">{Math.min(skip + take, total)}</span> of <span className="font-medium">{total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <Link
                  href={`/admin/activity?page=${Math.max(1, page - 1)}${dateStr ? `&date=${dateStr}` : ''}`}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page <= 1 ? 'text-gray-300 pointer-events-none' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Link>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <Link
                  href={`/admin/activity?page=${Math.min(totalPages, page + 1)}${dateStr ? `&date=${dateStr}` : ''}`}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page >= totalPages ? 'text-gray-300 pointer-events-none' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
