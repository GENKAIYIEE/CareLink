'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { deleteProgram } from '@/lib/actions/programs';

export default function DeleteProgramButton({ id, title }: { id: string, title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProgram(id);
    setIsDeleting(false);
    if (result.success) {
      setIsOpen(false);
    } else {
      alert(result.error || 'Failed to delete program');
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex text-red-500 hover:text-red-700 transition-colors"
        title="Delete Program"
      >
        <Trash2 className="h-5 w-5" />
        <span className="sr-only">Delete</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 whitespace-normal text-left">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Delete Program?</h3>
              </div>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete <strong>{title}</strong>? All claims associated with this program will also be permanently deleted. This action cannot be undone.
              </p>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                  ) : (
                    'Delete Program'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
