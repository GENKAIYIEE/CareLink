import { getAnnouncements } from "@/lib/actions/announcements";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Megaphone, MoreVertical, Edit2, Trash2 } from "lucide-react";
import DeleteAnnouncementButton from "./DeleteAnnouncementButton";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const { announcements, success } = await getAnnouncements();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
            <Megaphone className="mr-2 h-6 w-6 text-blue-600" />
            Announcements
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system announcements for staff and senior citizens.
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white shadow hover:bg-blue-600/90 h-9 px-4 py-2"
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
          </div>
        </div>
      </div>
    </div>
  );
}
