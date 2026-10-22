"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  APP_DOC_BUCKET,
  MAX_IMAGE_SIZE,
  MAX_PDF_SIZE,
  detectMimeType,
  generateReferenceCode,
  type DocumentTypeId,
} from "@/lib/application-documents";
import { AGOO_BARANGAYS } from "@/lib/constants";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const applicationSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.string().refine((d) => {
    const dob = new Date(d);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 60;
  }, { message: "Applicant must be at least 60 years old." }),
  gender: z.string().min(1, "Gender is required"),
  civilStatus: z.string().min(1, "Civil status is required"),
  barangay: z.enum(AGOO_BARANGAYS as [string, ...string[]], {
    error: () => ({ message: "Please select a valid barangay." }),
  }),
  contactNumber: z.string().min(11, "Valid contact number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactNum: z.string().min(11, "Valid emergency contact number is required"),
  emergencyContactRel: z.string().min(1, "Relationship is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  submittedByName: z.string().optional(),
  submittedByRelationship: z.string().optional(),
});

// ─── Submit a new application ─────────────────────────────────────────────────

export async function submitApplicationAction(formData: FormData) {
  try {
    const raw = {
      firstName: formData.get("firstName") as string,
      middleName: formData.get("middleName") as string | undefined,
      lastName: formData.get("lastName") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      gender: formData.get("gender") as string,
      civilStatus: formData.get("civilStatus") as string,
      barangay: formData.get("barangay") as string,
      contactNumber: formData.get("contactNumber") as string,
      email: formData.get("email") as string | undefined,
      emergencyContactName: formData.get("emergencyContactName") as string,
      emergencyContactNum: formData.get("emergencyContactNum") as string,
      emergencyContactRel: formData.get("emergencyContactRel") as string,
      password: formData.get("password") as string,
      submittedByName: formData.get("submittedByName") as string | undefined,
      submittedByRelationship: formData.get("submittedByRelationship") as string | undefined,
    };

    const parsed = applicationSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const data = parsed.data;

    // Duplicate check: same full name + date of birth already pending or approved
    const duplicate = await prisma.application.findFirst({
      where: {
        firstName: { equals: data.firstName, mode: "insensitive" },
        lastName: { equals: data.lastName, mode: "insensitive" },
        dateOfBirth: new Date(data.dateOfBirth),
        status: { in: ["Pending", "NeedsReupload", "Approved"] },
      },
    });
    if (duplicate) {
      return {
        success: false,
        error: "An application with this name and date of birth already exists. Please check your application status using your reference code.",
      };
    }

    // Also check existing Senior records
    const existingSenior = await prisma.senior.findFirst({
      where: {
        firstName: { equals: data.firstName, mode: "insensitive" },
        lastName: { equals: data.lastName, mode: "insensitive" },
        dateOfBirth: new Date(data.dateOfBirth),
      },
    });
    if (existingSenior) {
      return {
        success: false,
        error: "A senior citizen with this name and date of birth is already registered in CareLink.",
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generate unique reference code (retry on collision — extremely unlikely)
    let referenceCode = "";
    for (let i = 0; i < 5; i++) {
      const candidate = generateReferenceCode();
      const exists = await prisma.application.findUnique({ where: { referenceCode: candidate } });
      if (!exists) { referenceCode = candidate; break; }
    }
    if (!referenceCode) {
      return { success: false, error: "Could not generate a reference code. Please try again." };
    }

    const application = await prisma.application.create({
      data: {
        referenceCode,
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        civilStatus: data.civilStatus,
        barangay: data.barangay,
        contactNumber: data.contactNumber,
        email: data.email || null,
        emergencyContactName: data.emergencyContactName,
        emergencyContactNum: data.emergencyContactNum,
        emergencyContactRel: data.emergencyContactRel,
        passwordHash,
        submittedByName: data.submittedByName || null,
        submittedByRelationship: data.submittedByRelationship || null,
      },
    });

    // Notify all admins about the new application
    const admins = await prisma.admin.findMany({ select: { id: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          title: "New Online Application",
          message: `${data.firstName} ${data.lastName} from Brgy. ${data.barangay} submitted an application (${referenceCode}).`,
          type: "Alert",
          adminId: a.id,
        })),
      });
    }

    return { success: true, referenceCode, applicationId: application.id };
  } catch (error) {
    console.error("[submitApplication]", error);
    return { success: false, error: "Submission failed. Please try again." };
  }
}

// ─── Upload a single document (called per file, server action) ─────────────────

