import { prisma } from '@/lib/prisma';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default async function ClaimsPage() {
  const claims = await prisma.claim.findMany({
    include: {
      senior: true,
      program: true,
      claimedBy: true,
    },
    orderBy: { claimedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Claims Ledger</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage benefit claims across all programs.
          </p>
        </div>
      </div>

      <div className="flex max-w-md bg-white rounded-md shadow-sm border border-gray-300 px-3 py-2">
        <Search className="h-5 w-5 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search claims by OSCA ID or Name..." 
          className="ml-2 flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
        />
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Senior</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Program</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Claimed By</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                        No claims found in the system.
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim) => (
                      <tr key={claim.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div>{claim.senior.lastName}, {claim.senior.firstName}</div>
                          <div className="text-xs text-gray-500">{claim.senior.oscaId}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {claim.program.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            claim.status === 'Claimed' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                            claim.status === 'Unclaimed' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : 
                            'bg-red-50 text-red-700 ring-red-600/10'
                          }`}>
                            {claim.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {claim.status === 'Claimed' ? (
                            claim.claimedBy ? (
                              <div>
                                <span>{claim.claimedBy.fullName}</span>
                                <span className="text-xs text-gray-500 block">(Proxy)</span>
                              </div>
                            ) : (
                              'Self'
                            )
                          ) : '-'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {claim.status === 'Unclaimed' && (
                            <button className="text-blue-600 hover:text-blue-900">
                              Mark Claimed<span className="sr-only">, {claim.senior.firstName}</span>
                            </button>
                          )}
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
