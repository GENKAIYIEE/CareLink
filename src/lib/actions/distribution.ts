'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Search seniors for the distribution tracker combobox
export async function searchSeniors(query: string) {
  if (!query || query.length < 2) return [];
  
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
      include: {
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
    const programs = await prisma.benefitProgram.findMany({
      orderBy: { distributionDate: 'desc' },
      take: 20,
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
}) {
  try {
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
        },
        include: { senior: true, program: true, claimedBy: true }
      });
    }

    revalidatePath('/admin/distribution');
    revalidatePath('/admin/claims');
    return { success: true, claim };
  } catch (error) {
    console.error("Error logging assistance:", error);
    return { success: false, error: 'Failed to log assistance.' };
  }
}

export async function getRecentTransactions() {
  try {
    const transactions = await prisma.claim.findMany({
      where: { status: 'Claimed' },
      include: {
        senior: true,
        program: true,
        claimedBy: true,
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
