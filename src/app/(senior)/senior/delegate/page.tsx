import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DelegateManager } from './DelegateManager';
import { NominateDelegateForm } from './NominateDelegateForm';
import { PendingDelegateCard } from './PendingDelegateCard';
import { Users, Info } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { APP_DOC_BUCKET } from '@/lib/application-documents';
import { supabaseServer } from '@/lib/supabase-server';

export default async function SeniorDelegatePage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const [senior, pendingRequest] = await Promise.all([
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
    </div>
  );
}
