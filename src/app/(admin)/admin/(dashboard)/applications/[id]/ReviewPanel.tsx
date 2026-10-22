"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  approveApplicationAction,
  rejectApplicationAction,
  requestReuploadAction,
} from "@/lib/actions/applications";
import { DOCUMENT_TYPES } from "@/lib/application-documents";
import { CheckCircle2, XCircle, Upload, Loader2, ChevronDown } from "lucide-react";

interface Doc {
  type: string;
  status: string;
}

interface Props {
  applicationId: string;
  applicationStatus: string;
  documents: Doc[];
}

export function ReviewPanel({ applicationId, applicationStatus, documents }: Props) {
  const router = useRouter();
  const [action, setAction] = useState<"approve" | "reject" | "reupload" | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<string>(DOCUMENT_TYPES[0].id);
  const [reuploadNote, setReuploadNote] = useState("");

  const handleApprove = async () => {
    if (!confirm(`Approve this application and create a Senior Citizen record? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await approveApplicationAction(applicationId);
      if (!res.success) {
        toast.error(res.error ?? "Approval failed.");
      } else {
        toast.success(`Approved! OSCA ID: ${res.oscaId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) { toast.error("Please provide a reason for rejection."); return; }
    setLoading(true);
    try {
      const res = await rejectApplicationAction(applicationId, rejectReason);
      if (!res.success) {
        toast.error(res.error ?? "Rejection failed.");
      } else {
        toast.success("Application rejected.");
        router.refresh();
      }
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleReupload = async () => {
    if (!reuploadNote.trim()) { toast.error("Please explain what needs to be re-uploaded."); return; }
    setLoading(true);
    try {
      const res = await requestReuploadAction(applicationId, selectedDoc, reuploadNote);
      if (!res.success) {
        toast.error(res.error ?? "Request failed.");
      } else {
        toast.success("Re-upload request sent.");
        router.refresh();
      }
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Review Actions</h2>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={() => setAction(action === "approve" ? null : "approve")}
          disabled={loading}
          className="flex items-center gap-2 bg-[#006b2c] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#005a24] disabled:opacity-50 transition-colors"
        >
          <CheckCircle2 className="w-4 h-4" />
          Approve & Register
        </button>
        <button
          type="button"
          onClick={() => setAction(action === "reupload" ? null : "reupload")}
          disabled={loading}
          className="flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Request Re-upload
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${action === "reupload" ? "rotate-180" : ""}`} />
        </button>
        <button
          type="button"
          onClick={() => setAction(action === "reject" ? null : "reject")}
          disabled={loading}
          className="flex items-center gap-2 border border-red-300 text-red-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>

      {/* Approve confirmation */}
      {action === "approve" && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
          <p className="text-sm text-green-800">
            This will create an official Senior Citizen record in CareLink and assign an OSCA ID. The applicant can then log in using their OSCA ID and the password they chose.
          </p>
          <button
            type="button"
            onClick={handleApprove}
            disabled={loading}
            className="flex items-center gap-2 bg-[#006b2c] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#005a24] disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm Approval
          </button>
        </div>
      )}

      {/* Request re-upload */}
      {action === "reupload" && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Document to Re-upload</label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:outline-none"
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-900 mb-1">Note to Applicant *</label>
            <textarea
              rows={3}
              value={reuploadNote}
              onChange={(e) => setReuploadNote(e.target.value)}
              placeholder="e.g. The photo of the Birth Certificate is too blurry. Please take a clearer photo."
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleReupload}
            disabled={loading}
            className="flex items-center gap-2 bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Send Re-upload Request
          </button>
        </div>
      )}

      {/* Reject */}
      {action === "reject" && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-red-800 mb-1">Reason for Rejection *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Applicant does not meet age requirement based on submitted documents."
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none resize-none"
            />
          </div>
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="flex items-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Confirm Rejection
          </button>
        </div>
      )}
    </div>
  );
}
