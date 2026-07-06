"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import { toast } from "sonner";

export default function DeleteAnnouncementButton({ id }: { id: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      setIsDeleting(true);
      try {
        const res = await deleteAnnouncement(id);
        if (!res.success) {
          toast.error("Failed to delete announcement. Please try again.");
        } else {
          toast.success("Announcement deleted successfully.");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete announcement. Please try again.");
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
