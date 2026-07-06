import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, HeartPulse, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-[#163d28] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/images/logo-agoo.jpg" alt="Agoo Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none">CareLink</h1>
              <p className="text-emerald-200 text-xs mt-1">Municipality of Agoo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#163d28 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            Senior Citizen Assistance <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">Management System</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            A centralized platform designed to streamline benefit distribution, track claims, and manage profiles for the senior citizens of Agoo, La Union.
          </p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/login" className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-green-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Administrator Portal</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">For MSWDO staff to manage programs, seniors, and claims.</p>
              <div className="flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700">
                Sign In <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/senior" className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <HeartPulse className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Senior Citizen Portal</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">For registered seniors to view their benefits and manage delegates.</p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                Access Portal <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500">
          <p>© 2026 CareLink. Municipality of Agoo, La Union.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <a href="mailto:support@carelink.agoo.ph" className="hover:text-gray-900 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
