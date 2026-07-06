"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
export async function registerSeniorAction(data: any) {
  try {
    // 0. Anti-Duplication Security Lock
    const existingSenior = await prisma.senior.findFirst({
      where: {
        firstName: { equals: data.firstName, mode: 'insensitive' },
        lastName: { equals: data.lastName, mode: 'insensitive' },
        dateOfBirth: new Date(data.dateOfBirth)
      }
    });

    if (existingSenior) {
      return { success: false, error: "A senior citizen with this exact name and date of birth is already registered." };
    }

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
        photoUrl: data.photoUrl || null,
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

    // 6. Revalidate the list
    revalidatePath("/admin/seniors");
    revalidatePath("/admin");

    return {
      success: true,
      data: {
        id: senior.id,
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
    const session = await getSession();
    if (session && session.role === 'ADMIN') {
      await prisma.activityLog.create({
        data: {
          action: "Updated Senior",
          details: `Updated senior profile for ${updatedSenior.firstName} ${updatedSenior.lastName}`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath("/admin/seniors");
    revalidatePath(`/admin/seniors/${id}`);
    revalidatePath("/admin");
    
    return { success: true, data: updatedSenior };
  } catch (error: any) {
    console.error("Error updating senior:", error);
    return { success: false, error: "Database error during update." };
  }
}

export async function deleteSeniorAction(id: string) {
  try {
    const senior = await prisma.senior.findUnique({ where: { id } });

    // Handle cascading deletes: delete related claims first
    await prisma.claim.deleteMany({
      where: { seniorId: id }
    });
    
    await prisma.senior.delete({
      where: { id }
    });
    
    const session = await getSession();
    if (session && session.role === 'ADMIN' && senior) {
      await prisma.activityLog.create({
        data: {
          action: "Deleted Senior",
          details: `Deleted senior ${senior.firstName} ${senior.lastName}`,
          adminId: session.userId,
        },
      });
    }
    
    revalidatePath("/admin/seniors");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting senior:", error);
    return { success: false, error: "Database error during deletion." };
  }
}

export async function resetSeniorPasswordAction(id: string, newPassword: string) {
  try {
    const senior = await prisma.senior.findUnique({ where: { id } });
    if (!senior) return { success: false, error: "Senior not found." };

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.senior.update({
      where: { id },
      data: { passwordHash },
    });

    const session = await getSession();
    if (session && session.userId) {
      await prisma.activityLog.create({
        data: {
          action: "Reset Password",
          details: `Reset portal password for senior ${senior.firstName} ${senior.lastName} (${senior.oscaId})`,
          adminId: session.userId,
        },
      });
    }

    revalidatePath(`/admin/seniors/${id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return { success: false, error: "Database error during password reset." };
  }
}

export async function enrollFaceAction(seniorId: string, descriptorArray: number[]) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return { success: false, error: "Unauthorized. Admin access required." };
    }

    if (!descriptorArray || descriptorArray.length !== 128) {
      return { success: false, error: "Invalid face descriptor." };
    }

    const vectorStr = JSON.stringify(descriptorArray);
    
    // Use raw SQL because Prisma does not natively support pgvector fields
    const updatedCount = await prisma.$executeRaw`
      UPDATE "Senior" 
      SET face_embedding = ${vectorStr}::vector 
      WHERE id = ${seniorId}
    `;

    if (updatedCount === 0) {
      return { success: false, error: "Senior not found or update failed." };
    }

    await prisma.activityLog.create({
      data: {
        action: "Enrolled Face Data",
        details: `Successfully enrolled face biometric data for senior ID: ${seniorId}`,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/seniors");
    revalidatePath(`/admin/seniors/${seniorId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error saving face embedding:", error);
    return { success: false, error: "Database error while saving face data." };
  }
}

export async function uploadMonthlyPictureAction(seniorId: string, base64Picture: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SENIOR' || session.userId !== seniorId) {
      return { success: false, error: "Unauthorized." };
    }

    await prisma.senior.update({
      where: { id: seniorId },
      data: { 
        monthlyPictureUrl: base64Picture,
        lastPictureUpdate: new Date(),
      },
    });

    // Aggressively revalidate all paths to fix caching issues
    revalidatePath("/senior/profile");
    revalidatePath("/senior/dashboard");
    revalidatePath("/admin/seniors");
    revalidatePath(`/admin/seniors/${seniorId}`);
    revalidatePath("/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Error saving monthly picture:", error);
    return { success: false, error: `Database error: ${error?.message || error}` };
  }
}

