"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { AGOO_BARANGAYS } from "@/lib/constants";

interface Props {
  barangays: readonly string[];
}

const STATUSES = ["All", "Pending", "NeedsReupload", "Approved", "Rejected"] as const;

export function ApplicationFilters({ barangays }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "All") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Status filter */}
      <select
        value={searchParams.get("status") ?? "All"}
        onChange={(e) => update("status", e.target.value)}
        className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "All" ? "All Statuses" : s === "NeedsReupload" ? "Needs Re-upload" : s}
          </option>
        ))}
      </select>

      {/* Barangay filter */}
      <select
        value={searchParams.get("barangay") ?? ""}
        onChange={(e) => update("barangay", e.target.value)}
        className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30"
      >
        <option value="">All Barangays</option>
        {barangays.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {/* Search */}
      <input
        type="search"
        placeholder="Search name or reference…"
        defaultValue={searchParams.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") update("search", (e.target as HTMLInputElement).value);
        }}
        className="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#006b2c]/30 min-w-[220px]"
      />
    </div>
  );
}
