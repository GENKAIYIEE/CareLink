import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { DelegateManager } from './DelegateManager';
import { Users, Info, UserCheck } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';

export default async function SeniorDelegatePage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
    include: {
      delegate: true,
    },
  });

  if (!senior) return null;

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
          <p className="font-semibold mb-1">Delegate assignments are managed by your OSCA office.</p>
          <p className="text-blue-700/80">If you wish to add, update, or remove your authorized delegate, please visit your local OSCA office with the necessary requirements and identification.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DelegateManager delegate={senior.delegate} />
      </div>
    </div>
  );
}
