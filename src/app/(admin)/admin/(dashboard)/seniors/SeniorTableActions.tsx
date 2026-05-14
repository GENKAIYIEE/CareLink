"use client";

import Link from "next/link";
import { Eye, Edit2, Trash2 } from "lucide-react";
import { deleteSeniorAction } from "@/lib/actions/seniors";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SeniorTableActions({ seniorId, seniorName }: { seniorId: string; seniorName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this senior citizen's record? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await deleteSeniorAction(seniorId);
      if (res.success) {
        // Router refresh ensures the client data is up-to-date
        router.refresh();
      } else {
        alert(res.error || "Failed to delete senior.");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-3 items-center">
      <Link href={`/admin/seniors/${seniorId}`} className="text-gray-400 hover:text-indigo-600 transition-colors" title="View Profile">
        <Eye className="w-4 h-4" />
        <span className="sr-only">View {seniorName}</span>
      </Link>
      <Link href={`/admin/seniors/${seniorId}/edit`} className="text-gray-400 hover:text-green-600 transition-colors" title="Edit Profile">
        <Edit2 className="w-4 h-4" />
        <span className="sr-only">Edit {seniorName}</span>
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className={`text-gray-400 hover:text-red-600 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Delete Profile"
      >
        <Trash2 className="w-4 h-4" />
        <span className="sr-only">Delete {seniorName}</span>
      </button>
    </div>
  );
}
