"use client";

import { useState } from "react";
import { trackApplicationAction, uploadApplicationDocumentAction } from "@/lib/actions/applications";
import { DOCUMENT_TYPES, APPLICATION_STATUS, type DocumentTypeId } from "@/lib/application-documents";
import { toast } from "sonner";
import { Loader2, Search, CheckCircle2, AlertCircle, Clock, Upload, XCircle, RefreshCw } from "lucide-react";

type TrackResult = {
  id: string;
  referenceCode: string;
  status: string;
  firstName: string;
  lastName: string;
  barangay: string;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
  documents: { type: string; status: string; note: string | null }[];
};

export function TrackForm() {
  const [referenceCode, setReferenceCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceCode.trim() || !dateOfBirth) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await trackApplicationAction(referenceCode.trim(), dateOfBirth);
      if (!res.success || !res.application) {
        setError(res.error ?? "Application not found.");
      } else {
        setResult(res.application as TrackResult);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReupload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!result) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf";
    const limit = isPdf ? 2 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > limit) {
      toast.error(`File too large. Limit: ${isPdf ? "2 MB for PDFs" : "3 MB for images"}.`);
      return;
    }

    setUploadingDoc(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadApplicationDocumentAction(result.id, docType as DocumentTypeId, fd);
      if (!res.success) {
        toast.error(res.error ?? "Upload failed.");
      } else {
        toast.success("Document re-uploaded. Refreshing status…");
        // Refresh the status
        const fresh = await trackApplicationAction(result.referenceCode, dateOfBirth);
        if (fresh.success && fresh.application) setResult(fresh.application as TrackResult);
      }
    } finally {
      setUploadingDoc(null);
      e.target.value = "";
    }
  };

  const statusConfig = result ? (APPLICATION_STATUS[result.status] ?? APPLICATION_STATUS.Pending) : null;

  const StatusIcon = result
    ? result.status === "Approved" ? CheckCircle2
    : result.status === "Rejected" ? XCircle
    : result.status === "NeedsReupload" ? AlertCircle
    : Clock
    : Clock;

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label htmlFor="refCode" className="block text-sm font-medium text-slate-700 mb-1">
            Reference Code
          </label>
          <input
            id="refCode"
            type="text"
            value={referenceCode}
            onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
            placeholder="APP-2026-XXXXXXXX"
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b2c]/40 focus:border-[#006b2c]"
            required
          />
        </div>
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-slate-700 mb-1">
            Applicant&apos;s Date of Birth
          </label>
          <input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b2c]/40 focus:border-[#006b2c]"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#006b2c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#005a24] disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? "Searching…" : "Check Status"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-2 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && statusConfig && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Status header */}
          <div className={`px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3`}>
            <div>
              <p className="text-xs text-slate-500 mb-1">Reference Code</p>
              <p className="text-lg font-mono font-bold text-slate-900">{result.referenceCode}</p>
              <p className="text-sm text-slate-600 mt-1">
                {result.firstName} {result.lastName} — Brgy. {result.barangay}
              </p>
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusConfig.label}
            </span>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Review note */}
            {result.reviewNote && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Note from OSCA Staff:</p>
                <p>{result.reviewNote}</p>
              </div>
            )}

            {/* Approved message */}
            {result.status === "Approved" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">Your application has been approved!</p>
                <p>You can now log in to the <a href="/senior/login" className="underline font-semibold">Senior Portal</a> using your OSCA ID and the password you created during application.</p>
              </div>
            )}

            {/* Document statuses */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Documents</p>
              <div className="space-y-3">
                {DOCUMENT_TYPES.map((docDef) => {
                  const doc = result.documents.find((d) => d.type === docDef.id);
                  const needsReupload = doc?.status === "NeedsReupload";
                  return (
                    <div
                      key={docDef.id}
                      className={`rounded-xl border p-3 flex items-start justify-between gap-3 ${
                        needsReupload ? "border-orange-300 bg-orange-50"
                        : doc?.status === "Accepted" ? "border-green-300 bg-green-50"
                        : doc ? "border-slate-200 bg-slate-50"
                        : "border-dashed border-slate-300"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">{docDef.label}</p>
                        {doc?.note && <p className="text-xs text-orange-700 mt-0.5">{doc.note}</p>}
                        {!doc && <p className="text-xs text-slate-400">Not yet uploaded</p>}
                      </div>
                      {doc && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          doc.status === "Accepted" ? "bg-green-100 text-green-700"
                          : doc.status === "NeedsReupload" ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-600"
                        }`}>
                          {doc.status === "Submitted" ? "Under Review" : doc.status === "NeedsReupload" ? "Re-upload Needed" : doc.status}
                        </span>
                      )}

                      {/* Re-upload button for documents that need it */}
                      {needsReupload && result.status === "NeedsReupload" && (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => handleReupload(e, docDef.id)}
                          />
                          <span className={`flex items-center gap-1.5 text-xs font-medium border border-orange-400 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors ${uploadingDoc === docDef.id ? "opacity-50 pointer-events-none" : ""}`}>
                            {uploadingDoc === docDef.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Upload className="w-3 h-3" />
                            }
                            Re-upload
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refresh */}
            <div className="border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleSearch as unknown as React.MouseEventHandler}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
