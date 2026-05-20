'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Gift, 
  BellRing, 
  Users, 
  Settings, 
  LogOut,
  ShieldCheck 
} from 'lucide-react';
import { logout } from '@/actions/auth/logout';

interface SeniorSidebarProps {
  senior: {
    firstName: string;
    lastName: string;
    oscaId: string;
    photoUrl?: string | null;
  };
}

const SIDEBAR_LINKS = [
  { name: 'Dashboard', href: '/senior/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', href: '/senior/profile', icon: User },
  { name: 'My Benefits', href: '/senior/benefits', icon: Gift },
  { name: 'Announcements', href: '/senior/announcements', icon: BellRing },
  { name: 'My Delegate', href: '/senior/delegate', icon: Users },
  { name: 'Settings', href: '/senior/settings', icon: Settings },
];

export default function SeniorSidebar({ senior }: SeniorSidebarProps) {
  const pathname = usePathname();
  const initials = `${senior.firstName[0]}${senior.lastName[0]}`;

  return (
    <aside className="w-[240px] fixed top-0 left-0 h-screen bg-[#006b2c] text-white flex flex-col z-50">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
        <ShieldCheck className="w-6 h-6 text-white" />
        <span className="font-bold text-lg tracking-wide text-white">CareLink</span>
      </div>

      {/* Profile Section */}
      <div className="p-6 border-b border-white/10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3 overflow-hidden border-2 border-white/30">
          {senior.photoUrl ? (
            <img src={senior.photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <h3 className="font-semibold text-center">{senior.firstName} {senior.lastName}</h3>
        <p className="text-sm text-white/70">ID: {senior.oscaId}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {SIDEBAR_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-[#00873a] text-white font-medium' 
                  : 'text-white/80 hover:bg-[#00873a]/50 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <button 
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
