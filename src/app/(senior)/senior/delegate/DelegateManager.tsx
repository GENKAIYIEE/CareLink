"use client";

import { UserCheck } from "lucide-react";

export interface DelegateData {
  idPhotoUrl?: string | null;
  fullName: string;
  relationship: string;
  contactNumber: string;
  createdAt: string | Date;
}

export function DelegateManager({ delegate }: { delegate: DelegateData | null }) {
  if (!delegate) {
    return (
      <div className="p-16 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
          <UserCheck className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Delegate Assigned</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          You currently do not have an authorized delegate. Please visit your local OSCA office to assign one.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between border-b border-gray-100 pb-6 mb-6">
        <div className="flex items-center gap-4">
          {delegate.idPhotoUrl ? (
            <img src={delegate.idPhotoUrl} alt={delegate.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-16 h-16 bg-[#006b2c]/10 text-[#006b2c] rounded-full flex items-center justify-center text-xl font-bold border-2 border-[#006b2c]/20">
              {delegate.fullName[0]}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{delegate.fullName}</h2>
            <p className="text-gray-500 font-medium">Verified Delegate</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full border border-green-200">
          Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Relationship</p>
          <p className="text-lg font-medium text-gray-900 mt-1">{delegate.relationship}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Contact Number</p>
          <p className="text-lg font-medium text-gray-900 mt-1">{delegate.contactNumber}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Date Assigned</p>
          <p className="text-lg font-medium text-gray-900 mt-1">
            {new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(delegate.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}
