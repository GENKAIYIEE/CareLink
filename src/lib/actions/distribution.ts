'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getSession } from "@/lib/session";

// Helper to reliably get YYYY-MM-DD in Asia/Manila (UTC+8)
function getManilaDateString(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// Search seniors for the distribution tracker combobox
export async function searchSeniors(query: string) {
  if (!query || query.length < 2) return [];

  // Auth guard — only admins may search senior data
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return [];

  try {
    const seniors = await prisma.senior.findMany({
      where: {
        OR: [
          { oscaId: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 10,
      select: {
        id: true,
        oscaId: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        status: true,
        barangay: true,
        delegate: true,
      }
    });
    return seniors;
  } catch (error) {
    console.error("Error searching seniors:", error);
    return [];
  }
}

// Get active programs
export async function getActivePrograms() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const programs = await prisma.benefitProgram.findMany({
      where: {
        distributionDate: {
          gte: thirtyDaysAgo,
          lte: todayEnd,
        }
      },
      orderBy: { distributionDate: 'desc' },
    });
    return programs;
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}

// Log assistance (Claim)
export async function logAssistance(data: {
  seniorId: string;
  programId: string;
  claimedById?: string;
  verificationMethod?: 'face' | 'manual';
  signature?: string;
}) {
  try {
    // ─── Authorization guard ──────────────────────────────────────────────
    const authSession = await getSession();
    if (!authSession || authSession.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized. Admin access required.' };
    }

    const program = await prisma.benefitProgram.findUnique({
      where: { id: data.programId }
    });
    if (!program) return { success: false, error: 'Program not found.' };

    const todayStr = getManilaDateString(new Date());
    const distStr = getManilaDateString(program.distributionDate);
    
    if (todayStr < distStr) {
      return { success: false, error: "Claims for this program cannot be recorded before the distribution date." };
    }

    // Check if claim already exists
    const existingClaim = await prisma.claim.findFirst({
      where: {
        seniorId: data.seniorId,
        programId: data.programId,
      }
    });

    let claim;
    if (existingClaim) {
      if (existingClaim.status === 'Claimed') {
        return { success: false, error: 'Benefit already claimed by this senior.' };
      }
      // Update existing unclaimed claim
      claim = await prisma.claim.update({
        where: { id: existingClaim.id },
        data: {
          status: 'Claimed',
          claimedAt: new Date(),
          claimedById: data.claimedById || null,
          signature: data.signature || null,
        },
        include: { senior: true, program: true, claimedBy: true }
      });
    } else {
      // Create new claim
      claim = await prisma.claim.create({
        data: {
          seniorId: data.seniorId,
          programId: data.programId,
          status: 'Claimed',
          claimedAt: new Date(),
          claimedById: data.claimedById || null,
          signature: data.signature || null,
        },
        include: { senior: true, program: true, claimedBy: true }
      });
    }

    const session = await getSession();
    if (session && session.role === 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          action: "Logged Assistance",
          details: data.verificationMethod === 'face'
            ? `Benefit distributed to ${claim.senior.firstName} ${claim.senior.lastName} (OSCA ID: ${claim.senior.oscaId}) — Program: ${claim.program.title}. Identity verified via face recognition.`
            : `Benefit distributed to ${claim.senior.firstName} ${claim.senior.lastName} (OSCA ID: ${claim.senior.oscaId}) — Program: ${claim.program.title}. Logged via manual search — no face verification performed.`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath('/admin/distribution');
    revalidatePath('/admin/claims');
    revalidatePath('/admin');
    return { success: true, claim };
  } catch (error) {
    console.error("Error logging assistance:", error);
    return { success: false, error: 'Failed to log assistance.' };
  }
}

export async function logAssistanceBatch(data: {
  seniorIds: string[];
  programId: string;
  seniorVerificationMethods?: Record<string, 'face' | 'manual'>;
  signature?: string;
}) {
  try {
    // ─── Authorization guard ──────────────────────────────────────────────
    const authSession = await getSession();
    if (!authSession || authSession.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized. Admin access required.' };
    }

    const program = await prisma.benefitProgram.findUnique({
      where: { id: data.programId }
    });
    if (!program) return { success: false, error: 'Program not found.' };

    const todayStr = getManilaDateString(new Date());
    const distStr = getManilaDateString(program.distributionDate);
    
    if (todayStr < distStr) {
      return { success: false, error: "Claims for this program cannot be recorded before the distribution date." };
    }

    const uniqueSeniorIds = Array.from(new Set(data.seniorIds));
    if (uniqueSeniorIds.length === 0) {
      return { success: false, error: "No beneficiaries selected." };
    }

    // ─── Execute in a single transactional unit with chunking ─────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing claims for these seniors under this program
      const existingClaims = await tx.claim.findMany({
        where: {
          programId: data.programId,
          seniorId: { in: uniqueSeniorIds }
        },
        select: {
          id: true,
          seniorId: true,
          status: true,
        }
      });

      const existingSeniorIds = new Set(existingClaims.map(c => c.seniorId));

      // 2. Update existing Unclaimed claims to Claimed
      const toUpdate = existingClaims.filter(c => c.status === 'Unclaimed');
      if (toUpdate.length > 0) {
        const CHUNK_SIZE = 300;
        for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
          const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
          await tx.claim.updateMany({
            where: { id: { in: chunk.map(c => c.id) } },
            data: {
              status: 'Claimed',
              claimedAt: new Date(),
              signature: data.signature || null,
            }
          });
        }
      }

      // 3. Create new claims for seniors who don't have any existing claim record
      const toCreateIds = uniqueSeniorIds.filter(id => !existingSeniorIds.has(id));
      let createdCount = 0;

      if (toCreateIds.length > 0) {
        const CHUNK_SIZE = 300;
        for (let i = 0; i < toCreateIds.length; i += CHUNK_SIZE) {
          const chunk = toCreateIds.slice(i, i + CHUNK_SIZE);
          const createRes = await tx.claim.createMany({
            data: chunk.map(seniorId => ({
              seniorId,
              programId: data.programId,
              status: 'Claimed',
              claimedAt: new Date(),
              signature: data.signature || null,
            })),
            skipDuplicates: true, // Prevents duplicate errors if concurrently inserted
          });
          createdCount += createRes.count;
        }
      }

      // 4. Activity log generation without redundant DB roundtrip
      let seniorDetails = '';
      if (uniqueSeniorIds.length <= 3) {
        const seniors = await tx.senior.findMany({
          where: { id: { in: uniqueSeniorIds } },
          select: { id: true, firstName: true, lastName: true, oscaId: true }
        });
        seniorDetails = seniors.map(s => {
          const method = data.seniorVerificationMethods?.[s.id];
          return method === 'face'
            ? `${s.firstName} ${s.lastName} identified via face recognition.`
            : `${s.firstName} ${s.lastName} added via manual search — no face verification.`;
        }).join(' ');
      } else {
        const verificationMap = data.seniorVerificationMethods || {};
        let faceCount = 0;
        for (const id of uniqueSeniorIds) {
          if (verificationMap[id] === 'face') faceCount++;
        }
        const manualCount = uniqueSeniorIds.length - faceCount;
        seniorDetails = `${uniqueSeniorIds.length} seniors processed (${faceCount} face verified, ${manualCount} manual).`;
      }

      await tx.activityLog.create({
        data: {
          action: "Logged Assistance",
          details: `Benefit distributed under ${program.title}. ${seniorDetails}`,
          adminId: authSession.userId,
        },
      });

      return {
        count: toUpdate.length + createdCount,
        skipped: uniqueSeniorIds.length - (toUpdate.length + createdCount)
      };
    }, {
      timeout: 30000,
    });

    revalidatePath('/admin/distribution');
    revalidatePath('/admin/claims');
    return { success: true, count: result.count, skipped: result.skipped };
  } catch (error) {
    console.error("Error logging batch assistance:", error);
    return { success: false, error: 'Failed to log assistance for all seniors.' };
  }
}

export async function getBarangays() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return [];

    const distinct = await prisma.senior.findMany({
      select: { barangay: true },
      distinct: ['barangay']
    });
    return distinct.map(d => d.barangay).filter(Boolean).sort();
  } catch (error) {
    console.error("Error fetching barangays:", error);
    return [];
  }
}