export async function uploadApplicationDocumentAction(
  applicationId: string,
  docType: DocumentTypeId,
  formData: FormData
) {
  try {
    // Verify the application exists and is in an uploadable state
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { status: true, referenceCode: true },
    });
    if (!app) return { success: false, error: "Application not found." };
    if (!["Pending", "NeedsReupload"].includes(app.status)) {
      return { success: false, error: "Documents cannot be uploaded to a closed application." };
    }

    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided." };

    // Read first 12 bytes for magic-byte detection
    const headerBuffer = await file.slice(0, 12).arrayBuffer();
    const detectedMime = detectMimeType(new Uint8Array(headerBuffer));
    if (!detectedMime) {
      return {
        success: false,
        error: "Invalid file type. Accepted: JPG, PNG, WEBP, PDF.",
      };
    }

    // Size check
    const maxSize = detectedMime === "application/pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      const limitMB = maxSize / 1024 / 1024;
      return { success: false, error: `File exceeds the ${limitMB} MB limit.` };
    }

    // Build a random, non-guessable storage path
    const ext = detectedMime === "application/pdf" ? "pdf"
      : detectedMime === "image/png" ? "png"
      : detectedMime === "image/webp" ? "webp"
      : "jpg";
    const rand = Math.random().toString(36).slice(2, 10);
    const storagePath = `${applicationId}/${docType}-${Date.now()}-${rand}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Delete old file from storage if one already exists for this type
    const existing = await prisma.applicationDocument.findUnique({
      where: { applicationId_type: { applicationId, type: docType } },
    });
    if (existing) {
      await supabaseServer.storage.from(APP_DOC_BUCKET).remove([existing.storagePath]);
    }

    // Upload to the PRIVATE bucket
    const { error: uploadError } = await supabaseServer.storage
      .from(APP_DOC_BUCKET)
      .upload(storagePath, uint8, { contentType: detectedMime, upsert: false });

    if (uploadError) {
      console.error("[uploadApplicationDocument] Storage error:", uploadError);
      return { success: false, error: "File upload failed. Please try again." };
    }

    // Upsert the document record (replacing old row for same type)
    await prisma.applicationDocument.upsert({
      where: { applicationId_type: { applicationId, type: docType } },
      create: { applicationId, type: docType, storagePath, mimeType: detectedMime, sizeBytes: file.size },
      update: { storagePath, mimeType: detectedMime, sizeBytes: file.size, status: "Submitted", note: null },
    });

    return { success: true };
  } catch (error) {
    console.error("[uploadApplicationDocument]", error);
    return { success: false, error: "Unexpected error uploading document." };
  }
}

// ─── Track an application by reference code + date of birth ───────────────────

export async function trackApplicationAction(referenceCode: string, dateOfBirth: string) {
  try {
    const app = await prisma.application.findUnique({
      where: { referenceCode: referenceCode.trim().toUpperCase() },
      include: { documents: { select: { type: true, status: true, note: true } } },
    });

    if (!app) return { success: false, error: "No application found with that reference code." };

    // Verify DOB — simple privacy gate, no brute-force needed here
    // (reference codes are already opaque)
    const appDob = new Date(app.dateOfBirth).toISOString().slice(0, 10);
    const inputDob = new Date(dateOfBirth).toISOString().slice(0, 10);
    if (appDob !== inputDob) {
      return { success: false, error: "The date of birth does not match our records." };
    }

    return {
      success: true,
      application: {
        id: app.id,
        referenceCode: app.referenceCode,
        status: app.status,
        firstName: app.firstName,
        lastName: app.lastName,
        barangay: app.barangay,
        reviewNote: app.reviewNote,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        documents: app.documents,
      },
    };
  } catch (error) {
    console.error("[trackApplication]", error);
    return { success: false, error: "Could not retrieve application status." };
  }
}

// ─── Admin: list applications (paginated, filterable) ─────────────────────────

export async function getApplicationsAction(params?: {
  status?: string;
  barangay?: string;
  search?: string;
  page?: number;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized." };

  try {
    const page = params?.page ?? 1;
    const take = 20;
    const skip = (page - 1) * take;

    const where: Record<string, unknown> = {};
    if (params?.status && params.status !== "All") where.status = params.status;
    if (params?.barangay) where.barangay = params.barangay;
    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName:  { contains: params.search, mode: "insensitive" } },
        { referenceCode: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          documents: { select: { type: true, status: true } },
        },
      }),
      prisma.application.count({ where }),
    ]);

    const pending = await prisma.application.count({ where: { status: "Pending" } });
    const needsReupload = await prisma.application.count({ where: { status: "NeedsReupload" } });

    return { success: true, applications, total, page, pending, needsReupload };
  } catch (error) {
    console.error("[getApplications]", error);
    return { success: false, error: "Failed to fetch applications." };
  }
}

// ─── Admin: get single application detail with signed document URLs ────────────

export async function getApplicationDetailAction(applicationId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized." };

  try {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { documents: true },
    });
    if (!app) return { success: false, error: "Application not found." };

    // Generate 5-minute signed URLs for each document
    const documentsWithUrls = await Promise.all(
      app.documents.map(async (doc) => {
        const { data, error } = await supabaseServer.storage
          .from(APP_DOC_BUCKET)
          .createSignedUrl(doc.storagePath, 300); // 5 min TTL
        return { ...doc, signedUrl: error ? null : data?.signedUrl ?? null };
      })
    );

    // Reviewer name (non-fatal if admin deleted)
    let reviewerName: string | null = null;
    if (app.reviewedById) {
      const reviewer = await prisma.admin.findUnique({
        where: { id: app.reviewedById },
        select: { fullName: true },
      });
      reviewerName = reviewer?.fullName ?? null;
    }

    return {
      success: true,
      application: {
        ...app,
        dateOfBirth: app.dateOfBirth.toISOString(),
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
        reviewedAt: app.reviewedAt?.toISOString() ?? null,
      },
      documents: documentsWithUrls,
      reviewerName,
    };
  } catch (error) {
    console.error("[getApplicationDetail]", error);
    return { success: false, error: "Failed to load application details." };
  }
}

// ─── Admin: approve an application ───────────────────────────────────────────

export async function approveApplicationAction(applicationId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized." };

  try {
    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { documents: true },
    });
    if (!app) return { success: false, error: "Application not found." };
    if (app.status === "Approved") return { success: false, error: "Application is already approved." };
    if (app.status === "Rejected") return { success: false, error: "A rejected application cannot be approved." };

    // Duplicate Senior guard (run again at approval time)
    const duplicate = await prisma.senior.findFirst({
      where: {
        firstName: { equals: app.firstName, mode: "insensitive" },
        lastName:  { equals: app.lastName,  mode: "insensitive" },
        dateOfBirth: app.dateOfBirth,
      },
    });
    if (duplicate) {
      return {
        success: false,
        error: "A senior with this name and date of birth is already registered.",
      };
    }

    // Generate OSCA ID — same algorithm as registerSeniorAction
    const year = new Date().getFullYear();
    const yearPrefix = `${year}-`;
    const result = await prisma.$queryRaw<{ max_seq: number | null }[]>`
      SELECT MAX(CAST(SUBSTRING("oscaId" FROM CAST(${yearPrefix.length + 1} AS INTEGER)) AS INTEGER)) AS max_seq
      FROM "Senior"
      WHERE "oscaId" LIKE ${yearPrefix + '%'}
    `;
    const lastSeq = result[0]?.max_seq ?? 0;
    const oscaId = `${yearPrefix}${String(lastSeq + 1).padStart(4, "0")}`;

    // Optional: copy 2x2 application photo to public senior-photos bucket for portal avatar
    let photoUrl: string | undefined = undefined;
    const photoDoc = app.documents.find((d) => d.type === "photo");
    if (photoDoc) {
      try {
        const { data: fileBlob } = await supabaseServer.storage
          .from(APP_DOC_BUCKET)
          .download(photoDoc.storagePath);
        if (fileBlob) {
          const arrayBuffer = await fileBlob.arrayBuffer();
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = photoDoc.mimeType === "image/png" ? ".png" : photoDoc.mimeType === "image/webp" ? ".webp" : ".jpg";
          const filename = `photo-${uniqueSuffix}${ext}`;
          const { error: uploadErr } = await supabaseServer.storage
            .from("senior-photos")
            .upload(filename, new Uint8Array(arrayBuffer), {
              contentType: photoDoc.mimeType,
              upsert: false,
            });
          if (!uploadErr) {
            const { data: { publicUrl } } = supabaseServer.storage.from("senior-photos").getPublicUrl(filename);
            photoUrl = publicUrl;
          }
        }
      } catch (err) {
        console.warn("[approveApplication] Could not copy photo to senior-photos:", err);
      }
    }

    // Run approval as a single transaction: create Delegate (if applicable), create Senior, update Application, log, notify
    const senior = await prisma.$transaction(async (tx) => {
      // If a delegate was specified in the application, auto-create their official Delegate record
      let delegateId: string | undefined = undefined;
      if (app.submittedByName && app.submittedByName.trim()) {
        const delegate = await tx.delegate.create({
          data: {
            fullName: app.submittedByName.trim(),
            relationship: app.submittedByRelationship?.trim() || "Authorized Representative",
            contactNumber: app.emergencyContactNum || app.contactNumber,
          },
        });
        delegateId = delegate.id;
      }

      const newSenior = await tx.senior.create({
        data: {
          oscaId,
          firstName: app.firstName,
          middleName: app.middleName,
          lastName: app.lastName,
          dateOfBirth: app.dateOfBirth,
          gender: app.gender,
          civilStatus: app.civilStatus,
          barangay: app.barangay,
          contactNumber: app.contactNumber,
          email: app.email,
          emergencyContactName: app.emergencyContactName,
          emergencyContactNum: app.emergencyContactNum,
          emergencyContactRel: app.emergencyContactRel,
          passwordHash: app.passwordHash,
          delegateId,
          photoUrl,
        },
      });

      await tx.application.update({
        where: { id: applicationId },
        data: {
          status: "Approved",
          seniorId: newSenior.id,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });

      // Mark all documents in this application as Accepted
      await tx.applicationDocument.updateMany({
        where: { applicationId },
        data: { status: "Accepted" },
      });

      await tx.activityLog.create({
        data: {
          action: "Approved Online Application",
          details: `Approved application ${app.referenceCode} — ${app.firstName} ${app.lastName}. OSCA ID: ${oscaId}${
            delegateId ? ` (Assigned Delegate: ${app.submittedByName})` : ""
          }`,
          adminId: session.userId,
        },
      });

      // In-app notification to the newly created senior
      await tx.notification.create({
        data: {
          title: "Application Approved",
          message: `Congratulations! Your CareLink application has been approved. Your OSCA ID is ${oscaId}. You can now log in to the Senior Portal.`,
          type: "Alert",
          seniorId: newSenior.id,
        },
      });

      return newSenior;
    });

    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${applicationId}`);
    revalidatePath("/admin/seniors");
    revalidatePath("/admin");

    return { success: true, oscaId: senior.oscaId, seniorId: senior.id };
  } catch (error) {
    console.error("[approveApplication]", error);
    return { success: false, error: "Approval failed. Please try again." };
  }
}

