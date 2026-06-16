"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

export async function createDelegateAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    const seniorId = formData.get("seniorId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const relationship = formData.get("relationship") as string;
    const contactNumber = formData.get("contactNumber") as string;

    if (!seniorId || !firstName || !lastName || !relationship || !contactNumber) {
      return { success: false, error: "All fields are required." };
    }

    const senior = await prisma.senior.findUnique({
      where: { id: seniorId },
      include: { delegate: true },
    });

    if (!senior) {
      return { success: false, error: "Senior not found." };
    }

    if (senior.delegate) {
      return { success: false, error: "Senior already has an active delegate." };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    const delegate = await prisma.delegate.create({
      data: {
        fullName,
        relationship,
        contactNumber,
      },
    });

    await prisma.senior.update({
      where: { id: seniorId },
      data: { delegateId: delegate.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "Assigned Delegate",
        details: `Assigned delegate ${fullName} to ${senior.firstName} ${senior.lastName} (${senior.oscaId})`,
        adminId: session.userId,
      },
    });

    revalidatePath(`/admin/seniors/${seniorId}`);
    return { success: true };
  } catch (error) {
    console.error("Error creating delegate:", error);
    return { success: false, error: "Failed to create delegate." };
  }
}

export async function updateDelegateAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    const delegateId = formData.get("delegateId") as string;
    const seniorId = formData.get("seniorId") as string; // passed for revalidation
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const relationship = formData.get("relationship") as string;
    const contactNumber = formData.get("contactNumber") as string;

    if (!delegateId || !firstName || !lastName || !relationship || !contactNumber) {
      return { success: false, error: "All fields are required." };
    }

    const existingDelegate = await prisma.delegate.findUnique({
      where: { id: delegateId },
    });

    if (!existingDelegate) {
      return { success: false, error: "Delegate not found." };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    await prisma.delegate.update({
      where: { id: delegateId },
      data: {
        fullName,
        relationship,
        contactNumber,
      },
    });

    if (seniorId) {
      revalidatePath(`/admin/seniors/${seniorId}`);
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating delegate:", error);
    return { success: false, error: "Failed to update delegate." };
  }
}

export async function deleteDelegateAction(delegateId: string, seniorId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized." };
    }

    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
    });

    if (!admin || admin.role !== "SuperAdmin") {
      return { success: false, error: "Only SuperAdmins can remove a delegate." };
    }

    const delegate = await prisma.delegate.findUnique({
      where: { id: delegateId },
      include: { seniors: true },
    });

    if (!delegate) {
      return { success: false, error: "Delegate not found." };
    }

    // Unlink the delegate from the senior first
    await prisma.senior.update({
      where: { id: seniorId },
      data: { delegateId: null },
    });
    
    // Check if the delegate is linked to any other seniors before deleting the delegate record.
    // If it's only linked to this one senior, it's safe to delete.
    const linkedSeniorsCount = await prisma.senior.count({
      where: { delegateId: delegateId }
    });

    if (linkedSeniorsCount === 0) {
      await prisma.delegate.delete({
        where: { id: delegateId },
      });
    }

    const targetSenior = delegate.seniors.find(s => s.id === seniorId);
    const seniorName = targetSenior ? `${targetSenior.firstName} ${targetSenior.lastName} (${targetSenior.oscaId})` : "Senior";

    await prisma.activityLog.create({
      data: {
        action: "Removed Delegate",
        details: `Removed delegate ${delegate.fullName} from ${seniorName}`,
        adminId: session.userId,
      },
    });

    revalidatePath(`/admin/seniors/${seniorId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting delegate:", error);
    return { success: false, error: "Failed to delete delegate." };
  }
}

export async function getDelegateBySeniorId(seniorId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return null;
    }

    const senior = await prisma.senior.findUnique({
      where: { id: seniorId },
      include: { delegate: true },
    });

    return senior?.delegate || null;
  } catch (error) {
    console.error("Error fetching delegate:", error);
    return null;
  }
}
