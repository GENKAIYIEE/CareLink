import { ReactNode } from 'react';
import { LogOut, HeartPulse } from 'lucide-react';
import { logout } from '@/lib/actions/auth';

export default function SeniorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b-4 border-rose-600 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 p-2 rounded-full">
              <HeartPulse className="h-8 w-8 text-rose-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                CareLink
              </h1>
              <span className="text-sm font-bold text-rose-600">Senior Citizen Portal</span>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 font-medium">
          <p>CareLink Municipal System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
