'use client';

import { Search, Globe, Accessibility, User } from 'lucide-react';

export default function AdminHeader() {
  return (
    <header className="fixed top-0 z-40 bg-white border-b-2 border-slate-200 md:ml-64 md:w-[calc(100%-16rem)] flex justify-between items-center px-8 h-16 w-full">
      <div className="flex items-center gap-4">
        {/* Mobile Brand */}
        <span className="md:hidden text-2xl font-bold tracking-tight text-green-900">CareLink</span>
        
        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border-2 border-transparent focus-within:border-green-900 focus-within:bg-white transition-colors">
          <Search className="text-slate-500 mr-2 h-5 w-5" />
          <input 
            suppressHydrationWarning
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-500 outline-none w-64" 
            placeholder="Search..." 
            type="text"
          />
        </div>
      </div>



      <div className="flex items-center gap-3 text-green-900">
        <button suppressHydrationWarning aria-label="Language" className="hover:bg-slate-100 transition-colors p-2 rounded-full flex items-center justify-center">
          <Globe className="h-5 w-5" />
        </button>
        <button suppressHydrationWarning aria-label="Accessibility" className="hover:bg-slate-100 transition-colors p-2 rounded-full flex items-center justify-center">
          <Accessibility className="h-5 w-5" />
        </button>
        <div className="h-10 w-10 bg-green-900 text-white rounded-full flex items-center justify-center overflow-hidden border-2 border-green-900 ml-1">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}
