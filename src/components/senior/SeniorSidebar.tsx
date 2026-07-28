'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Gift, 
  BellRing, 
  Users, 
  LogOut,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { logout } from '@/actions/auth/logout';
import LogoutModal from '@/components/auth/LogoutModal';
import NotificationBell from '@/components/shared/NotificationBell';

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
];

export default function SeniorSidebar({ senior }: SeniorSidebarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const initials = `${senior.firstName[0]}${senior.lastName[0]}`;

  return (
    <>
      {/* Mobile Top Navbar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-green-900 to-green-950 text-white flex justify-between items-center px-6 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-emerald-300" />
          </button>
          <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
            CareLink
          </span>
        </div>

        {/* Notification & Small Profile Avatar in Topbar */}
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <NotificationBell role="SENIOR" />
          </div>
          <Link href="/senior/profile" className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-white/10 overflow-hidden">
            {senior.photoUrl ? (
              <img src={senior.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white">{initials}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Backdrop Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`w-[260px] fixed top-0 left-0 h-screen bg-gradient-to-b from-green-900 to-green-950 text-white flex flex-col z-50 shadow-2xl border-r border-white/5 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header & Mobile Close Button */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl shadow-inner border border-white/5">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <span className="font-extrabold text-xl tracking-wider bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">CareLink</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <NotificationBell role="SENIOR" align="left" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/75 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="px-6 py-8 border-b border-white/5 flex flex-col items-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-3xl font-bold mb-4 shadow-xl ring-4 ring-white/10 overflow-hidden relative z-10 group cursor-pointer transition-transform duration-300 hover:scale-105">
            {senior.photoUrl ? (
              <img src={senior.photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white drop-shadow-md">{initials}</span>
            )}
          </div>
          <h3 className="font-bold text-lg text-center tracking-tight text-white relative z-10">
            {senior.firstName} {senior.lastName}
          </h3>
          <div className="mt-1 px-3 py-1 rounded-full bg-black/20 border border-white/10 flex items-center gap-2 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-xs font-semibold text-emerald-100 tracking-wider">ID: {senior.oscaId}</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {SIDEBAR_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 relative ${
                  isActive 
                    ? 'bg-white/15 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md border border-white/20 text-white translate-x-1' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-1'
                }`}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-emerald-300' : 'group-hover:scale-110 group-hover:text-emerald-300'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`font-medium tracking-wide ${isActive ? 'text-white' : ''}`}>{link.name}</span>
                
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Action */}
        <div className="p-6 border-t border-white/10 bg-black/5 mt-auto">
          <button 
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="group flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-xl bg-white/5 text-white/80 font-medium hover:bg-red-500/20 hover:text-red-200 border border-transparent hover:border-red-500/30 transition-all duration-300 shadow-sm"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="tracking-wide">Secure Logout</span>
          </button>

          <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={logout}
            portalName="Senior Portal"
            userName={`${senior.firstName} ${senior.lastName}`}
          />
        </div>
      </aside>
    </>
  );
}
