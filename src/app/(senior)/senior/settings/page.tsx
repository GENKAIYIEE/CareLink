'use client';

import React, { useActionState } from 'react';
import { changeSeniorPassword } from '@/actions/auth/changeSeniorPassword';
import { Settings, Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SeniorSettingsPage() {
  const [state, action, isPending] = useActionState(changeSeniorPassword, null);

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 text-[#006b2c] rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account preferences and security.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
          <Lock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>
        
        <div className="p-8">
          {state?.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{state.success}</p>
            </div>
          )}

          {state?.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-medium">{state.error}</p>
            </div>
          )}

          <form action={action} className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="currentPassword"
                  required
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006b2c] focus:border-[#006b2c] outline-none transition-shadow"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="newPassword"
                  required
                  minLength={8}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006b2c] focus:border-[#006b2c] outline-none transition-shadow"
                  placeholder="Min. 8 characters"
                />
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006b2c] focus:border-[#006b2c] outline-none transition-shadow"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 bg-[#006b2c] text-white font-medium rounded-lg hover:bg-[#005a25] focus:ring-4 focus:ring-green-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
