import { getApplicationDetailAction } from "@/lib/actions/applications";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { APPLICATION_STATUS, DOCUMENT_TYPES } from "@/lib/application-documents";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Calendar, Shield } from "lucide-react";
import { ReviewPanel } from "./ReviewPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Application Review — CareLink Admin" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const result = await getApplicationDetailAction(id);

  if (!result.success || !result.application) notFound();

  const { application: app, documents, reviewerName } = result;
  const statusCfg = APPLICATION_STATUS[app.status] ?? APPLICATION_STATUS.Pending;

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => (
    value ? (
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-sm font-medium text-slate-900">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/admin/applications" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {app.firstName} {app.middleName ? `${app.middleName} ` : ""}{app.lastName}
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-mono">{app.referenceCode}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full border ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Applicant info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal details card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Personal Details
            </h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="Full Name" value={`${app.firstName} ${app.middleName ?? ""} ${app.lastName}`.trim()} />
              <InfoRow icon={Calendar} label="Date of Birth" value={format(new Date(app.dateOfBirth), "MMMM d, yyyy")} />
              <InfoRow icon={User} label="Gender" value={app.gender} />
              <InfoRow icon={User} label="Civil Status" value={app.civilStatus} />
              <InfoRow icon={MapPin} label="Barangay" value={app.barangay} />
              <InfoRow icon={Phone} label="Contact Number" value={app.contactNumber} />
              <InfoRow icon={Shield} label="Email" value={app.email} />
            </div>
          </div>

          {/* Emergency contact card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Emergency Contact
            </h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={app.emergencyContactName} />
              <InfoRow icon={Phone} label="Contact Number" value={app.emergencyContactNum} />
              <InfoRow icon={User} label="Relationship" value={app.emergencyContactRel} />
            </div>
          </div>

          {/* Submitted by */}
          {(app.submittedByName || app.submittedByRelationship) && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-3">Submitted By</h2>
              <p className="text-sm text-blue-900 font-medium">{app.submittedByName}</p>
              <p className="text-xs text-blue-700">{app.submittedByRelationship}</p>
            </div>
          )}

          {/* Review history */}
          {(app.reviewedAt || app.reviewNote) && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Review History</h2>
              {reviewerName && <p className="text-xs text-slate-500 mb-1">Reviewed by: <span className="font-medium text-slate-700">{reviewerName}</span></p>}
              {app.reviewedAt && <p className="text-xs text-slate-500 mb-2">{format(new Date(app.reviewedAt), "MMM d, yyyy h:mm a")}</p>}
              {app.reviewNote && <p className="text-sm text-slate-700 italic">"{app.reviewNote}"</p>}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-slate-400 space-y-1">
            <p>Submitted: {format(new Date(app.createdAt), "MMM d, yyyy h:mm a")}</p>
            <p>Last updated: {format(new Date(app.updatedAt), "MMM d, yyyy h:mm a")}</p>
          </div>
        </div>

        {/* Right: Documents + Review Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Documents viewer */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Submitted Documents</h2>
            </div>
            <div className="p-5 space-y-4">
              {DOCUMENT_TYPES.map((docDef) => {
                const doc = documents?.find((d: { type: string }) => d.type === docDef.id) as
                  | { type: string; status: string; note: string | null; signedUrl: string | null; mimeType: string }
                  | undefined;
                return (
                  <div key={docDef.id} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{docDef.label}</p>
                        {doc?.note && <p className="text-xs text-orange-700 mt-0.5">{doc.note}</p>}
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
                    </div>
                    <div className="p-4">
                      {!doc ? (
                        <p className="text-sm text-slate-400 italic">Not yet uploaded.</p>
                      ) : !doc.signedUrl ? (
                        <p className="text-sm text-slate-400 italic">Preview unavailable. Document URL expired — refresh the page.</p>
                      ) : doc.mimeType === "application/pdf" ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#006b2c] border border-[#006b2c] px-4 py-2 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          Open PDF Document
                        </a>
                      ) : (
                        <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.signedUrl}
                            alt={docDef.label}
                            className="max-h-48 w-full object-contain rounded-lg border border-slate-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action panel (approve, reject, request re-upload) */}
          {!["Approved", "Rejected"].includes(app.status) && (
            <ReviewPanel
              applicationId={app.id}
              applicationStatus={app.status}
              documents={documents ?? []}
            />
          )}

          {/* Approved — show senior link */}
          {app.status === "Approved" && app.seniorId && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-green-800 mb-2">Application Approved</p>
              <p className="text-sm text-green-700 mb-3">A Senior record was created successfully.</p>
              <Link
                href={`/admin/seniors/${app.seniorId}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006b2c] border border-[#006b2c] px-4 py-2 rounded-xl hover:bg-green-50 transition-colors"
              >
                View Senior Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
