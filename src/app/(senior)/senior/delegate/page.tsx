import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DelegateManager } from './DelegateManager';
import { NominateDelegateForm } from './NominateDelegateForm';
import { PendingDelegateCard } from './PendingDelegateCard';
import { Users, Info, FileText, ExternalLink, CheckCircle2 } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { DOCUMENT_TYPES, APP_DOC_BUCKET } from '@/lib/application-documents';
import { supabaseServer } from '@/lib/supabase-server';

export default async function SeniorDelegatePage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const [senior, pendingRequest, application] = await Promise.all([
    prisma.senior.findUnique({
      where: { id: session.userId },
      include: {
        delegate: true,
      },
    }),
    prisma.delegateRequest.findFirst({
      where: { seniorId: session.userId, status: 'Pending' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.application.findUnique({
      where: { seniorId: session.userId },
      include: {
        documents: true,
      },
    }),
  ]);

  if (!senior) return null;

  // Generate 1-hour signed URL for pending delegate document if present
  let signedDocUrl: string | null = null;
  if (pendingRequest?.documentUrl) {
    const { data } = await supabaseServer.storage
      .from(APP_DOC_BUCKET)
      .createSignedUrl(pendingRequest.documentUrl, 3600);
    signedDocUrl = data?.signedUrl ?? null;
  }

  // Generate 1-hour signed URLs for any uploaded application documents
  const documentsWithUrls = application
    ? await Promise.all(
        application.documents.map(async (doc) => {
          const { data } = await supabaseServer.storage
            .from(APP_DOC_BUCKET)
            .createSignedUrl(doc.storagePath, 3600);
          return {
            ...doc,
            signedUrl: data?.signedUrl ?? null,
          };
        })
      )
    : [];

  const typeMap = new Map<string, (typeof DOCUMENT_TYPES)[number]>(
    DOCUMENT_TYPES.map((t) => [t.id, t])
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <LiveUpdate interval={30000} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 text-[#006b2c] rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Delegate</h1>
            <p className="text-gray-500 text-sm mt-1">Authorized representative for your benefits.</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">Delegate authorization policy</p>
          <p className="text-blue-700/80">
            Authorized delegates can represent you and claim benefits on your behalf. All nominations are reviewed and verified by the OSCA office before approval.
          </p>
        </div>
      </div>

      {/* Main Delegate Section: Active | Pending Review | Nomination Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {senior.delegate ? (
          <DelegateManager delegate={senior.delegate} />
        ) : pendingRequest ? (
          <PendingDelegateCard
            request={{
              id: pendingRequest.id,
              fullName: pendingRequest.fullName,
              relationship: pendingRequest.relationship,
              contactNumber: pendingRequest.contactNumber,
              documentUrl: pendingRequest.documentUrl,
              signedDocumentUrl: signedDocUrl,
              createdAt: pendingRequest.createdAt,
            }}
          />
        ) : (
          <NominateDelegateForm />
        )}
      </div>

      {/* Verified Application Documents Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Application Documents</h2>
              <p className="text-xs text-gray-500">
                {application
                  ? `Uploaded for reference code ${application.referenceCode}`
                  : "Walk-in registration records"}
              </p>
            </div>
          </div>
          {application && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified by OSCA
            </span>
          )}
        </div>

        {documentsWithUrls.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            No digital application documents on file. (Physical records are maintained at the OSCA office).
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documentsWithUrls.map((doc) => {
              const meta = typeMap.get(doc.type);
              const label = meta?.label ?? doc.type;
              const desc = meta?.description ?? "";
              const sizeKb = Math.round(doc.sizeBytes / 1024);

              return (
                <li key={doc.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors duration-150">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{desc}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">
                      {doc.mimeType} · {sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`}
                    </p>
                  </div>
                  <div>
                    {doc.signedUrl ? (
                      <a
                        href={doc.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-150"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
