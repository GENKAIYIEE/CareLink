'use client';

import { useActionState } from 'react';
import { adminLogin, AdminLoginState } from '@/lib/actions/auth';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(
    adminLogin,
    undefined
  );

  return (
    <form action={action} className="space-y-6">
      {/* Error Banner */}
      {state?.error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertCircle size={16} className="shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 font-sans">
          Government Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Mail size={18} />
          </div>
          <input
            id="admin-email"
            name="email"
            type="text"
            placeholder="admin@agoo.gov.ph"
            autoComplete="username"
            required
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-green-700 sm:text-sm transition-colors bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 shadow-sm font-sans"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 font-sans">
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Lock size={18} />
          </div>
          <input
            id="admin-password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-700 focus:border-green-700 sm:text-sm transition-colors bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-400 shadow-sm font-sans"
          />
        </div>
      </div>

      {/* Options: Remember Me & Forgot Password */}
      <div className="flex items-center justify-between font-sans">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-green-700 focus:ring-green-700 border-gray-300 rounded cursor-pointer"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <Link href="#" className="font-medium text-green-800 hover:text-green-700 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-sans tracking-wide"
      >
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin mr-2" />
            Signing In...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}
