'use client';

import { useActionState } from 'react';
import { adminLogin, AdminLoginState } from '@/lib/actions/auth';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(
    adminLogin,
    undefined
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5 w-full">

      {/* Error Banner */}
      {state?.error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300"
          role="alert"
        >
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-email"
          className="text-[12px] font-semibold text-white/50 uppercase tracking-widest"
        >
          Username
        </label>
        <input
          id="admin-email"
          name="email"
          type="text"
          placeholder="Enter your username"
          autoComplete="username"
          required
          suppressHydrationWarning
          className="
            w-full px-4 py-3 rounded-xl
            bg-white/5 border border-white/10
            text-white text-sm placeholder:text-white/20
            focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40
            transition-all duration-200
          "
        />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="admin-password"
            className="text-[12px] font-semibold text-white/50 uppercase tracking-widest"
          >
            Password
          </label>
          <Link
            href="#"
            className="text-[11px] text-emerald-400/60 hover:text-emerald-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            suppressHydrationWarning
            className="
              w-full px-4 py-3 pr-11 rounded-xl
              bg-white/5 border border-white/10
              text-white text-sm placeholder:text-white/20
              focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40
              transition-all duration-200
            "
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            suppressHydrationWarning
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        id="login-submit-btn"
        disabled={pending}
        suppressHydrationWarning
        className="
          relative mt-1 w-full py-3 px-6 rounded-xl
          bg-emerald-600 hover:bg-emerald-500
          text-white text-sm font-semibold tracking-wide
          shadow-[0_4px_20px_rgba(16,185,129,0.25)]
          hover:shadow-[0_4px_28px_rgba(16,185,129,0.4)]
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-[#1c2e24]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          overflow-hidden group
        "
      >
        {/* Shimmer */}
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <span className="relative flex items-center justify-center gap-2">
          {pending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign in to CareLink'
          )}
        </span>
      </button>
    </form>
  );
}
