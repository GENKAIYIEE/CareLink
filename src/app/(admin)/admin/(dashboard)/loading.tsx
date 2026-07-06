import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="h-10 w-10 animate-spin text-green-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
      <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the data.</p>
    </div>
  );
}
