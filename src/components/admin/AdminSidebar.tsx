'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCheck,
  CreditCard,
  CalendarDays,
  BarChart2,
  History,
  Settings,
  LogOut,
  UserPlus,
  Megaphone,
} from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import LogoutModal from '@/components/auth/LogoutModal';

const navigation = [
  { name: 'Dashboard',    href: '/admin',               icon: LayoutDashboard },
  { name: 'Registration', href: '/admin/seniors',       icon: UserCheck },
  { name: 'Benefits',     href: '/admin/distribution',  icon: CreditCard },
  { name: 'Programs',     href: '/admin/programs',      icon: CalendarDays },
  { name: 'Reports',      href: '/admin/reports',       icon: BarChart2 },
  { name: 'Announcements',  href: '/admin/announcements', icon: Megaphone },
  { name: 'Activity Log',   href: '/admin/activity',      icon: History },
];

export default function AdminSidebar({ systemName = 'CareLink Admin' }: { systemName?: string }) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-slate-50 border-r-2 border-slate-200 z-50">
      {/* Brand */}
      <div className="px-6 pt-6 pb-4 mb-2">
        <h1 className="text-xl font-black text-green-900 tracking-tight">{systemName}</h1>
        <p className="text-slate-500 text-sm mt-0.5">Management Portal</p>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const exact = item.href === '/admin';
          const isActive = exact
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-green-900 text-white translate-x-1 shadow-sm'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto px-3 pb-4 pt-4 border-t-2 border-slate-200 flex flex-col gap-1">

        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          Settings
        </Link>

        {/* Logout button triggers confirmation modal */}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          suppressHydrationWarning
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          Logout
        </button>

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={logout}
          portalName="Admin Portal"
        />
      </div>
    </aside>
  );
}
