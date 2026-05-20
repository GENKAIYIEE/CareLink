import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Users, Info, UserCheck } from 'lucide-react';

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
        {senior.delegate ? (
          <div className="p-8">
            <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#006b2c]/10 text-[#006b2c] rounded-full flex items-center justify-center text-xl font-bold border-2 border-[#006b2c]/20">
                  {senior.delegate.fullName[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{senior.delegate.fullName}</h2>
                  <p className="text-gray-500 font-medium">Authorized Delegate</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Relationship</p>
                <p className="text-lg font-medium text-gray-900 mt-1">{senior.delegate.relationship}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Contact Number</p>
                <p className="text-lg font-medium text-gray-900 mt-1">{senior.delegate.contactNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Date Assigned</p>
                <p className="text-lg font-medium text-gray-900 mt-1">
                  {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(senior.delegate.createdAt))}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <UserCheck className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Delegate Assigned</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You currently do not have an authorized delegate. A delegate can claim benefits on your behalf if you are unable to do so.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
