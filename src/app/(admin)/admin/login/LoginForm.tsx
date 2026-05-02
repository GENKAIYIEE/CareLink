'use client';

import { useActionState } from 'react';
import { adminLogin, AdminLoginState } from '@/lib/actions/auth';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(
    adminLogin,
    undefined
  );

  return (
    <form action={action} className="admin-login-form">
      {/* Error Banner */}
      {state?.error && (
        <div className="admin-error-banner" role="alert">
          <AlertCircle size={16} />
          <span>{state.error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="admin-field-group">
        <label htmlFor="admin-email" className="admin-label">
          Email Address
        </label>
        <div className="admin-input-wrapper">
          <Mail className="admin-input-icon" size={18} />
          <input
            id="admin-email"
            name="email"
            type="text"
            placeholder="Username or Email"
            autoComplete="username"
            required
            className="admin-input"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="admin-field-group">
        <label htmlFor="admin-password" className="admin-label">
          Password
        </label>
        <div className="admin-input-wrapper">
          <Lock className="admin-input-icon" size={18} />
          <input
            id="admin-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            className="admin-input"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        id="admin-login-submit"
        type="submit"
        disabled={pending}
        className="admin-submit-btn"
      >
        {pending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Signing In…</span>
          </>
        ) : (
          <>
            <ShieldCheck size={18} />
            <span>Sign In to Portal</span>
          </>
        )}
      </button>
    </form>
  );
}
