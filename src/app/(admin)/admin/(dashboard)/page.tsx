import { prisma } from '@/lib/prisma';
import { Users, Banknote, CalendarDays, UserPlus, Receipt, UserCheck, AlertTriangle, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import DemographicsCharts, {
  type GenderData,
  type AgeBracketData,
} from '@/components/admin/DemographicsCharts';

// ─── Demographics Helpers ─────────────────────────────────────────────────────

function calcAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function aggregateDemographics(
  seniors: { gender: string | null; dateOfBirth: Date }[]
): { genderData: GenderData[]; ageBracketData: AgeBracketData[] } {
  const genderCounts: Record<string, number> = {};
  // Brackets ordered ascending for a natural left-to-right chart axis.
  // 'Under 60' acts as a catch-all so no senior is silently dropped.
  const ageBrackets: Record<string, number> = {
    'Under 60': 0,
    '60–69': 0,
    '70–79': 0,
    '80–89': 0,
    '90+': 0,
  };

  for (const senior of seniors) {
    // Gender aggregation
    const gender = senior.gender?.trim() || 'Unknown';
    genderCounts[gender] = (genderCounts[gender] ?? 0) + 1;

    // Age bracket aggregation
    const age = calcAge(new Date(senior.dateOfBirth));
    if (age >= 90) ageBrackets['90+']++;
    else if (age >= 80) ageBrackets['80–89']++;
    else if (age >= 70) ageBrackets['70–79']++;
    else if (age >= 60) ageBrackets['60–69']++;
    else ageBrackets['Under 60']++; // catch-all: prevents silent data drops
  }

  const genderData: GenderData[] = Object.entries(genderCounts).map(
    ([name, value]) => ({ name, value })
  );
  const ageBracketData: AgeBracketData[] = Object.entries(ageBrackets).map(
    ([bracket, count]) => ({ bracket, count })
  );

  return { genderData, ageBracketData };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const [totalSeniors, totalPrograms, totalClaims, activeSeniors, recentActivities] = await Promise.all([
    prisma.senior.count(),
    prisma.benefitProgram.count(),
    prisma.claim.count(),
    prisma.senior.findMany({
      where: { status: 'Active' },
      select: { gender: true, dateOfBirth: true },
    }),
    prisma.activityLog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { admin: true },
    }),
  ]);

  const { genderData, ageBracketData } = aggregateDemographics(activeSeniors);

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
            <div className="h-12 w-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">+12% this month</span>
          </div>
          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-600">Total Registered Citizens</p>
            <p className="text-4xl font-bold text-green-900 mt-1">{totalSeniors.toLocaleString()}</p>
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

      {/* Demographics Analytics Section */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-slate-900">Demographic Analytics</h3>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Breakdown of active senior citizens by gender and age group.
          </p>
        </div>
        <DemographicsCharts
          genderData={genderData}
          ageBracketData={ageBracketData}
        />
      </div>

      {/* Layout Grid: Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Quick Actions</h3>
          <Link href="/admin/seniors/register" className="w-full h-14 bg-green-900 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-green-800 transition-colors shadow-sm">
            <UserPlus className="h-5 w-5" />
            New Registration
          </Link>
          <Link href="/admin/distribution" className="w-full h-14 bg-white text-green-900 text-sm font-bold rounded-lg flex items-center justify-center gap-3 border-2 border-green-900 hover:bg-green-50 transition-colors">
            <Receipt className="h-5 w-5" />
            Log Benefit
          </Link>
          <Link href="/admin/programs/new" className="w-full h-14 bg-white text-teal-700 text-sm font-bold rounded-lg flex items-center justify-center gap-3 border-2 border-teal-700 hover:bg-teal-50 transition-colors">
            <CalendarPlus className="h-5 w-5" />
            New Program
          </Link>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-slate-200 p-6 flex flex-col h-full shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
            <Link href="/admin/activity" suppressHydrationWarning className="text-green-700 text-sm font-bold hover:underline flex items-center gap-1">
              View All <span className="text-lg leading-none">→</span>
            </Link>
          </div>
          <div className="flex flex-col">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">No recent activity.</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex gap-4 items-start py-4 border-b-2 border-slate-100 last:border-0">
                  <div className="h-10 w-10 rounded-full bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">
                      {activity.action}: <strong className="font-bold">{activity.details}</strong>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(activity.createdAt))} • By {activity.admin.fullName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
