import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { BellRing, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { LiveUpdate } from '@/components/senior/LiveUpdate';

export default async function SeniorAnnouncementsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
  });

  if (!senior) return null;

  const currentPage = parseInt(searchParams.page || '1', 10);
  const itemsPerPage = 5;

  const baseQuery = {
    where: {
      status: 'Published',
      OR: [
        { targetBarangay: null },
        { targetBarangay: senior.barangay },
      ],
    },
  };

  const [announcements, totalCount] = await Promise.all([
    prisma.announcement.findMany({
      ...baseQuery,
      orderBy: { createdAt: 'desc' },
      take: itemsPerPage,
      skip: (currentPage - 1) * itemsPerPage,
    }),
    prisma.announcement.count(baseQuery),
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <LiveUpdate interval={30000} />
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 text-[#006b2c] rounded-xl">
          <BellRing className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated with the latest news and programs.</p>
        </div>
      </div>

      <div className="space-y-6">
        {announcements.length > 0 ? (
          <>
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{announcement.title}</h2>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-md border border-gray-100">
                    <CalendarDays className="w-4 h-4" />
                    {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(announcement.createdAt))}
                  </span>
                </div>
                <div className="prose prose-green max-w-none text-gray-700 whitespace-pre-wrap">
                  {announcement.content}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
                </p>
                <div className="flex gap-2">
                  {currentPage > 1 ? (
                    <Link
                      href={`/senior/announcements?page=${currentPage - 1}`}
                      className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button disabled className="p-2 border border-gray-200 rounded-lg text-gray-300 cursor-not-allowed">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  {currentPage < totalPages ? (
                    <Link
                      href={`/senior/announcements?page=${currentPage + 1}`}
                      className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button disabled className="p-2 border border-gray-200 rounded-lg text-gray-300 cursor-not-allowed">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Announcements</h3>
            <p className="text-gray-500">There are currently no announcements for your barangay.</p>
          </div>
        )}
      </div>
    </div>
  );
}
