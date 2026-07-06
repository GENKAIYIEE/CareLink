"use client";

import Link from "next/link";
import { Eye, Edit2, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteSeniorAction } from "@/lib/actions/seniors";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function SeniorTableActions({ seniorId, seniorName }: { seniorId: string; seniorName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteSeniorAction(seniorId);
      if (res.success) {
        toast.success("Senior profile deleted successfully.");
        setShowConfirm(false);
        // Router refresh ensures the client data is up-to-date
        router.refresh();
      } else {
        toast.error("Failed to delete senior profile. Please try again.");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete senior profile. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <>
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
          onClick={() => setShowConfirm(true)}
          disabled={isDeleting}
          className={`text-gray-400 hover:text-red-600 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Delete Profile"
        >
          <Trash2 className="w-4 h-4" />
          <span className="sr-only">Delete {seniorName}</span>
        </button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => !isDeleting && setShowConfirm(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Senior Record</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete <strong className="text-gray-900">{seniorName}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
