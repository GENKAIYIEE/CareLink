'use server';

import { prisma } from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportSummary = {
  totalSeniors: number;
  activeSeniors: number;
  totalBenefitsAllTime: number;
  seniorsWithNoClaims: number;
  activePrograms: number;
};

export type ProgramReport = {
  id: string;
  title: string;
  type: string;
  distributionDate: string;
  totalClaimed: number;
  totalUnclaimed: number;
  claimRate: number;
};

export type BarangayReport = {
  barangay: string;
  totalSeniors: number;
  totalClaims: number;
};

export type MonthlyRegistration = {
  month: string;
  count: number;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getReportSummary(): Promise<ReportSummary> {
  const [
    totalSeniors, 
    activeSeniors, 
    totalBenefitsAllTime, 
    activePrograms, 
    distinctClaimersResult
  ] = await Promise.all([
    prisma.senior.count(),
    prisma.senior.count({ where: { status: 'Active' } }),
    prisma.claim.count({ where: { status: 'Claimed' } }),
    prisma.benefitProgram.count({
      where: { distributionDate: { gte: new Date() } },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT "seniorId") as count 
      FROM "Claim" 
      WHERE status = 'Claimed'
    `
  ]);

  const seniorsWithClaims = Number(distinctClaimersResult[0]?.count || 0);
  const seniorsWithNoClaims = totalSeniors - seniorsWithClaims;

  return {
    totalSeniors,
    activeSeniors,
    totalBenefitsAllTime,
    seniorsWithNoClaims,
    activePrograms,
  };
}

export async function getProgramReports(): Promise<ProgramReport[]> {
  const programs = await prisma.benefitProgram.findMany({
    orderBy: { distributionDate: 'desc' },
    take: 20,
    select: { id: true, title: true, type: true, distributionDate: true }
  });

  if (programs.length === 0) return [];

  const programIds = programs.map(p => p.id);

  // Use database-level grouping to count claims by status per program
  const counts = await prisma.claim.groupBy({
    by: ['programId', 'status'],
    where: { programId: { in: programIds } },
    _count: { _all: true }
  });

  // Map counts back to programs
  const countMap: Record<string, { Claimed: number, Unclaimed: number }> = {};
  for (const id of programIds) {
    countMap[id] = { Claimed: 0, Unclaimed: 0 };
  }

  for (const row of counts) {
    if (countMap[row.programId] && (row.status === 'Claimed' || row.status === 'Unclaimed')) {
      countMap[row.programId][row.status] = row._count._all;
    }
  }

  return programs.map((p) => {
    const totalClaimed = countMap[p.id].Claimed;
    const totalUnclaimed = countMap[p.id].Unclaimed;
    const total = totalClaimed + totalUnclaimed;
    const claimRate = total > 0 ? Math.round((totalClaimed / total) * 100) : 0;

    return {
      id: p.id,
      title: p.title,
      type: p.type,
      distributionDate: new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Manila',
      }).format(p.distributionDate),
      totalClaimed,
      totalUnclaimed,
      claimRate,
    };
  });
}

export async function getBarangayReports(): Promise<BarangayReport[]> {
  // Database-level grouping instead of fetching all records into memory
  const [barangayCounts, barangayClaims] = await Promise.all([
    prisma.senior.groupBy({
      by: ['barangay'],
      _count: { barangay: true },
      orderBy: { _count: { barangay: 'desc' } },
    }),
    prisma.$queryRaw<{ barangay: string; count: bigint }[]>`
      SELECT s.barangay, COUNT(c.id) as count
      FROM "Senior" s
      JOIN "Claim" c ON s.id = c."seniorId"
      WHERE c.status = 'Claimed'
      GROUP BY s.barangay
    `
  ]);

  const claimMap: Record<string, number> = {};
  for (const row of barangayClaims) {
    claimMap[row.barangay] = Number(row.count);
  }

  return barangayCounts.map((b) => ({
    barangay: b.barangay,
    totalSeniors: b._count.barangay,
    totalClaims: claimMap[b.barangay] ?? 0,
  }));
}

export async function getMonthlyRegistrations(): Promise<MonthlyRegistration[]> {
  // Aggregate directly in the PostgreSQL database using date_trunc
  const result = await prisma.$queryRaw<{ month_date: Date; count: bigint }[]>`
    SELECT date_trunc('month', "createdAt" AT TIME ZONE 'Asia/Manila') as month_date, 
           COUNT(id) as count
    FROM "Senior"
    GROUP BY month_date
    ORDER BY month_date ASC
  `;

  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    timeZone: 'Asia/Manila',
  });

  return result.map((row) => ({
    month: formatter.format(new Date(row.month_date)),
    count: Number(row.count),
  }));
}
