import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import DeleteProgramButton from './DeleteProgramButton';
import { format } from 'date-fns';
import { SearchBar } from '@/components/admin/SearchBar';
import { LiveUpdate } from '@/components/senior/LiveUpdate';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const query = searchParams.q || '';
  const currentPage = Math.max(1, parseInt(searchParams.page || '1'));
  const take = 10;
  const skip = (currentPage - 1) * take;

  const whereClause = query ? {
    title: { contains: query, mode: 'insensitive' as const }
  } : undefined;

  const [programs, totalCount] = await Promise.all([
    prisma.benefitProgram.findMany({
      where: whereClause,
      orderBy: { distributionDate: 'desc' },
      take,
      skip,
    }),
    prisma.benefitProgram.count({ where: whereClause })
  ]);
  
  const totalPages = Math.ceil(totalCount / take);

  return (
    <div className="space-y-6">
      <LiveUpdate interval={30000} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Benefit Programs</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage upcoming and past benefit distributions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/programs/new"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Create Program
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <SearchBar placeholder="Search programs..." />
        {query && (
          <p className="text-sm text-gray-500">
            {programs.length === 0 ? `No programs found for '${query}'` : `Showing ${programs.length} program${programs.length === 1 ? '' : 's'}`}
          </p>
        )}
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Distribution Date</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {programs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-gray-500">
                        No benefit programs found. Click &quot;Create Program&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => (
                      <tr key={program.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {program.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                            {program.type}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div>{format(new Date(program.distributionDate), 'MMM d, yyyy')}</div>
                          {(program.startTime || program.endTime) && (
                            <div className="text-xs mt-0.5 text-gray-400">
                              {program.startTime && format(new Date(`2000-01-01T${program.startTime}`), 'h:mm a')}
                              {program.startTime && program.endTime && ' - '}
                              {program.endTime && format(new Date(`2000-01-01T${program.endTime}`), 'h:mm a')}
                            </div>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end gap-3">
                            <Link href={`/admin/programs/${program.id}`} className="text-green-600 hover:text-green-800 transition-colors" title="View Program">
                              <Eye className="h-5 w-5" />
                              <span className="sr-only">View {program.title}</span>
                            </Link>
                            <Link href={`/admin/programs/${program.id}/edit`} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit Program">
                              <Edit className="h-5 w-5" />
                              <span className="sr-only">Edit {program.title}</span>
                            </Link>
                            <DeleteProgramButton id={program.id} title={program.title} />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Link
                      href={`/admin/programs?${new URLSearchParams({ ...searchParams, page: Math.max(1, currentPage - 1).toString() })}`}
                      className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Previous
                    </Link>
                    <Link
                      href={`/admin/programs?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, currentPage + 1).toString() })}`}
                      className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Next
                    </Link>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{skip + 1}</span> to <span className="font-medium">{Math.min(skip + take, totalCount)}</span> of{' '}
                        <span className="font-medium">{totalCount}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Link
                          href={`/admin/programs?${new URLSearchParams({ ...searchParams, page: Math.max(1, currentPage - 1).toString() })}`}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Link
                          href={`/admin/programs?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, currentPage + 1).toString() })}`}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
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
          </div>
        </div>
      </div>
    </div>
  );
}
