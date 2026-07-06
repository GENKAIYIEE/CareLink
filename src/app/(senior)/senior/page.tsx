import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, HeartPulse, FileText, UserCircle } from 'lucide-react';

export default function SeniorLandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
              <Image src="/images/logo-agoo.jpg" alt="Agoo Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">CareLink</h1>
              <p className="text-gray-500 text-xs mt-1">Senior Portal</p>
            </div>
          </Link>
          <Link href="/senior/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
            Log In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid md:grid-cols-2">
              <div className="p-10 md:p-12 flex flex-col justify-center bg-indigo-900 text-white relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
                
                <h2 className="text-3xl font-bold mb-4 relative z-10">Welcome to Your Senior Portal</h2>
                <p className="text-indigo-100 text-lg mb-8 relative z-10 leading-relaxed">
                  Easily view your upcoming benefit distributions, track your past claims, and manage your authorized delegate securely.
                </p>
                <Link href="/senior/login" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-indigo-900 bg-white hover:bg-indigo-50 transition-colors shadow-sm relative z-10 w-max">
                  Login to Portal <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>

              <div className="p-10 md:p-12 bg-white flex flex-col justify-center">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <UserCircle className="w-5 h-5 mr-2 text-indigo-600" />
                  How to Access
                </h3>
                
                <div className="space-y-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">1</div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Your OSCA ID</h4>
                      <p className="mt-1 text-sm text-gray-500">Enter your official OSCA ID Number as your username.</p>
                    </div>
                  </div>

                  <div className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold">2</div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900">Your Password</h4>
                      <p className="mt-1 text-sm text-gray-500">Use the unique password provided on your CareLink welcome slip during registration.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Lost your password? Please visit the MSWDO at the Agoo Municipal Hall to request a password reset.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          <p>© 2026 CareLink. Municipality of Agoo, La Union.</p>
        </div>
      </footer>
    </div>
  );
}
