import { prisma } from '@/lib/prisma';
import { Users, Banknote, CalendarDays, UserPlus, Receipt, UserCheck, AlertTriangle, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import DemographicsCharts, {
  type GenderData,
  type AgeBracketData,
} from '@/components/admin/DemographicsCharts';

export const dynamic = 'force-dynamic';

// ─── DB-level Demographics Aggregation ───────────────────────────────────────
//
// ⚠ Performance: NEVER load all senior rows into Node.js to aggregate.
// These two queries push aggregation entirely into PostgreSQL — only a handful
// of aggregate rows are returned regardless of how many seniors are registered.

async function fetchGenderData(): Promise<GenderData[]> {
  const rows = await prisma.senior.groupBy({
    by: ['gender'],
    where: { status: 'Active' },
    _count: { _all: true },
  });

  const GENDER_COLORS: Record<string, string> = {
    Female: '#ec4899',
    Male: '#3b82f6',
    Other: '#a855f7',
    Unknown: '#94a3b8',
  };

  return rows.map((r) => {
    const name = r.gender?.trim() || 'Unknown';
    return { name, value: r._count._all, color: GENDER_COLORS[name] ?? GENDER_COLORS.Unknown };
  });
}

async function fetchAgeBracketData(): Promise<AgeBracketData[]> {
  // Age calculation + bracket grouping done entirely in PostgreSQL.
  // EXTRACT(YEAR FROM AGE(...)) gives the integer age.
  type Row = { bracket: string; count: bigint };
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT
      CASE
        WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) >= 90 THEN '90+'
        WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) >= 80 THEN '80–89'
        WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) >= 70 THEN '70–79'
        WHEN EXTRACT(YEAR FROM AGE("dateOfBirth")) >= 60 THEN '60–69'
        ELSE 'Under 60'
      END AS bracket,
      COUNT(*) AS count
    FROM "Senior"
    WHERE status = 'Active'
    GROUP BY bracket
    ORDER BY bracket
  `;

  // Ensure all brackets are present (even zeros) in display order
  const ORDER = ['Under 60', '60–69', '70–79', '80–89', '90+'];
  const map = new Map(rows.map((r) => [r.bracket, Number(r.count)]));
  return ORDER.map((bracket) => ({ bracket, count: map.get(bracket) ?? 0 }));
}


function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Manila'
  }).format(date);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  // Fix Timezone Bug: Get start of month in Philippine Time (PHT)
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Manila' }).formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  const phtStartOfMonthStr = `${year}-${month}-01T00:00:00+08:00`;
  const mtdStart = new Date(phtStartOfMonthStr);

  const todayStart = new Date(`${year}-${month}-${day}T00:00:00+08:00`);
  const todayEnd = new Date(`${year}-${month}-${day}T23:59:59+08:00`);

  const [
    totalSeniors,
    totalPrograms,
    totalClaims,
    recentActivities,
    todaysPrograms,
    genderData,
    ageBracketData,
  ] = await Promise.all([
    prisma.senior.count(),
    prisma.benefitProgram.count({
      where: { distributionDate: { gte: new Date() } }
    }),
    prisma.claim.count({
      where: {
        status: 'Claimed',
        claimedAt: { gte: mtdStart }
      }
    }),
    prisma.activityLog.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { 
            email: true,
            role: true,
            fullName: true
          }
        }
      }
    }),
    prisma.benefitProgram.findMany({
      where: {
        distributionDate: { gte: todayStart, lte: todayEnd }
      }
    }),
    fetchGenderData(),
    fetchAgeBracketData(),
  ]);

  // Time check for "Ongoing" status
  const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: false, timeZone: 'Asia/Manila' });
  const currentTimeStr = timeFormatter.format(now); // e.g. "14:30"
  
  const isOngoing = (program: any) => {
    if (!program.startTime || !program.endTime) return true; // All-day if no time specified
    return currentTimeStr >= program.startTime && currentTimeStr <= program.endTime;
  };
  
  const ongoingPrograms = todaysPrograms.filter(isOngoing);

  return (
    <>
      <LiveUpdate interval={30000} />
      
      {ongoingPrograms.length > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <h3 className="font-bold text-green-900 uppercase tracking-wider text-sm">Live KPI: Ongoing Event Today</h3>
          </div>
          <div className="space-y-3">
            {ongoingPrograms.map(p => (
              <div key={p.id} className="bg-white rounded-lg p-4 border border-green-100 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{p.title}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-green-500" />
                    Monitor distribution actively. 
                    {p.startTime && p.endTime && ` Scheduled from ${p.startTime} to ${p.endTime}`}
                  </p>
                </div>
                <Link href={`/admin/programs/${p.id}`} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                  Manage Distribution
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

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
                    <div className="h-3 w-3 bg-green-500 rounded-full shadow-sm"></div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-900">
                      {activity.action}: <strong className="font-bold">{activity.details}</strong>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {getRelativeTime(new Date(activity.createdAt))} • By {activity.admin.fullName}
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
