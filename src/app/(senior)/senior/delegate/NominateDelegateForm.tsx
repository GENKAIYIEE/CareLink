"use client";

import { useState, useRef } from "react";
import { UserPlus, Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { submitDelegateRequestAction } from "@/lib/actions/delegates";
import { toast } from "sonner";

const RELATIONSHIPS = [
  "Son",
  "Daughter",
  "Spouse",
  "Sibling",
  "Grandchild",
  "Caregiver",
  "Other Relative",
] as const;

export function NominateDelegateForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [customRel, setCustomRel] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg("File exceeds 3MB limit. Please choose a smaller photo or document.");
      return;
    }

    setSelectedFile(file);
    setErrorMsg("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalRel = relationship === "Other Relative" ? customRel.trim() : relationship;

    if (!firstName.trim() || !lastName.trim() || !finalRel || !contactNumber.trim()) {
      setErrorMsg("Please fill out all required delegate details.");
      return;
    }

    if (contactNumber.trim().length < 11) {
      setErrorMsg("Please enter a valid Philippine contact number (e.g. 09123456789).");
      return;
    }

    if (!selectedFile) {
      setErrorMsg("Please upload a photo or scan of the delegate's valid ID or document.");
      return;
    }

    setIsSubmitting(true);
    const fd = new FormData();
    fd.append("firstName", firstName.trim());
    fd.append("lastName", lastName.trim());
    fd.append("relationship", finalRel);
    fd.append("contactNumber", contactNumber.trim());
    if (selectedFile) {
      fd.append("file", selectedFile);
    }

    try {
      const res = await submitDelegateRequestAction(fd);
      if (!res.success) {
        const err = res.error || "Failed to submit delegate nomination.";
        setErrorMsg(err);
        toast.error(err);
        setIsSubmitting(false);
      } else {
        toast.success("Delegate nomination submitted successfully. Awaiting OSCA review.");
        setIsSubmitting(false);
      }
    } catch {
      const err = "An unexpected connection error occurred. Please try again.";
      setErrorMsg(err);
      toast.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start gap-3 border-b border-gray-100 pb-5 mb-6">
        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg shrink-0">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nominate an Authorized Delegate</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Submit a representative to be verified by OSCA. Once approved by staff, they can assist and claim benefits on your behalf.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              First Name *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Maria"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#163d28]/30 focus:border-[#163d28] transition-colors duration-150"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Santos"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#163d28]/30 focus:border-[#163d28] transition-colors duration-150"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Relationship to Senior *
            </label>
            <select
              required
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#163d28]/30 focus:border-[#163d28] transition-colors duration-150"
            >
              <option value="">Select relationship…</option>
              {RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
            {relationship === "Other Relative" && (
              <input
                type="text"
                required
                value={customRel}
                onChange={(e) => setCustomRel(e.target.value)}
                placeholder="Specify relationship (e.g. Niece)"
                className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#163d28]/30 focus:border-[#163d28] transition-colors duration-150"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Contact Number *
            </label>
            <input
              type="tel"
              required
              maxLength={13}
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="09123456789"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#163d28]/30 focus:border-[#163d28] transition-colors duration-150"
            />
          </div>
        </div>

        {/* Upload Valid ID or Document */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Delegate Identification / Document *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload a clear photo or scan of the delegate&apos;s Valid Government ID (e.g., PhilSys, Driver&apos;s License, Voter&apos;s ID) or Barangay Certificate. Submissions with unreadable, expired, or invalid documents will be automatically rejected.
          </p>

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-emerald-600 rounded-lg p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors duration-150"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Click to select photo or document</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF up to 3MB</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-12 h-12 rounded object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center shrink-0 text-gray-600">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-200 transition-colors duration-150"
                aria-label="Remove document"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-md text-white bg-[#163d28] hover:bg-[#0f2a1b] shadow-sm disabled:opacity-50 transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#163d28]"
          >
            {isSubmitting ? "Submitting Nomination…" : "Submit Delegate for OSCA Approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
