"use client";

import { useState } from "react";
import { Clock, ExternalLink, X, FileText, AlertCircle } from "lucide-react";
import { cancelDelegateRequestAction } from "@/lib/actions/delegates";
import { toast } from "sonner";

interface Props {
  request: {
    id: string;
    fullName: string;
    relationship: string;
    contactNumber: string;
    documentUrl: string | null;
    signedDocumentUrl: string | null;
    createdAt: Date | string;
  };
}

export function PendingDelegateCard({ request }: Props) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this delegate nomination?")) return;
    setIsCancelling(true);
    setErrorMsg("");

    try {
      const res = await cancelDelegateRequestAction(request.id);
      if (!res.success) {
        const err = res.error || "Failed to cancel nomination.";
        setErrorMsg(err);
        toast.error(err);
        setIsCancelling(false);
      } else {
        toast.success("Delegate nomination cancelled successfully.");
      }
    } catch {
      const err = "Failed to connect. Please try again.";
      setErrorMsg(err);
      toast.error(err);
      setIsCancelling(false);
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(request.createdAt));

  return (
    <div className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-full flex items-center justify-center font-bold text-lg border border-amber-200 shrink-0">
            {request.fullName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{request.fullName}</h2>
            <p className="text-xs text-gray-500 font-medium">Nominated Delegate</p>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Pending OSCA Review
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Relationship</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{request.relationship}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact Number</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{request.contactNumber}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date Submitted</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Uploaded Document preview if present */}
      {request.signedDocumentUrl && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center text-gray-600 shrink-0">
              <FileText className="w-5 h-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Submitted Delegate Identification</p>
              <p className="text-xs text-gray-500">Attached supporting file for verification</p>
            </div>
          </div>
          <a
            href={request.signedDocumentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150 shrink-0"
          >
            <span>View File</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-500">
        <p>The OSCA office will verify this representative before granting benefit access.</p>
        <button
          type="button"
          disabled={isCancelling}
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors duration-150 disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          {isCancelling ? "Cancelling…" : "Cancel Nomination"}
        </button>
      </div>
    </div>
  );
}
