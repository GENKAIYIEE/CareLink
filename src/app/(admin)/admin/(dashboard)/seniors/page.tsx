import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default async function SeniorsPage() {
  const seniors = await prisma.senior.findMany({
    orderBy: { lastName: 'asc' },
  });

  return (
    <div className="space-y-6">
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

      {/* Basic Search Bar UI (non-functional for now, can be implemented with query params later) */}
      <div className="flex max-w-md bg-white rounded-md shadow-sm border border-gray-300 px-3 py-2">
        <Search className="h-5 w-5 text-gray-400" />
        <input 
          type="text" 
          suppressHydrationWarning
          placeholder="Search by name or OSCA ID..." 
          className="ml-2 flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
        />
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
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {seniors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                        No senior citizens found. Click "Add Senior" to register one.
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
                            senior.status === 'Active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            senior.status === 'Bedridden' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                            'bg-gray-50 text-gray-600 ring-gray-500/10'
                          }`}>
                            {senior.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link href={`/admin/seniors/${senior.id}`} className="text-green-600 hover:text-green-900">
                            Edit<span className="sr-only">, {senior.firstName}</span>
                          </Link>
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
    </div>
  );
}
