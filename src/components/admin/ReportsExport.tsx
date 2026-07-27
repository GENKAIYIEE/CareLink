'use client';

import { Download } from 'lucide-react';
import type { ReportSummary, ProgramReport, BarangayReport } from '@/lib/actions/reports';

interface Props {
  programReports: ProgramReport[];
  barangayReports: BarangayReport[];
  summary: ReportSummary;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsExport({ programReports, barangayReports, summary }: Props) {
  const handleExportPrograms = () => {
    const rows = [
      ['Program', 'Type', 'Distribution Date', 'Claimed', 'Unclaimed', 'Claim Rate (%)'],
      ...programReports.map((p) => [
        p.title,
        p.type,
        p.distributionDate,
        String(p.totalClaimed),
        String(p.totalUnclaimed),
        String(p.claimRate),
      ]),
    ];
    downloadCsv(toCsv(rows), `carelink-distribution-report-${Date.now()}.csv`);
  };

  const handleExportBarangay = () => {
    const rows = [
      ['Summary', ''],
      ['Total Registered', String(summary.totalSeniors)],
      ['Active Seniors', String(summary.activeSeniors)],
      ['Benefits Distributed (All Time)', String(summary.totalBenefitsAllTime)],
      ['Seniors With No Claims', String(summary.seniorsWithNoClaims)],
      ['', ''],
      ['Barangay', 'Total Seniors', 'Total Claims'],
      ...barangayReports.map((b) => [b.barangay, String(b.totalSeniors), String(b.totalClaims)]),
    ];
    downloadCsv(toCsv(rows), `carelink-barangay-report-${Date.now()}.csv`);
  };

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={handleExportPrograms}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-800 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
      >
        <Download className="w-4 h-4" />
        Programs CSV
      </button>
      <button
        onClick={handleExportBarangay}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-teal-800 bg-teal-50 border-2 border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
      >
        <Download className="w-4 h-4" />
        Barangay CSV
      </button>
    </div>
  );
}
