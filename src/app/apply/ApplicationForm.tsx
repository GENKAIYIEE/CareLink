"use client";

import { useState, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AGOO_BARANGAYS } from "@/lib/constants";
import { BarangayCombobox } from "@/components/shared/BarangayCombobox";
import { DOCUMENT_TYPES, type DocumentTypeId } from "@/lib/application-documents";
import {
  submitApplicationAction,
  uploadApplicationDocumentAction,
} from "@/lib/actions/applications";
import { Upload, CheckCircle2, Loader2, ChevronRight, ChevronLeft, Copy, Eye, EyeOff, AlertCircle, FileText } from "lucide-react";

// ─── Zod schema (client-side) ─────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 60;
  }, { message: "Applicant must be at least 60 years old." }),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  barangay: z.string().min(1, "Barangay is required"),
  contactNumber: z.string().min(11, "Valid contact number required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactNum: z.string().min(11, "Valid contact number required"),
  emergencyContactRel: z.string().min(1, "Relationship is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  submittedByName: z.string().optional(),
  submittedByRelationship: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Personal Info",     key: "personal"   },
  { title: "Health & Emergency", key: "emergency" },
  { title: "Documents",          key: "documents"  },
  { title: "Submitted",          key: "success"    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ApplicationForm() {
  const [step, setStep] = useState(0);
  const [barangay, setBarangay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // ── Step 1: Submit personal+emergency info, get applicationId ────────────

  const onSubmitForm: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && k !== "confirmPassword") fd.append(k, String(v));
      });
      fd.set("barangay", barangay);

      const result = await submitApplicationAction(fd);
      if (!result.success) {
        toast.error(result.error ?? "Submission failed.");
        return;
      }
      setReferenceCode(result.referenceCode!);
      setApplicationId(result.applicationId!);
      setStep(2); // go to document upload step
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step 2: Upload each document ─────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentTypeId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side quick size check (3MB images, 2MB PDF)
    const isPdf = file.type === "application/pdf";
    const limit = isPdf ? 2 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > limit) {
      toast.error(`File too large. Limit: ${isPdf ? "2 MB for PDFs" : "3 MB for images"}.`);
      e.target.value = "";
      return;
    }

    setUploadingDoc(docType);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadApplicationDocumentAction(applicationId, docType, fd);
      if (!result.success) {
        toast.error(result.error ?? "Upload failed.");
        e.target.value = "";
      } else {
        setUploadedDocs((prev) => ({ ...prev, [docType]: true }));
        toast.success("Document uploaded successfully.");
      }
    } finally {
      setUploadingDoc(null);
    }
  };

  const allDocsUploaded = DOCUMENT_TYPES.every((d) => uploadedDocs[d.id]);

  const handleFinish = () => setStep(3);

  // ── Step navigation ───────────────────────────────────────────────────────

  const goNext = async () => {
    const fieldsStep0: (keyof FormData)[] = [
      "firstName", "lastName", "dateOfBirth", "gender", "civilStatus", "barangay",
      "contactNumber", "password", "confirmPassword",
    ];
    const fieldsStep1: (keyof FormData)[] = [
      "emergencyContactName", "emergencyContactNum", "emergencyContactRel",
    ];

    if (step === 0) {
      if (!barangay) { toast.error("Please select a barangay."); return; }
      setValue("barangay", barangay);
      const ok = await trigger(fieldsStep0);
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await trigger(fieldsStep1);
      if (!ok) { return; }
      // Step 1 is the last form step — trigger submission
      await handleSubmit(onSubmitForm)();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const field = (id: string, label: string, node: React.ReactNode, error?: string) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {node}
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#006b2c]/40 focus:border-[#006b2c] transition-colors"
    />
  );

  const select = (props: React.SelectHTMLAttributes<HTMLSelectElement>, children: React.ReactNode) => (
    <select
      {...props}
      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2c]/40 focus:border-[#006b2c] transition-colors"
    >
      {children}
    </select>
  );

  // ── Step 0: Personal Info ─────────────────────────────────────────────────

  const Step0 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field("firstName", "First Name *", input({ id: "firstName", placeholder: "Juan", ...register("firstName") }), errors.firstName?.message)}
        {field("middleName", "Middle Name", input({ id: "middleName", placeholder: "(Optional)", ...register("middleName") }))}
        {field("lastName", "Last Name *", input({ id: "lastName", placeholder: "Dela Cruz", ...register("lastName") }), errors.lastName?.message)}
        {field("dateOfBirth", "Date of Birth *",
          input({ id: "dateOfBirth", type: "date", ...register("dateOfBirth") }),
          errors.dateOfBirth?.message
        )}
        {field("gender", "Gender *", (
          select({ id: "gender", ...register("gender") }, (
            <>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </>
          ))
        ), errors.gender?.message)}
        {field("civilStatus", "Civil Status *", (
          select({ id: "civilStatus", ...register("civilStatus") }, (
            <>
              <option value="">Select status</option>
              {["Single","Married","Widowed","Separated","Divorced"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </>
          ))
        ), errors.civilStatus?.message)}
      </div>

      {field("barangay", "Barangay *", (
        <BarangayCombobox
          value={barangay}
          onChange={(v) => { setBarangay(v); setValue("barangay", v); }}
        />
      ), errors.barangay?.message)}

      {field("contactNumber", "Contact Number *",
        input({ id: "contactNumber", placeholder: "09XXXXXXXXX", maxLength: 11, ...register("contactNumber") }),
        errors.contactNumber?.message
      )}
      {field("email", "Email Address (optional)",
        input({ id: "email", type: "email", placeholder: "example@gmail.com", ...register("email") }),
        errors.email?.message
      )}

      {/* Submitted-by section */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Submitted By (if not the applicant)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("submittedByName", "Your Full Name",
            input({ id: "submittedByName", placeholder: "e.g. Maria Dela Cruz", ...register("submittedByName") })
          )}
          {field("submittedByRelationship", "Your Relationship to Applicant",
            input({ id: "submittedByRelationship", placeholder: "e.g. Daughter, Son", ...register("submittedByRelationship") })
          )}
        </div>
      </div>

      {/* Portal password */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Create Portal Password</p>
        <p className="text-xs text-slate-500 mb-3">This password will be used to log in to the Senior Portal after approval.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("password", "Password *", (
            <div className="relative">
              {input({ id: "password", type: showPassword ? "text" : "password", placeholder: "Min. 8 characters", ...register("password") })}
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ), errors.password?.message)}
          {field("confirmPassword", "Confirm Password *",
            input({ id: "confirmPassword", type: "password", placeholder: "Repeat password", ...register("confirmPassword") }),
            errors.confirmPassword?.message
          )}
        </div>
      </div>
    </div>
  );

  // ── Step 1: Emergency Contact ─────────────────────────────────────────────

  const Step1 = () => (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-slate-700 mb-3">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("emergencyContactName", "Full Name *",
            input({ id: "emergencyContactName", placeholder: "e.g. Maria Dela Cruz", ...register("emergencyContactName") }),
            errors.emergencyContactName?.message
          )}
          {field("emergencyContactNum", "Contact Number *",
            input({ id: "emergencyContactNum", placeholder: "09XXXXXXXXX", maxLength: 11, ...register("emergencyContactNum") }),
            errors.emergencyContactNum?.message
          )}
          {field("emergencyContactRel", "Relationship *",
            input({ id: "emergencyContactRel", placeholder: "e.g. Daughter, Son, Spouse", ...register("emergencyContactRel") }),
            errors.emergencyContactRel?.message
          )}
        </div>
      </div>
    </div>
  );

  // ── Step 2: Document Upload ───────────────────────────────────────────────

  const Step2 = () => (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-amber-800 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>Your reference code is <strong className="font-mono">{referenceCode}</strong>. Save this — you will need it to track your application.</span>
      </div>

      {DOCUMENT_TYPES.map((doc) => {
        const isDone = uploadedDocs[doc.id];
        const isLoading = uploadingDoc === doc.id;
        return (
          <div key={doc.id} className={`border rounded-xl p-4 transition-colors ${isDone ? "border-green-300 bg-green-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {doc.label} {doc.required && <span className="text-red-500">*</span>}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
              </div>
              {isDone && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
            </div>

            <div className="mt-3">
              <input
                ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => handleFileChange(e, doc.id as DocumentTypeId)}
                id={`file-${doc.id}`}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => fileInputRefs.current[doc.id]?.click()}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                  isDone
                    ? "border-green-400 text-green-700 hover:bg-green-100"
                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isDone ? "Re-upload" : "Upload File"}
              </button>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP, or PDF. Max 3 MB (2 MB for PDF).</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Step 3: Success ───────────────────────────────────────────────────────

  const Step3 = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-9 h-9 text-green-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Application Submitted!</h2>
      <p className="text-slate-600 text-sm mb-6">
        Your application has been received. OSCA staff will review your documents and update your status.
      </p>

      <div className="inline-block bg-slate-100 border border-slate-300 rounded-xl px-6 py-4 mb-6">
        <p className="text-xs text-slate-500 mb-1">Your Reference Code</p>
        <p className="text-2xl font-mono font-bold text-slate-900 tracking-widest">{referenceCode}</p>
        <button
          type="button"
          onClick={() => { navigator.clipboard.writeText(referenceCode); toast.success("Copied!"); }}
          className="flex items-center gap-1 text-xs text-[#006b2c] mx-auto mt-2 hover:underline"
        >
          <Copy className="w-3 h-3" /> Copy code
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Save your reference code and check your application status anytime at:
      </p>
      <a
        href="/apply/track"
        className="inline-flex items-center gap-2 bg-[#006b2c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#005a24] transition-colors"
      >
        <FileText className="w-4 h-4" />
        Track My Application
      </a>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Step indicator */}
      {step < 3 && (
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  i < step ? "bg-[#006b2c] border-[#006b2c] text-white"
                  : i === step ? "border-[#006b2c] text-[#006b2c]"
                  : "border-slate-300 text-slate-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${i === step ? "text-[#006b2c]" : "text-slate-400"}`}>
                  {s.title}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form content */}
      <div className="p-6">
        {step === 0 && <Step0 />}
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="border-t border-slate-100 px-6 py-4 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step === 2 ? (
            <button
              type="button"
              onClick={handleFinish}
              disabled={!allDocsUploaded}
              className="flex items-center gap-2 bg-[#006b2c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#005a24] disabled:opacity-40 transition-colors"
            >
              Finish & View Code
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#006b2c] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#005a24] disabled:opacity-40 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {step === 1 ? "Submit Application" : "Next"}
              {!isSubmitting && step !== 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
