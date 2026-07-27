import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/admin/SearchBar';
import { SeniorTableActions } from './SeniorTableActions';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { getEffectiveStatus } from '@/lib/utils/status';

export const dynamic = 'force-dynamic';

export default async function SeniorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q || '';
  const currentPage = parseInt(page || '1', 10);
  const itemsPerPage = 10;
  
  const whereClause = query ? {
    OR: [
      { firstName: { contains: query, mode: 'insensitive' as const } },
      { lastName: { contains: query, mode: 'insensitive' as const } },
      { oscaId: { contains: query, mode: 'insensitive' as const } }
    ]
  } : undefined;

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

  return (
    <div className="space-y-6">
      <LiveUpdate interval={30000} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Seniors Directory</h2>
          <p className="mt-1 text-sm text-gray-500">
            A list of all registered senior citizens in the municipality.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/seniors/register"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Add Senior
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <SearchBar placeholder="Search by name or OSCA ID..." />
        {query && (
          <p className="text-sm text-gray-500">
            {totalSeniors === 0 ? `No seniors found for '${query}'` : `Showing ${totalSeniors} senior${totalSeniors === 1 ? '' : 's'} for '${query}'`}
          </p>
        )}
      </div>

      {/* Seniors Table */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">OSCA ID</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Barangay</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {seniors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                        No senior citizens found. Click &quot;Add Senior&quot; to register one.
                      </td>
                    </tr>
                  ) : (
                    seniors.map((senior) => (
                      <tr key={senior.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {senior.lastName}, {senior.firstName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{senior.oscaId}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{senior.barangay}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            getEffectiveStatus(senior) === 'Active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            getEffectiveStatus(senior).includes('Inactive') ? 'bg-red-50 text-red-700 ring-red-600/20' : 
                            senior.status === 'Bedridden' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                            'bg-gray-50 text-gray-600 ring-gray-500/10'
                          }`}>
                            {getEffectiveStatus(senior)}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <SeniorTableActions seniorId={senior.id} seniorName={senior.firstName} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow ring-1 ring-black ring-opacity-5">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalSeniors)}</span> of{' '}
                <span className="font-medium">{totalSeniors}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <Link
                  href={`/admin/seniors?${new URLSearchParams({ ...(q ? { q } : {}), page: Math.max(1, currentPage - 1).toString() }).toString()}`}
                  className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </Link>
                {/* Minimal pages display for admin */}
                <div className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-20 focus:outline-offset-0">
                  Page {currentPage} of {totalPages}
                </div>
                <Link
                  href={`/admin/seniors?${new URLSearchParams({ ...(q ? { q } : {}), page: Math.min(totalPages, currentPage + 1).toString() }).toString()}`}
                  className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
