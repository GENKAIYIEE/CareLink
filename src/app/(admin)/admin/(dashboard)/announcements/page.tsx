import { getAnnouncements } from "@/lib/actions/announcements";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Megaphone, ChevronLeft, ChevronRight } from "lucide-react";
import DeleteAnnouncementButton from "./DeleteAnnouncementButton";
import { LiveUpdate } from "@/components/senior/LiveUpdate";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1'));
  const take = 10;
  const skip = (currentPage - 1) * take;

  const { announcements, success, totalCount, totalPages } = await getAnnouncements(currentPage, take);

  return (
    <div className="space-y-6">
      <LiveUpdate interval={10000} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Megaphone className="mr-2 h-6 w-6 text-green-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system announcements for staff and senior citizens.
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white shadow hover:bg-green-600/90 h-9 px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Announcement
        </Link>
      </div>

      <div className="rounded-xl border bg-white text-gray-950 shadow">
        <div className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Title</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Category</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Status</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Author</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">Date</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {!success || !announcements || announcements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-24 text-center text-gray-500">
                      No announcements found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  announcements.map((announcement) => (
                    <tr
                      key={announcement.id}
                      className="border-b transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-gray-50"
                    >
                      <td className="p-4 align-middle font-medium">
                        {announcement.title}
                      </td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                          {announcement.category}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            announcement.status === "Published"
                              ? "bg-green-100 text-green-800"
                              : announcement.status === "Archived"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {announcement.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        {announcement.author?.fullName || "Unknown"}
                      </td>
                      <td className="p-4 align-middle text-gray-500">
                        {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end items-center gap-2">
                          <DeleteAnnouncementButton id={announcement.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Link
                    href={`/admin/announcements?${new URLSearchParams({ page: Math.max(1, currentPage - 1).toString() })}`}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Previous
                  </Link>
                  <Link
                    href={`/admin/announcements?${new URLSearchParams({ page: Math.min(totalPages, currentPage + 1).toString() })}`}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Next
                  </Link>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{skip + 1}</span> to <span className="font-medium">{Math.min(skip + take, totalCount || 0)}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> announcements
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <Link
                        href={`/admin/announcements?${new URLSearchParams({ page: Math.max(1, currentPage - 1).toString() })}`}
                        className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </Link>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Link
                        href={`/admin/announcements?${new URLSearchParams({ page: Math.min(totalPages, currentPage + 1).toString() })}`}
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
  );
}
