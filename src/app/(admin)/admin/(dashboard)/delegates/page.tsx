import { Metadata } from "next";
import { getDelegateRequestsAction } from "@/lib/actions/delegates";
import { DelegateRequestsTable, DelegateRequestRow } from "./DelegateRequestsTable";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Delegate Requests — CareLink Admin",
  description: "Review and process delegate nomination requests submitted by senior citizens.",
};

interface Props {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function DelegateRequestsPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const status = resolvedParams.status || "Pending";
  const search = resolvedParams.search || "";
  const page = Number(resolvedParams.page || 1);

  const result = await getDelegateRequestsAction({
    status,
    search,
    page,
    limit: 15,
  });

  const {
    requests = [],
    total = 0,
    pendingCount = 0,
    totalPages = 1,
  } = result.success ? result : { requests: [], total: 0, pendingCount: 0, totalPages: 1 };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-900 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Delegate Requests</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, verify uploaded ID documents, and approve delegate nominations submitted by senior citizens.
          </p>
        </div>
      </div>

      {/* Main Table & Controls */}
      <DelegateRequestsTable
        initialRequests={requests as DelegateRequestRow[]}
        total={total}
        pendingCount={pendingCount}
        page={page}
        totalPages={totalPages}
        currentStatus={status}
        currentSearch={search}
      />
    </div>
  );
}
