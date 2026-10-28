import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { SearchBar } from '@/components/admin/SearchBar';
import { SeniorTableActions } from './SeniorTableActions';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { getEffectiveStatus } from '@/lib/utils/status';
import { getMilestoneInfo } from '@/lib/utils/milestone';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Senior Citizens Directory',
};

const MILESTONE_FILTERS = [
  { key: 'all', label: 'All Seniors' },
  { key: 'any', label: 'All Milestones (80+)' },
  { key: '80', label: 'Milestone 80' },
  { key: '85', label: 'Milestone 85' },
  { key: '90', label: 'Milestone 90' },
  { key: '95', label: 'Milestone 95' },
  { key: '100', label: 'Centenarians (100+)' },
] as const;

export default async function SeniorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; milestone?: string }>;
}) {
  const { q, page, milestone } = await searchParams;
  const query = q || '';
  const currentMilestone = milestone || 'all';
  const currentPage = parseInt(page || '1', 10);
  const itemsPerPage = 10;
  
  const currentYear = new Date().getFullYear();
  const conditions: Prisma.SeniorWhereInput[] = [];

  if (query) {
    conditions.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
        { oscaId: { contains: query, mode: 'insensitive' as const } }
      ]
    });
  }

  if (currentMilestone === 'any') {
    const maxDob80 = new Date(currentYear - 80, 11, 31, 23, 59, 59);
    conditions.push({
      OR: [
        { milestoneAge: { not: null } },
        { dateOfBirth: { lte: maxDob80 } }
      ]
    });
  } else if (['80', '85', '90', '95'].includes(currentMilestone)) {
    const target = parseInt(currentMilestone, 10);
    const startOfYear = new Date(currentYear - target, 0, 1);
    const endOfYear = new Date(currentYear - target, 11, 31, 23, 59, 59);
    conditions.push({
      OR: [
        { milestoneAge: target },
        { dateOfBirth: { gte: startOfYear, lte: endOfYear } }
      ]
    });
  } else if (currentMilestone === '100') {
    const maxDob100 = new Date(currentYear - 100, 11, 31, 23, 59, 59);
    conditions.push({
      OR: [
        { milestoneAge: 100 },
        { dateOfBirth: { lte: maxDob100 } }
      ]
    });
  }

  const whereClause: Prisma.SeniorWhereInput | undefined = conditions.length > 0 ? { AND: conditions } : undefined;

  const [seniors, totalSeniors] = await Promise.all([
    prisma.senior.findMany({
      where: whereClause,
      orderBy: { lastName: 'asc' },
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage,
    }),
    prisma.senior.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalSeniors / itemsPerPage) || 1;

  // Generate page numbers array with ellipses for clean navigation
  const pageNumbers: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else if (currentPage <= 3) {
    pageNumbers.push(1, 2, 3, 4, '...', totalPages);
  } else if (currentPage >= totalPages - 2) {
    pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }

  const buildUrl = (targetPage: number, targetMilestone = currentMilestone) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (targetMilestone && targetMilestone !== 'all') params.set('milestone', targetMilestone);
    if (targetPage > 1) params.set('page', targetPage.toString());
    const str = params.toString();
    return `/admin/seniors${str ? `?${str}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <LiveUpdate interval={30000} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Seniors Directory</h2>
          <p className="mt-1 text-sm text-gray-500">
            A list of all registered senior citizens in the municipality with milestone monitoring.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/seniors/register"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors duration-150"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Senior
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <SearchBar placeholder="Search by name or OSCA ID..." />
        
        {/* Milestone Monitoring Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 font-medium mr-1 shrink-0 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-700" /> Milestone Filter:
          </span>
          {MILESTONE_FILTERS.map((f) => {
            const isActive = currentMilestone === f.key;
            return (
              <Link
                key={f.key}
                href={buildUrl(1, f.key)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-md font-medium transition-colors ${
                  isActive
                    ? 'bg-[#163d28] text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {query && (
          <p className="text-sm text-gray-500">
            {totalSeniors === 0 ? `No seniors found for '${query}'` : `Showing ${totalSeniors} senior${totalSeniors === 1 ? '' : 's'} for '${query}'`}
          </p>
        )}
      </div>

      {/* Seniors Table with Integrated Pagination */}
      <div className="mt-6 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden bg-white border border-gray-200 sm:rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">OSCA ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Barangay</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {seniors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-gray-500">
                        No senior citizens found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    seniors.map((senior) => {
                      const mInfo = getMilestoneInfo(senior);
                      return (
                        <tr key={senior.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <div className="flex items-center gap-2">
                              <span>{senior.lastName}, {senior.firstName}</span>
                              {mInfo.isMilestone && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {mInfo.badgeText}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-600">{senior.oscaId}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">{senior.barangay}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${
                              getEffectiveStatus(senior) === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                              getEffectiveStatus(senior).includes('Inactive') ? 'bg-red-50 text-red-800 border-red-200' : 
                              senior.status === 'Bedridden' ? 'bg-amber-50 text-amber-800 border-amber-200' : 
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }`}>
                              {getEffectiveStatus(senior)}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <SeniorTableActions seniorId={senior.id} seniorName={senior.firstName} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Integrated Pagination Footer */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  {/* Mobile View */}
                  <div className="flex flex-1 items-center justify-between sm:hidden">
                    <Link
                      href={buildUrl(Math.max(1, currentPage - 1))}
                      className={`inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150 ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}
                    >
                      Previous
                    </Link>
                    <span className="text-xs text-gray-600 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Link
                      href={buildUrl(Math.min(totalPages, currentPage + 1))}
                      className={`inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-150 ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
                    >
                      Next
                    </Link>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                        <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, totalSeniors)}</span> of{' '}
                        <span className="font-semibold text-gray-900">{totalSeniors}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md border border-gray-300 bg-white shadow-sm" aria-label="Pagination">
                        {/* Previous Button */}
                        <Link
                          href={buildUrl(Math.max(1, currentPage - 1))}
                          className={`relative inline-flex items-center rounded-l-md px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition-colors duration-150 ${currentPage <= 1 ? 'pointer-events-none opacity-40' : ''}`}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        </Link>

                        {/* Page Numbers */}
                        {pageNumbers.map((p, idx) => {
                          if (p === '...') {
                            return (
                              <span
                                key={`ellipsis-${idx}`}
                                className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-400 border-l border-gray-300"
                              >
                                …
                              </span>
                            );
                          }
                          const isCurrent = p === currentPage;
                          return (
                            <Link
                              key={p}
                              href={buildUrl(p)}
                              className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold border-l border-gray-300 transition-colors duration-150 focus:z-20 focus:outline-offset-0 ${
                                isCurrent
                                  ? 'bg-[#163d28] text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                              aria-current={isCurrent ? 'page' : undefined}
                            >
                              {p}
                            </Link>
                          );
                        })}

                        {/* Next Button */}
                        <Link
                          href={buildUrl(Math.min(totalPages, currentPage + 1))}
                          className={`relative inline-flex items-center rounded-r-md px-2.5 py-1.5 text-gray-500 border-l border-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition-colors duration-150 ${currentPage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
