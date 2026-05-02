import type { Metadata } from 'next';
import LoginForm from './LoginForm';
import { ShieldCheck } from 'lucide-react';
import './admin-login.css';

export const metadata: Metadata = {
  title: 'Admin Login — CareLink',
  description:
    'Secure sign-in portal for LGU administrators of the CareLink Senior Citizen Assistance Management System.',
};

export default function AdminLoginPage() {
  return (
    <main className="admin-login-root">
      {/* Animated background orbs */}
      <div className="admin-bg-orb admin-bg-orb-1" aria-hidden="true" />
      <div className="admin-bg-orb admin-bg-orb-2" aria-hidden="true" />

      <div className="admin-login-card">
        {/* Brand Header */}
        <div className="admin-card-header">
          <div className="admin-logo-ring">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <div>
            <p className="admin-portal-label">Municipality of Agoo</p>
            <h1 className="admin-portal-title">Admin Portal</h1>
          </div>
        </div>

        {/* Divider */}
        <div className="admin-divider">
          <span>Sign in to continue</span>
        </div>

        {/* Login Form */}
        <LoginForm />

        {/* Footer note */}
        <p className="admin-footer-note">
          This portal is restricted to authorized LGU personnel only.
          <br />
          Unauthorized access is prohibited by law.
        </p>
      </div>
    </main>
  );
}
