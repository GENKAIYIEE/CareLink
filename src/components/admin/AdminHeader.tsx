'use client';

import { Search, Globe, Accessibility, User } from 'lucide-react';

export default function AdminHeader({ systemName = 'CareLink' }: { systemName?: string }) {
  return (
    <header className="fixed top-0 z-40 bg-white border-b-2 border-slate-200 md:ml-64 md:w-[calc(100%-16rem)] flex justify-between items-center px-8 h-16 w-full">
      <div className="flex items-center gap-4">
        {/* Mobile Brand */}
        <span className="md:hidden text-2xl font-bold tracking-tight text-green-900">{systemName.replace(/ Admin$/i, '')}</span>
        
        <form 
          className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border-2 border-transparent focus-within:border-green-900 focus-within:bg-white transition-colors"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const query = formData.get('q');
            if (query) {
              window.location.href = `/admin/seniors?q=${encodeURIComponent(query.toString())}`;
            }
          }}
        >
          <Search className="text-slate-500 mr-2 h-5 w-5" />
          <input 
            suppressHydrationWarning
            name="q"
            className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 placeholder:text-slate-500 outline-none w-64" 
            placeholder="Search for senior citizens..." 
            type="text"
          />
        </form>
      </div>




    </header>
  );
}
