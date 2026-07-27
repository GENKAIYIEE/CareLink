'use client';

import { updateProgram } from '@/lib/actions/programs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditProgramForm({ program }: { program: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await updateProgram(program.id, formData);
      if (res.success) {
        toast.success("Program updated successfully.");
        router.push('/admin/programs');
      } else {
        toast.error(res.error || "Failed to update program.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update program. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/programs" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Edit Program</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the details for <strong>{program.title}</strong>
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        <form onSubmit={handleSubmit} className="px-4 py-6 sm:p-8">
          <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900">
                Program Title
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="title"
                  id="title"
                  defaultValue={program.title}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900">
                Program Type
              </label>
              <div className="mt-2">
                <select
                  id="type"
                  name="type"
                  defaultValue={program.type}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3 bg-white"
                >
                  <option value="">Select a type...</option>
                  <option value="Financial">Financial Assistance</option>
                  <option value="Medical">Medical / Medicine</option>
                  <option value="Food">Food / Groceries</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="distributionDate" className="block text-sm font-medium leading-6 text-gray-900">
                Distribution Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  name="distributionDate"
                  id="distributionDate"
                  defaultValue={program.formattedDate}
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="startTime" className="block text-sm font-medium leading-6 text-gray-900">
                Start Time (Optional)
              </label>
              <div className="mt-2">
                <input
                  type="time"
                  name="startTime"
                  id="startTime"
                  defaultValue={program.startTime || ''}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="endTime" className="block text-sm font-medium leading-6 text-gray-900">
                End Time (Optional)
              </label>
              <div className="mt-2">
                <input
                  type="time"
                  name="endTime"
                  id="endTime"
                  defaultValue={program.endTime || ''}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900">
                Description (Optional)
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  defaultValue={program.description || ''}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6 px-3"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-gray-900/10 pt-8">
            <Link href="/admin/programs" className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
