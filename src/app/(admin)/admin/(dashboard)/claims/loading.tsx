import { Loader2 } from "lucide-react";

export default function ClaimsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md"></div>
          <div className="mt-2 h-4 w-64 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      <div className="h-10 w-full max-w-md bg-gray-200 rounded-xl"></div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <div className="min-w-full divide-y divide-gray-300">
                <div className="bg-gray-50 h-12 w-full"></div>
                <div className="bg-white space-y-4 p-4">
                  <div className="h-16 w-full bg-gray-100 rounded-md"></div>
                  <div className="h-16 w-full bg-gray-100 rounded-md"></div>
                  <div className="h-16 w-full bg-gray-100 rounded-md"></div>
                  <div className="h-16 w-full bg-gray-100 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center pt-8 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading claims ledger...</span>
      </div>
    </div>
  );
}
