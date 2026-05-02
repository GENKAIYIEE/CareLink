import { prisma } from '@/lib/prisma';
import { Users, Banknote, CalendarDays, UserPlus, Receipt, Flag, UserCheck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [totalSeniors, totalPrograms, totalClaims] = await Promise.all([
    prisma.senior.count(),
    prisma.benefitProgram.count(),
    prisma.claim.count(),
  ]);

  return (
    <>
      {/* Dashboard Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-sm font-medium text-slate-600 mt-1">System status and key metrics for today.</p>
      </div>


      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">+12% this month</span>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600">Total Registered Citizens</p>
            <p className="text-4xl font-bold text-blue-900 mt-1">{totalSeniors.toLocaleString()}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center">
              <Banknote className="h-6 w-6" />
            </div>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">On Target</span>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600">Benefits Disbursed (MTD)</p>
            <p className="text-4xl font-bold text-orange-700 mt-1">{totalClaims.toLocaleString()}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-start">
            <div className="h-12 w-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center">
              <CalendarDays className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600">Upcoming Community Events</p>
            <p className="text-4xl font-bold text-teal-800 mt-1">{totalPrograms}</p>
          </div>
        </div>
      </div>

      {/* Layout Grid: Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Actions</h3>
          <Link href="/admin/seniors/register" className="w-full h-14 bg-blue-900 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-blue-800 transition-colors shadow-sm">
            <UserPlus className="h-5 w-5" />
            New Registration
          </Link>
          <Link href="/admin/distribution" className="w-full h-14 bg-white text-blue-900 text-sm font-bold rounded-lg flex items-center justify-center gap-3 border-2 border-blue-900 hover:bg-blue-50 transition-colors">
            <Receipt className="h-5 w-5" />
            Log Benefit
          </Link>
          <button suppressHydrationWarning className="w-full h-14 bg-white text-orange-700 text-sm font-bold rounded-lg flex items-center justify-center gap-3 border-2 border-orange-700 hover:bg-orange-50 transition-colors mt-4">
            <Flag className="h-5 w-5" />
            Review Flagged Cases
          </button>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-200 p-6 flex flex-col h-full shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            <button suppressHydrationWarning className="text-blue-700 text-sm font-bold hover:underline flex items-center gap-1">
              View All <span className="text-lg leading-none">→</span>
            </button>
          </div>
          <div className="flex flex-col">
            {/* Hardcoded Activities for UI fidelity as per reference */}
            <div className="flex gap-4 items-start py-4 border-b-2 border-slate-100 last:border-0">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-1">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-900"><strong className="font-bold">Sarah Jenkins</strong> completed a new household registration.</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">10 minutes ago • ID: REG-8921</p>
              </div>
            </div>

            <div className="flex gap-4 items-start py-4 border-b-2 border-slate-100 last:border-0">
              <div className="h-10 w-10 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center flex-shrink-0 mt-1">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-900"><strong className="font-bold">Housing Assistance</strong> batch disbursement successful.</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">1 hour ago • 450 recipients</p>
              </div>
            </div>

            <div className="flex gap-4 items-start py-4 border-b-2 border-slate-100 last:border-0">
              <div className="h-10 w-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center flex-shrink-0 mt-1">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-900">System flagged <strong className="font-bold">3 applications</strong> for missing documentation.</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">2 hours ago • Action Required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
