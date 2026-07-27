'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import type { MonthlyRegistration, BarangayReport } from '@/lib/actions/reports';

// ─── Tooltips ────────────────────────────────────────────────────────────────

interface GenericTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
}

const GenericTooltip = ({
  active,
  payload,
  label,
}: GenericTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color ?? '#15803d' }} className="font-medium">
            {p.name}: {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Monthly Registration Chart ───────────────────────────────────────────────

export function MonthlyRegistrationChart({ data }: { data: MonthlyRegistration[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-400 text-sm">
        No registration data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<GenericTooltip />} />
        <Line
          type="monotone"
          dataKey="count"
          name="Registrations"
          stroke="#15803d"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#15803d', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Barangay Bar Chart ───────────────────────────────────────────────────────

export function BarangayBarChart({ data }: { data: BarangayReport[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-400 text-sm">
        No barangay data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 40)}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
        barSize={18}
        barGap={4}
      >
        <CartesianGrid horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="barangay"
          width={110}
          tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<GenericTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="totalSeniors" name="Seniors" fill="#15803d" radius={[0, 4, 4, 0]} />
        <Bar dataKey="totalClaims" name="Claims" fill="#86efac" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