// ─── Admin: reject an application ────────────────────────────────────────────

export async function rejectApplicationAction(applicationId: string, reason: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized." };

  if (!reason?.trim()) return { success: false, error: "A reason is required when rejecting an application." };

  try {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return { success: false, error: "Application not found." };
    if (["Approved", "Rejected"].includes(app.status)) {
      return { success: false, error: "Application is already closed." };
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "Rejected",
        reviewNote: reason.trim(),
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "Rejected Online Application",
        details: `Rejected application ${app.referenceCode} — ${app.firstName} ${app.lastName}. Reason: ${reason.trim()}`,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error("[rejectApplication]", error);
    return { success: false, error: "Rejection failed. Please try again." };
  }
}

// ─── Admin: request document re-upload ────────────────────────────────────────

export async function requestReuploadAction(
  applicationId: string,
  docType: string,
  note: string
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return { success: false, error: "Unauthorized." };

  if (!note?.trim()) return { success: false, error: "Please provide a note explaining what needs to be re-uploaded." };

  try {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return { success: false, error: "Application not found." };
    if (["Approved", "Rejected"].includes(app.status)) {
      return { success: false, error: "Application is already closed." };
    }

    // Mark the specific document as needing re-upload
    await prisma.applicationDocument.update({
      where: { applicationId_type: { applicationId, type: docType } },
      data: { status: "NeedsReupload", note: note.trim() },
    });

    // Set the parent application status
    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: "NeedsReupload",
        reviewNote: note.trim(),
        reviewedById: session.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "Requested Document Re-upload",
        details: `Requested re-upload of '${docType}' for application ${app.referenceCode} — ${app.firstName} ${app.lastName}. Note: ${note.trim()}`,
        adminId: session.userId,
      },
    });

    revalidatePath("/admin/applications");
    revalidatePath(`/admin/applications/${applicationId}`);

    return { success: true };
  } catch (error) {
    console.error("[requestReupload]", error);
    return { success: false, error: "Failed to request re-upload." };
  }
}

// ─── Admin: pending count (for sidebar badge) ─────────────────────────────────

export async function getPendingApplicationsCount() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return 0;

  try {
    return await prisma.application.count({
      where: { status: { in: ["Pending", "NeedsReupload"] } },
    });
  } catch {
    return 0;
  }
}
