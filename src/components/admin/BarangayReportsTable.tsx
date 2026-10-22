"use client";

import { useState, useMemo } from "react";
import { Search, MapPin } from "lucide-react";
import type { BarangayReport } from "@/lib/actions/reports";

export function BarangayReportsTable({ data }: { data: BarangayReport[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter((b) => b.barangay.toLowerCase().includes(q));
  }, [data, search]);

  const totalSeniors = useMemo(
    () => data.reduce((acc, b) => acc + b.totalSeniors, 0),
    [data]
  );
  const totalClaims = useMemo(
    () => data.reduce((acc, b) => acc + b.totalClaims, 0),
    [data]
  );

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Barangay Coverage Directory
            </h3>
            <p className="text-xs text-slate-500">
              Complete breakdown across all {data.length} barangays in Agoo
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search barangay..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
          />
        </div>
      </div>

      {/* Table container with fixed max height and sticky header */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Barangay ({filtered.length})
              </th>
              <th className="px-6 py-3 text-right font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Registered Seniors
              </th>
              <th className="px-6 py-3 text-right font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Benefits Claimed
              </th>
              <th className="px-6 py-3 text-right font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Claim Coverage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No barangay matching &ldquo;{search}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const rate =
                  b.totalSeniors > 0
                    ? Math.min(100, Math.round((b.totalClaims / b.totalSeniors) * 100))
                    : 0;

                return (
                  <tr
                    key={b.barangay}
                    className="hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-2.5 font-semibold text-slate-900">
                      {b.barangay}
                    </td>
                    <td className="px-6 py-2.5 text-right font-mono text-slate-600">
                      {b.totalSeniors.toLocaleString()}
                    </td>
                    <td className="px-6 py-2.5 text-right font-mono text-green-700 font-bold">
                      {b.totalClaims.toLocaleString()}
                    </td>
                    <td className="px-6 py-2.5 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
        <span>Total Municipal Coverage</span>
        <div className="flex items-center gap-6">
          <span>
            Seniors:{" "}
            <span className="text-slate-900 font-mono">
              {totalSeniors.toLocaleString()}
            </span>
          </span>
          <span>
            Claims:{" "}
            <span className="text-green-700 font-mono">
              {totalClaims.toLocaleString()}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