export async function getSeniorsByBarangay(barangay: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') return [];

    const isAll = barangay === 'ALL' || barangay === 'All Barangays';
    const whereClause: {
      status?: { not: string };
      barangay?: string;
    } = {
      status: { not: 'Deceased' }, // Ensure deceased seniors are excluded
    };

    if (!isAll) {
      whereClause.barangay = barangay;
    }

    return await prisma.senior.findMany({
      where: whereClause,
      select: {
        id: true,
        oscaId: true,
        firstName: true,
        lastName: true,
        status: true,
        barangay: true,
        // specifically skipping photoUrl and face_embedding to avoid huge payloads
        delegate: true,
      },
      orderBy: [
        { barangay: 'asc' },
        { lastName: 'asc' },
      ],
    });
  } catch (error) {
    console.error("Error fetching seniors by barangay:", error);
    return [];
  }
}
export async function getRecentTransactions() {
  try {
    const transactions = await prisma.claim.findMany({
      where: { status: 'Claimed' },
      select: {
        id: true,
        status: true,
        claimedAt: true,
        senior: {
          select: { firstName: true, lastName: true, oscaId: true }
        },
        program: {
          select: { title: true }
        },
        claimedBy: {
          select: { fullName: true }
        }
      },
      orderBy: { claimedAt: 'desc' },
      take: 10,
    });
    return transactions;
  } catch (error) {
    console.error("Error fetching recent transactions:", error);
    return [];
  }
}

export async function getSeniorByOscaId(oscaId: string) {
  try {
    const senior = await prisma.senior.findUnique({
      where: { oscaId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        oscaId: true,
        barangay: true,
        photoUrl: true,
        status: true
      }
    });
    return senior;
  } catch (error) {
    console.error("Error fetching senior by OSCA ID:", error);
    return null;
  }
}
