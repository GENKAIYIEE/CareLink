"use client";

import { useState } from "react";
import { Users, Edit2, Trash2, Plus, UserCheck, X, Clock, Check, ExternalLink } from "lucide-react";
import {
  createDelegateAction,
  updateDelegateAction,
  deleteDelegateAction,
  approveDelegateRequestAction,
  rejectDelegateRequestAction,
} from "@/lib/actions/delegates";
import { toast } from "sonner";

type Delegate = {
  id: string;
  fullName: string;
  relationship: string;
  contactNumber: string;
} | null;

export type PendingDelegateRequest = {
  id: string;
  fullName: string;
  relationship: string;
  contactNumber: string;
  documentUrl: string | null;
  signedDocumentUrl: string | null;
  createdAt: Date | string;
} | null;

export default function DelegateSection({
  seniorId,
  initialDelegate,
  pendingRequest,
}: {
  seniorId: string;
  initialDelegate: Delegate;
  pendingRequest?: PendingDelegateRequest;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const splitName = (fullName: string) => {
    const parts = fullName.split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    const last = parts.pop() || "";
    const first = parts.join(" ");
    return { first, last };
  };

  const nameParts = initialDelegate ? splitName(initialDelegate.fullName) : { first: "", last: "" };

  const [formData, setFormData] = useState({
    firstName: nameParts.first,
    lastName: nameParts.last,
    relationship: initialDelegate?.relationship || "",
    contactNumber: initialDelegate?.contactNumber || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const data = new FormData();
    data.append("seniorId", seniorId);
    data.append("firstName", formData.firstName);
    data.append("lastName", formData.lastName);
    data.append("relationship", formData.relationship);
    data.append("contactNumber", formData.contactNumber);

    try {
      if (initialDelegate) {
        data.append("delegateId", initialDelegate.id);
        const res = await updateDelegateAction(data);
        if (res.success) {
          setSuccessMsg("Delegate updated successfully.");
          toast.success("Delegate updated successfully.");
          setIsEditing(false);
        } else {
          const err = res.error || "Failed to update delegate.";
          setErrorMsg(err);
          toast.error(err);
        }
      } else {
        const res = await createDelegateAction(data);
        if (res.success) {
          setSuccessMsg("Delegate assigned successfully.");
          toast.success("Delegate assigned successfully.");
          setIsEditing(false);
        } else {
          const err = res.error || "Failed to assign delegate.";
          setErrorMsg(err);
          toast.error(err);
        }
      }
    } catch {
      const err = "An unexpected error occurred.";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialDelegate) return;
    if (!confirm("Are you sure you want to remove this delegate? This action cannot be undone.")) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await deleteDelegateAction(initialDelegate.id, seniorId);
      if (res.success) {
        setSuccessMsg("Delegate removed successfully.");
        toast.success("Delegate removed successfully.");
      } else {
        const err = res.error || "Failed to remove delegate. Note: Only SuperAdmins can delete delegates.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      const err = "An unexpected error occurred.";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!pendingRequest) return;
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await approveDelegateRequestAction(pendingRequest.id);
      if (res.success) {
        setSuccessMsg("Delegate nomination approved successfully.");
        toast.success("Delegate nomination approved successfully.");
      } else {
        const err = res.error || "Failed to approve delegate.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      const err = "Failed to approve delegate request.";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!pendingRequest) return;
    const reason = prompt("Enter a reason for rejecting this nomination (optional):");
    if (reason === null) return;
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await rejectDelegateRequestAction(pendingRequest.id, reason.trim() || undefined);
      if (res.success) {
        setSuccessMsg("Delegate nomination rejected.");
        toast.success("Delegate nomination rejected.");
      } else {
        const err = res.error || "Failed to reject delegate.";
        setErrorMsg(err);
        toast.error(err);
      }
    } catch {
      const err = "Failed to reject delegate request.";
      setErrorMsg(err);
      toast.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
          <Users className="w-4 h-4 mr-2 text-indigo-600" /> {initialDelegate ? "Edit Delegate" : "Assign Delegate"}
        </h3>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100 relative">
          <button
            onClick={() => setIsEditing(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                className="w-full border p-2 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                className="w-full border p-2 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Dela Cruz"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <input
                className="w-full border p-2 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="e.g. Son, Daughter, Spouse"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                className="w-full border p-2 rounded-lg focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="09XX XXX XXXX"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-md border border-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-70 flex items-center"
              >
                {isSubmitting ? "Saving..." : "Save Delegate"}
              </button>
            </div>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between border-b pb-2 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center">
          <Users className="w-4 h-4 mr-2 text-indigo-600" /> Authorized Delegate
        </h3>
        {!initialDelegate && (
          <button
            onClick={() => {
              setFormData({ firstName: "", lastName: "", relationship: "", contactNumber: "" });
              setIsEditing(true);
            }}
            className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3 h-3 mr-1" /> Assign
          </button>
        )}
      </div>

      <div className="">
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200">
            {errorMsg}
          </div>
        )}

        {pendingRequest && (
          <div className="mb-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-700" /> Pending Nomination from Senior
              </div>
              <span className="text-[11px] text-amber-700 font-medium">
                {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(pendingRequest.createdAt))}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 mt-1">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{pendingRequest.fullName}</h4>
                <p className="text-xs text-gray-700 mt-0.5 font-medium">
                  {pendingRequest.relationship} · {pendingRequest.contactNumber}
                </p>
              </div>
              {pendingRequest.signedDocumentUrl && (
                <a
                  href={pendingRequest.signedDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-900 hover:bg-amber-100/50 transition-colors duration-150 shrink-0"
                >
                  <span>View ID / Doc</span>
                  <ExternalLink className="w-3 h-3 text-amber-700" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-amber-200/70">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApproveRequest}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded transition-colors duration-150 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? "Approving…" : "Approve as Delegate"}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRejectRequest}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded transition-colors duration-150 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          </div>
        )}

        {initialDelegate ? (
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                {initialDelegate.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-gray-900 truncate">{initialDelegate.fullName}</h4>
                <div className="flex flex-col mt-0.5 text-sm text-indigo-900/80">
                  <span className="font-medium">{initialDelegate.relationship}</span>
                  <span>{initialDelegate.contactNumber}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/50 mt-1">
              <button
                onClick={() => {
                  const parts = splitName(initialDelegate.fullName);
                  setFormData({
                    firstName: parts.first,
                    lastName: parts.last,
                    relationship: initialDelegate.relationship,
                    contactNumber: initialDelegate.contactNumber,
                  });
                  setIsEditing(true);
                }}
                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-100/50 hover:bg-indigo-200/50 rounded transition-colors"
              >
                <Edit2 className="w-3 h-3 mr-1.5" /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="flex-1 inline-flex items-center justify-center px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors disabled:opacity-70"
              >
                <Trash2 className="w-3 h-3 mr-1.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
            <p className="text-sm text-gray-500 italic">No delegate assigned.</p>
          </div>
        )}
      </div>
    </section>
  );
}
