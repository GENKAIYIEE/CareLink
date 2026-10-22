"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Users,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  approveDelegateRequestAction,
  rejectDelegateRequestAction,
} from "@/lib/actions/delegates";
import { toast } from "sonner";

export type DelegateRequestRow = {
  id: string;
  seniorId: string;
  fullName: string;
  relationship: string;
  contactNumber: string;
  documentUrl: string | null;
  signedDocUrl: string | null;
  status: string;
  reviewNote: string | null;
  reviewedAt: Date | string | null;
  createdAt: Date | string;
  senior: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    oscaId: string;
    barangay: string;
    contactNumber: string | null;
    delegateId: string | null;
  };
};

interface Props {
  initialRequests: DelegateRequestRow[];
  total: number;
  pendingCount: number;
  page: number;
  totalPages: number;
  currentStatus: string;
  currentSearch: string;
}

export function DelegateRequestsTable({
  initialRequests,
  total,
  pendingCount,
  page,
  totalPages,
  currentStatus,
  currentSearch,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [activeTab, setActiveTab] = useState(currentStatus || "all");

  // Rejection modal state
  const [rejectModalReq, setRejectModalReq] = useState<DelegateRequestRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // Document preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    delegateName: string;
    seniorName: string;
  } | null>(null);
  const [docZoom, setDocZoom] = useState(1);

  // Filter change handler
  const handleFilterChange = (status: string) => {
    setActiveTab(status);
    const params = new URLSearchParams(searchParams.toString());
    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/delegates?${params.toString()}`);
    });
  };

  // Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`/admin/delegates?${params.toString()}`);
    });
  };

  // Page change
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    startTransition(() => {
      router.push(`/admin/delegates?${params.toString()}`);
    });
  };

  // Approve action
  const handleApprove = async (req: DelegateRequestRow) => {
    if (
      !confirm(
        `Approve ${req.fullName} as the official authorized delegate of ${req.senior.firstName} ${req.senior.lastName}?`
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    setActionError("");

    try {
      const res = await approveDelegateRequestAction(req.id);
      if (!res.success) {
        const err = res.error || "Failed to approve delegate nomination.";
        setActionError(err);
        toast.error(err);
      } else {
        toast.success(`Delegate ${req.fullName} approved successfully.`);
        router.refresh();
      }
    } catch {
      const err = "Unexpected network error while approving.";
      setActionError(err);
      toast.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reject action
  const handleRejectConfirm = async () => {
    if (!rejectModalReq) return;

    setIsActionLoading(true);
    setActionError("");

    try {
      const res = await rejectDelegateRequestAction(
        rejectModalReq.id,
        rejectReason.trim() || undefined
      );
      if (!res.success) {
        const err = res.error || "Failed to reject nomination.";
        setActionError(err);
        toast.error(err);
      } else {
        toast.success(`Delegate nomination for ${rejectModalReq.fullName} rejected.`);
        setRejectModalReq(null);
        setRejectReason("");
        router.refresh();
      }
    } catch {
      const err = "Unexpected network error while rejecting.";
      setActionError(err);
      toast.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const isPdf = previewDoc?.url?.includes(".pdf");

  return (
    <div className="space-y-6">
      {/* Top Controls: Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("Pending")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "Pending"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Pending Review</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("Approved")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "Approved"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("Rejected")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "Rejected"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Rejected
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search senior, delegate, or OSCA ID..."
            className="w-full pl-9 pr-20 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {initialRequests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No delegate requests found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {activeTab === "Pending"
                ? "There are currently no pending delegate nominations awaiting OSCA review."
                : "No delegate nominations matched the current filter or search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-4">Senior Citizen</th>
                  <th className="py-3 px-4">Nominated Delegate</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Uploaded ID / Doc</th>
                  <th className="py-3 px-4">Date Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {initialRequests.map((req) => {
                  const seniorFullName = `${req.senior.lastName}, ${req.senior.firstName}${
                    req.senior.middleName ? ` ${req.senior.middleName.charAt(0)}.` : ""
                  }`;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/75 transition-colors duration-150"
                    >
                      {/* Senior Citizen */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/seniors/${req.senior.id}`}
                          className="font-bold text-slate-900 hover:text-green-800 hover:underline block truncate max-w-[200px]"
                        >
                          {seniorFullName}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono">{req.senior.oscaId}</span>
                          <span>•</span>
                          <span>{req.senior.barangay}</span>
                        </div>
                      </td>

                      {/* Nominated Delegate */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{req.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {req.contactNumber}
                        </div>
                      </td>

                      {/* Relationship */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {req.relationship}
                        </span>
                      </td>

                      {/* Uploaded Document / ID */}
                      <td className="py-3.5 px-4">
                        {req.signedDocUrl ? (
                          <button
                            type="button"
                            onClick={() => {
                              setDocZoom(1);
                              setPreviewDoc({
                                url: req.signedDocUrl!,
                                delegateName: req.fullName,
                                seniorName: seniorFullName,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 rounded-md transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-green-700" />
                            <span>View ID</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            No doc attached
                          </span>
                        )}
                      </td>

                      {/* Date Submitted */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(req.createdAt))}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {req.status === "Pending" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending
                          </span>
                        )}
                        {req.status === "Approved" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                        )}
                        {req.status === "Rejected" && (
                          <span
                            title={req.reviewNote || "Rejected"}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 cursor-help"
                          >
                            <XCircle className="w-3 h-3 text-red-600" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {req.status === "Pending" ? (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              disabled={isActionLoading || isPending}
                              onClick={() => handleApprove(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-green-800 hover:bg-green-900 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading || isPending}
                              onClick={() => {
                                setRejectModalReq(req);
                                setRejectReason("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-md transition-colors disabled:opacity-50"
                            >
                              <X className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : req.status === "Approved" ? (
                          <span className="text-[11px] text-slate-400">
                            {req.reviewedAt
                              ? new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                }).format(new Date(req.reviewedAt))
                              : "Active"}
                          </span>
                        ) : (
                          <span
                            className="text-[11px] text-slate-400 truncate max-w-[120px] inline-block"
                            title={req.reviewNote || "No note specified"}
                          >
                            {req.reviewNote || "No note"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <span>
              Showing {initialRequests.length} of {total} total requests
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-semibold text-slate-800">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Nomination Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Reject Delegate Nomination
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Nomination for <span className="font-semibold">{rejectModalReq.fullName}</span>{" "}
                  (Senior: {rejectModalReq.senior.lastName}, {rejectModalReq.senior.firstName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for rejection (will be sent as notification to senior):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Uploaded valid ID was expired, unclear photo, or wrong document."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setRejectModalReq(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleRejectConfirm}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              >
                {isActionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Delegate ID: {previewDoc.delegateName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Nominated by Senior: {previewDoc.seniorName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!isPdf && (
                  <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.max(0.5, z - 0.25))}
                      title="Zoom Out"
                      className="p-1 text-slate-600 hover:text-slate-900 rounded"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocZoom(1)}
                      title="Reset Zoom"
                      className="p-1 text-slate-600 hover:text-slate-900 rounded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.min(3, z + 0.25))}
                      title="Zoom In"
                      className="p-1 text-slate-600 hover:text-slate-900 rounded"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>Open Full</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Preview */}
            <div className="flex-1 overflow-auto p-4 bg-slate-900/5 flex items-center justify-center min-h-[350px]">
              {isPdf ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[550px] rounded border border-slate-200 bg-white"
                  title="Delegate ID Document"
                />
              ) : (
                <div
                  className="transition-transform duration-150 origin-center"
                  style={{ transform: `scale(${docZoom})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDoc.url}
                    alt="Delegate ID Preview"
                    className="max-h-[60vh] max-w-full object-contain rounded shadow-sm border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
