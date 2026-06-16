"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "@/lib/actions/announcements";

export default function DeleteAnnouncementButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setIsDeleting(true);
      try {
        const res = await deleteAnnouncement(id);
        if (!res.success) {
          alert(res.error || "Failed to delete announcement");
        }
      } catch (error) {
        console.error(error);
        alert("An unexpected error occurred while deleting announcement");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
      title="Delete Announcement"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
