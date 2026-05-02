"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GenderData {
  name: string;
  value: number;
}

export interface AgeBracketData {
  bracket: string;
  count: number;
}

interface DemographicsChartsProps {
  genderData: GenderData[];
  ageBracketData: AgeBracketData[];
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const GENDER_COLORS: Record<string, string> = {
  Male: "#166534",    // green-800
  Female: "#be185d",  // pink-700
  Other: "#6d28d9",   // violet-700
  Unknown: "#94a3b8", // slate-400
};

const AGE_BAR_COLOR = "#15803d"; // green-700

// ─── Custom Tooltip for Pie ───────────────────────────────────────────────────

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800">{name}</p>
        <p className="text-slate-600">
          {value} senior{value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Custom Tooltip for Bar ───────────────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800">Age {label}</p>
        <p className="text-slate-600">
          {payload[0].value} senior{payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

// ─── Custom Legend ────────────────────────────────────────────────────────────

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-slate-600">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DemographicsCharts({
  genderData,
  ageBracketData,
}: DemographicsChartsProps) {
  const totalSeniors = genderData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* ── Gender Distribution Donut ── */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Gender Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active seniors · {totalSeniors.toLocaleString()} total
          </p>
        </div>

        {genderData.length === 0 || totalSeniors === 0 ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            No data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {genderData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={GENDER_COLORS[entry.name] ?? GENDER_COLORS.Unknown}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend content={renderCustomLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Age Brackets Bar Chart ── */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">Age Demographics</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribution across age brackets
          </p>
        </div>

        {ageBracketData.every((d) => d.count === 0) ? (
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
            No data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={ageBracketData}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barSize={32}
            >
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="bracket"
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" fill={AGE_BAR_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
