import type { Metadata } from 'next';
import Image from 'next/image';
import LoginForm from './LoginForm';
import { Hospital, Settings, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Login — CareLink',
  description:
    'Secure sign-in portal for LGU administrators of the CareLink Senior Citizen Assistance Management System.',
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-gray-50 font-sans">
      {/* Left Side - LGU Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-green-950 overflow-hidden">
        <Image 
          src="/images/agoo.png" 
          alt="Municipality of Agoo Hall"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="absolute bottom-12 left-12 right-12 bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-white shadow-2xl z-20">
          <h3 className="font-serif font-semibold text-2xl mb-3">Institutional Assurance</h3>
          <p className="text-sm text-gray-200 leading-relaxed">
            Providing secure, reliable access to official public welfare and administrative services.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* LGU Header — pinned to top */}
        <div className="flex items-center gap-2 px-10 pt-6 pb-4 text-green-800">
          <Landmark size={22} className="text-green-700" />
          <span className="font-semibold tracking-widest text-base uppercase">Local Government Unit</span>
        </div>

        {/* Login Card — centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-8 py-6">
          <div className="max-w-md w-full p-8 sm:p-10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-2xl border border-gray-100 bg-white relative">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="h-20 w-20 bg-gradient-to-br from-green-50 to-white rounded-2xl flex items-center justify-center mb-6 relative group shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-green-100/50">
                  <Hospital className="text-green-700 h-11 w-11" strokeWidth={1.25} />
                  <div className="absolute -bottom-1.5 -right-1.5 bg-white rounded-xl p-1.5 shadow-lg border border-green-50">
                    <Settings className="text-green-600 h-5 w-5" strokeWidth={2} />
                  </div>
                </div>
                <h1 className="font-serif text-4xl font-bold text-green-900 tracking-tight">CareLink</h1>
              <p className="font-sans text-sm text-gray-500 mt-2">
                Enter your credentials to access the administrative dashboard.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500 text-center leading-relaxed">
              This system is for the exclusive use of authorized personnel of the Municipality of Agoo. Unauthorized access is strictly prohibited and subject to legal action.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
