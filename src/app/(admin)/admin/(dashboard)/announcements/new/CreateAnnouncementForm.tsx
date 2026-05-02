"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAnnouncement } from "@/lib/actions/announcements";
import { Loader2 } from "lucide-react";

export default function CreateAnnouncementForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const content = formData.get("content") as string;

    try {
      const res = await createAnnouncement({ title, category, status, content });
      
      if (res.success) {
        router.push("/admin/announcements");
      } else {
        setError(res.error || "Failed to create announcement");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3 text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
            placeholder="e.g., Change in Pension Distribution Date"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 bg-white"
          >
            <option value="General">General</option>
            <option value="Program">Program Update</option>
            <option value="Beneficiary">Beneficiary Notice</option>
            <option value="Date">Date Change</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            required
            className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 bg-white"
          >
            <option value="Draft">Draft (Hidden)</option>
            <option value="Published">Published (Visible)</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea
            id="content"
            name="content"
            rows={6}
            required
            className="mt-1 block w-full rounded-md border-gray-300 border shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2"
            placeholder="Write the full details of the announcement here..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Announcement"
          )}
        </button>
      </div>
    </form>
  );
}
