import {
  getReportSummary,
  getProgramReports,
  getBarangayReports,
  getMonthlyRegistrations,
} from '@/lib/actions/reports';
import {
  MonthlyRegistrationChart,
  BarangayBarChart,
} from '@/components/admin/ReportsCharts';
import ReportsExport from '@/components/admin/ReportsExport';
import {
  Users,
  UserCheck,
  Gift,
  UserX,
  CalendarDays,
  TrendingUp,
  MapPin,
  BarChart2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const [summary, programReports, barangayReports, monthlyRegs] = await Promise.all([
    getReportSummary(),
    getProgramReports(),
    getBarangayReports(),
    getMonthlyRegistrations(),
  ]);

  const kpiCards = [
    {
      label: 'Total Registered',
      value: summary.totalSeniors.toLocaleString(),
      icon: Users,
      color: 'bg-green-100 text-green-700',
      border: 'border-green-200',
    },
    {
      label: 'Active Seniors',
      value: summary.activeSeniors.toLocaleString(),
      icon: UserCheck,
      color: 'bg-teal-100 text-teal-700',
      border: 'border-teal-200',
    },
    {
      label: 'Benefits Distributed',
      value: summary.totalBenefitsAllTime.toLocaleString(),
      icon: Gift,
      color: 'bg-orange-100 text-orange-700',
      border: 'border-orange-200',
    },
    {
      label: 'Seniors w/ No Claims',
      value: summary.seniorsWithNoClaims.toLocaleString(),
      icon: UserX,
      color: 'bg-red-100 text-red-600',
      border: 'border-red-200',
    },
    {
      label: 'Upcoming Programs',
      value: summary.activePrograms.toLocaleString(),
      icon: CalendarDays,
      color: 'bg-blue-100 text-blue-700',
      border: 'border-blue-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-green-700" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            System-wide overview of senior registrations, benefit distribution, and barangay coverage.
          </p>
        </div>
        <ReportsExport
          programReports={programReports}
          barangayReports={barangayReports}
          summary={summary}
        />
      </div>

      {/* ── Section 1: KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`bg-white rounded-xl border-2 ${card.border} p-5 flex flex-col gap-3 shadow-sm`}
          >
            <div className={`w-10 h-10 rounded-full ${card.color} flex items-center justify-center`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 leading-tight">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 2: Distribution Report per Program ── */}
      <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Distribution Report by Program</h3>
            <p className="text-xs text-slate-500 mt-0.5">Claim rates for the last 20 programs</p>
          </div>
        </div>
        {programReports.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">No programs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Claimed</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Unclaimed</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Claim Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {programReports.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 max-w-[200px] truncate">{p.title}</td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{p.distributionDate}</td>
                    <td className="px-4 py-4 text-right font-bold text-green-700">{p.totalClaimed}</td>
                    <td className="px-4 py-4 text-right font-bold text-red-500">{p.totalUnclaimed}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[80px]">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${p.claimRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-10 text-right">
                          {p.claimRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 3 & 4: Barangay + Registration Timeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barangay Breakdown */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Barangay Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Seniors registered vs benefits claimed</p>
            </div>
          </div>
          <div className="p-6">
            <BarangayBarChart data={barangayReports} />
          </div>
          {/* Barangay table below chart */}
          {barangayReports.length > 0 && (
            <div className="border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Barangay</th>
                    <th className="text-right px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Seniors</th>
                    <th className="text-right px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider">Claims</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {barangayReports.map((b) => (
                    <tr key={b.barangay} className="hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-semibold text-slate-700">{b.barangay}</td>
                      <td className="px-5 py-2.5 text-right text-slate-600">{b.totalSeniors}</td>
                      <td className="px-5 py-2.5 text-right text-green-700 font-bold">{b.totalClaims}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Registration Timeline */}
        <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Registration Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Monthly senior enrollments over time</p>
            </div>
          </div>
          <div className="p-6">
            <MonthlyRegistrationChart data={monthlyRegs} />
          </div>
          {monthlyRegs.length > 0 && (
            <div className="px-6 pb-5">
              <div className="bg-slate-50 rounded-lg px-4 py-3 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Peak month</span>
                <span className="font-bold text-slate-800">
                  {[...monthlyRegs].sort((a, b) => b.count - a.count)[0]?.month}
                  {' — '}
                  {[...monthlyRegs].sort((a, b) => b.count - a.count)[0]?.count.toLocaleString()} registrations
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
