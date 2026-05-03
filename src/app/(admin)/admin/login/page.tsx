import type { Metadata } from 'next';
import LoginForm from './LoginForm';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Admin Login — CareLink',
  description:
    'Secure sign-in portal for LGU administrators of the CareLink Senior Citizen Assistance Management System.',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f1f18] p-4 relative overflow-hidden">
      {/* Ambient background blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#1a4a30]/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#0d3321]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[980px] min-h-[580px] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_32px_80px_rgba(0,0,0,0.6)]">

        {/* ── LEFT BRANDING PANEL ── */}
        <div className="relative flex flex-col justify-between w-full md:w-[42%] bg-[#163d28] p-8 md:p-10 overflow-hidden">
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
          />
          {/* Glow accent */}
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-[#2d7a50]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-[#1a4a30]/50 rounded-full blur-2xl pointer-events-none" />

          {/* Top — LGU badge */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/20 overflow-hidden shrink-0">
              <Image
                src="/images/logo-agoo.jpg"
                alt="Municipal Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-white/90 text-[13px] font-semibold tracking-wide">Municipality of Agoo</p>
              <p className="text-white/50 text-[11px] tracking-wider uppercase">La Union</p>
            </div>
          </div>

          {/* Center — CareLink brand */}
          <div className="relative z-10 flex flex-col items-start gap-5 my-10">
            {/* Icon badge */}
            <div className="w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-9 h-9">
                <path
                  d="M24 40s-16-9.6-16-22a10 10 0 0 1 16-8 10 10 0 0 1 16 8c0 12.4-16 22-16 22z"
                  fill="none"
                  stroke="#6ee7b7"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <line x1="24" y1="18" x2="24" y2="30" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="18" y1="24" x2="30" y2="24" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none">
                CareLink
              </h1>
              <p className="mt-3 text-white/50 text-sm leading-relaxed max-w-[220px]">
                Senior Citizen Assistance<br />Management System
              </p>
            </div>

            {/* Decorative pill tags */}
            <div className="flex flex-wrap gap-2 mt-2">
              {['Health', 'Social', 'Benefits'].map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/10 text-emerald-200/80 ring-1 ring-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom — footer */}
          <div className="relative z-10 text-[11px] text-white/30 leading-relaxed">
            © 2026 CareLink · Municipality of Agoo, La Union<br />
            Powered by LGU Agoo
          </div>
        </div>

        {/* ── RIGHT AUTH PANEL ── */}
        <div className="relative flex flex-col justify-center w-full md:w-[58%] bg-[#1c2e24] px-8 py-10 md:px-14 md:py-12 overflow-hidden">
          {/* Subtle top-right glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2d7a50]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col gap-7">

            {/* Header */}
            <div>
              <p className="text-emerald-400/70 text-xs font-semibold tracking-[0.15em] uppercase mb-2">
                Secure Portal
              </p>
              <h2 className="text-3xl font-bold text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-white/40 text-sm mt-1">
                Sign in to your administrator account
              </p>
            </div>

            {/* Form */}
            <LoginForm />

            {/* Footer links */}
            <div className="flex flex-col items-center gap-4 pt-2 border-t border-white/5">
              <p className="text-white/40 text-xs text-center">
                Don't have an account?{' '}
                <a href="#" className="text-emerald-400/80 hover:text-emerald-400 underline underline-offset-2 transition-colors">
                  Register Now
                </a>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-white/25">
                <a href="#" className="hover:text-white/50 transition-colors">Terms & Services</a>
                <span>·</span>
                <a href="mailto:support@carelink.agoo.ph" className="hover:text-white/50 transition-colors">
                  support@carelink.agoo.ph
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
