"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

/**
 * Mark a single claim as claimed.
 * @param claimId - The claim to mark.
 * @param verificationNote - Optional note appended to the ActivityLog (e.g. face verification result, override reason).
 */
export async function markClaimAsClaimed(claimId: string, verificationNote?: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: {
        senior: true,
        program: true,
      },
    });

    if (!claim) {
      return { success: false, error: "Claim not found." };
    }

    if (claim.status === "Claimed") {
      return { success: false, error: "This benefit has already been claimed." };
    }

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: "Claimed",
        claimedAt: new Date(),
      },
    });

    const baseDetails = `Benefit marked as claimed for senior ${claim.senior.firstName} ${claim.senior.lastName} (OSCA ID: ${claim.senior.oscaId}) — Program: ${claim.program.title}`;
    const fullDetails = verificationNote
      ? `${baseDetails}. Note: ${verificationNote}`
      : baseDetails;

    await prisma.activityLog.create({
      data: {
        action: "Marked Claimed",
        details: fullDetails,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/claims");
    return { success: true };
  } catch (error) {
    console.error("Error marking claim as claimed:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
