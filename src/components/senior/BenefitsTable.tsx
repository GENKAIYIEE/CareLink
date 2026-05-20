'use client';

import React, { useState } from 'react';
import { Gift, ChevronLeft, ChevronRight } from 'lucide-react';

type Claim = {
  id: string;
  benefitName: string;
  type: string;
  distributionDate: string;
  claimedAt: string | null;
  status: string;
  claimant: string;
};

export default function BenefitsTable({ initialClaims }: { initialClaims: Claim[] }) {
  const [filter, setFilter] = useState<'All' | 'Claimed' | 'Pending'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredClaims = initialClaims.filter(claim => {
    if (filter === 'All') return true;
    if (filter === 'Claimed') return claim.status === 'Claimed';
    if (filter === 'Pending') return claim.status === 'Pending' || claim.status === 'Unclaimed';
    return true;
  });

  const totalPages = Math.ceil(filteredClaims.length / itemsPerPage);
  const paginatedClaims = filteredClaims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex gap-2">
        {(['All', 'Claimed', 'Pending'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-[#006b2c] text-white' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {paginatedClaims.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Benefit Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Distribution Date</th>
                <th className="px-6 py-4">Claimed Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Claimant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{claim.benefitName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200">
                      {claim.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{formatDate(claim.distributionDate)}</td>
                  <td className="px-6 py-4">
                    {claim.claimedAt ? formatDate(claim.claimedAt) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {claim.status === 'Claimed' ? (
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                        Claimed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{claim.claimant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
          <Gift className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-1">No claims found</p>
          <p>There are no benefits matching your current filter.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredClaims.length)}</span> of <span className="font-medium">{filteredClaims.length}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
