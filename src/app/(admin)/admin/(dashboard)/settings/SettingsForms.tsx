'use client';

import { useActionState } from 'react';
import { updateSystemName, updateAdminPassword } from '@/lib/actions/settings';
import { Settings, Shield, Save, KeyRound } from 'lucide-react';

export default function SettingsForms({ defaultSystemName }: { defaultSystemName: string }) {
  const [systemState, systemAction, isSystemPending] = useActionState(updateSystemName, undefined);
  const [passwordState, passwordAction, isPasswordPending] = useActionState(updateAdminPassword, undefined);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* System Settings Card */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="h-10 w-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">System Settings</h3>
            <p className="text-xs font-semibold text-slate-500">General preferences</p>
          </div>
        </div>

        <form action={systemAction} className="flex flex-col gap-5">
          <div>
            <label htmlFor="systemName" className="block text-sm font-bold text-slate-700 mb-2">
              System Name
            </label>
            <input
              type="text"
              id="systemName"
              name="systemName"
              defaultValue={defaultSystemName}
              required
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-green-900 focus:ring-0 transition-colors text-slate-900 font-medium"
              placeholder="e.g. CareLink Admin"
            />
          </div>
          
          {systemState?.error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border-2 border-red-100">
              {systemState.error}
            </div>
          )}
          {systemState?.success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm font-bold rounded-lg border-2 border-green-100">
              {systemState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSystemPending}
            className="w-full h-12 bg-green-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-green-800 transition-colors disabled:opacity-70"
          >
            <Save className="h-4 w-4" />
            {isSystemPending ? 'Saving...' : 'Save System Name'}
          </button>
        </form>
      </div>

      {/* Account Security Card */}
      <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
          <div className="h-10 w-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Account Security</h3>
            <p className="text-xs font-semibold text-slate-500">Update your password</p>
          </div>
        </div>

        <form action={passwordAction} className="flex flex-col gap-5">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-bold text-slate-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-green-900 focus:ring-0 transition-colors text-slate-900 font-medium"
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-slate-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-green-900 focus:ring-0 transition-colors text-slate-900 font-medium"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 focus:border-green-900 focus:ring-0 transition-colors text-slate-900 font-medium"
            />
          </div>
          
          {passwordState?.error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm font-bold rounded-lg border-2 border-red-100">
              {passwordState.error}
            </div>
          )}
          {passwordState?.success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm font-bold rounded-lg border-2 border-green-100">
              {passwordState.success}
            </div>
          )}

          <button
            type="submit"
            disabled={isPasswordPending}
            className="w-full h-12 bg-green-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-green-800 transition-colors disabled:opacity-70"
          >
            <KeyRound className="h-4 w-4" />
            {isPasswordPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
