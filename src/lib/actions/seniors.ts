"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
export async function registerSeniorAction(data: any) {
  try {
    // 1. Generate OSCA ID (e.g. 2026-0001)
    const year = new Date().getFullYear();
    const count = await prisma.senior.count();
    const nextSeq = String(count + 1).padStart(4, "0");
    const oscaId = `${year}-${nextSeq}`;

    // 2. Generate a random but readable password
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
    let password = "AGOO-";
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Save to database
    const senior = await prisma.senior.create({
      data: {
        oscaId,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        civilStatus: data.civilStatus,
        barangay: data.barangay,
        bloodType: data.bloodType || null,
        healthConditions: data.healthConditions || null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNum: data.emergencyContactNum,
        passwordHash,
      },
    });

    // 5. Log the Activity
    const session = await getSession();
    if (session && session.role === 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          action: "Registered Senior",
          details: `${senior.firstName} ${senior.lastName} (${senior.oscaId})`,
          adminId: session.userId,
        },
      });
    }

    return {
      success: true,
      data: {
        oscaId: senior.oscaId,
        password: password, // return plaintext password just once for printing
      },
    };
  } catch (error: any) {
    console.error("Error registering senior:", error);
    return { success: false, error: "Database error during registration." };
  }
}

export async function updateSeniorAction(id: string, data: any) {
  try {
    const updatedSenior = await prisma.senior.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        civilStatus: data.civilStatus,
        barangay: data.barangay,
        bloodType: data.bloodType || null,
        healthConditions: data.healthConditions || null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNum: data.emergencyContactNum,
      },
    });
    
    revalidatePath("/admin/seniors");
    revalidatePath(`/admin/seniors/${id}`);
    
    return { success: true, data: updatedSenior };
  } catch (error: any) {
    console.error("Error updating senior:", error);
    return { success: false, error: "Database error during update." };
  }
}

export async function deleteSeniorAction(id: string) {
  try {
    // Handle cascading deletes: delete related claims first
    await prisma.claim.deleteMany({
      where: { seniorId: id }
    });
    
    await prisma.senior.delete({
      where: { id }
    });
    
    revalidatePath("/admin/seniors");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting senior:", error);
    return { success: false, error: "Database error during deletion." };
  }
}
