"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase-server";
import { APP_DOC_BUCKET, detectMimeType } from "@/lib/application-documents";

const delegateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  contactNumber: z.string().min(11, "Valid Philippine contact number is required"),
});

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

export async function seniorAddDelegateAction(formData: FormData, photoUrl: string | null) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SENIOR") {
      return { success: false, error: "Unauthorized." };
    }

    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      relationship: formData.get("relationship") as string,
      contactNumber: formData.get("contactNumber") as string,
    };

    const parsed = delegateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const senior = await prisma.senior.findUnique({
      where: { id: session.userId },
      include: { delegate: true },
    });

    if (!senior) {
      return { success: false, error: "Senior not found." };
    }

    if (senior.delegate) {
      return { success: false, error: "You already have an active delegate." };
    }

    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    const delegate = await prisma.delegate.create({
      data: {
        fullName,
        relationship: parsed.data.relationship,
        contactNumber: parsed.data.contactNumber,
        idPhotoUrl: photoUrl,
      },
    });

    await prisma.senior.update({
      where: { id: session.userId },
      data: { delegateId: delegate.id },
    });

    revalidatePath("/senior/delegate");
    return { success: true };
  } catch (error) {
    console.error("Error creating delegate:", error);
    return { success: false, error: "Failed to create delegate." };
  }
}

export async function seniorUpdateDelegateAction(formData: FormData, photoUrl: string | null) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SENIOR") {
      return { success: false, error: "Unauthorized." };
    }

    const delegateId = formData.get("delegateId") as string;
    
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      relationship: formData.get("relationship") as string,
      contactNumber: formData.get("contactNumber") as string,
    };

    const parsed = delegateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    const existingDelegate = await prisma.delegate.findUnique({
      where: { id: delegateId },
    });

    if (!existingDelegate) {
      return { success: false, error: "Delegate not found." };
    }

    // Ownership check — ensure this delegate belongs to the requesting senior
    const ownerSenior = await prisma.senior.findFirst({
      where: { id: session.userId, delegateId: delegateId },
    });
    if (!ownerSenior) {
      return { success: false, error: "Forbidden. You do not own this delegate." };
    }

    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();

    await prisma.delegate.update({
      where: { id: delegateId },
      data: {
        fullName,
        relationship: parsed.data.relationship,
        contactNumber: parsed.data.contactNumber,
        ...(photoUrl && { idPhotoUrl: photoUrl })
      },
    });

    revalidatePath("/senior/delegate");
    return { success: true };
  } catch (error) {
    console.error("Error updating delegate:", error);
    return { success: false, error: "Failed to update delegate." };
  }
}

export async function seniorRemoveDelegateAction(delegateId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SENIOR") {
      return { success: false, error: "Unauthorized." };
    }

    const delegate = await prisma.delegate.findUnique({
      where: { id: delegateId },
      include: { seniors: true },
    });

    if (!delegate) {
      return { success: false, error: "Delegate not found." };
    }

    await prisma.senior.update({
      where: { id: session.userId },
      data: { delegateId: null },
    });
    
    const linkedSeniorsCount = await prisma.senior.count({
      where: { delegateId: delegateId }
    });

    if (linkedSeniorsCount === 0) {
      await prisma.delegate.delete({
        where: { id: delegateId },
      });
    }

    revalidatePath("/senior/delegate");
    return { success: true };
  } catch (error) {
    console.error("Error deleting delegate:", error);
    return { success: false, error: "Failed to remove delegate." };
  }
}

// ─── Senior: Submit Delegate Nomination Request ───────────────────────────────

export async function submitDelegateRequestAction(formData: FormData) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SENIOR") {
      return { success: false, error: "Unauthorized. Please log in as a senior." };
    }

    const firstName = (formData.get("firstName") as string || "").trim();
    const lastName = (formData.get("lastName") as string || "").trim();
    const relationship = (formData.get("relationship") as string || "").trim();
    const contactNumber = (formData.get("contactNumber") as string || "").trim();
    const file = formData.get("file") as File | null;

    if (!firstName || !lastName || !relationship || !contactNumber) {
      return { success: false, error: "All required delegate fields must be provided." };
    }

    const senior = await prisma.senior.findUnique({
      where: { id: session.userId },
      include: {
        delegate: true,
        delegateRequests: {
          where: { status: "Pending" },
        },
      },
    });

    if (!senior) {
      return { success: false, error: "Senior record not found." };
    }

    if (senior.delegate) {
      return { success: false, error: "You already have an active delegate assigned." };
    }

    if (senior.delegateRequests.length > 0) {
      return { success: false, error: "You already have a pending delegate nomination awaiting OSCA review." };
    }

    if (!file || file.size === 0) {
      return { success: false, error: "Please upload a photo or scan of the delegate's valid ID or document." };
    }

    if (file.size > 3 * 1024 * 1024) {
      return { success: false, error: "Document file exceeds 3MB limit." };
    }

    let documentStoragePath: string | null = null;

      const bytes = new Uint8Array(await file.arrayBuffer());
      const detected = detectMimeType(bytes);
      if (!detected) {
        return { success: false, error: "Invalid file type. Only JPG, PNG, and PDF are allowed." };
      }

      const safeExt = detected === "application/pdf" ? "pdf" : detected === "image/png" ? "png" : "jpg";
      const filename = `delegate-requests/${session.userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${safeExt}`;

      const { error: uploadError } = await supabaseServer.storage
        .from(APP_DOC_BUCKET)
        .upload(filename, bytes, {
          contentType: detected,
          upsert: false,
        });

      if (uploadError) {
        console.error("[submitDelegateRequest] Upload failed:", uploadError);
        return { success: false, error: "Failed to upload delegate document. Please try again." };
      }

      documentStoragePath = filename;

    const fullName = `${firstName} ${lastName}`.trim();

    await prisma.delegateRequest.create({
      data: {
        seniorId: session.userId,
        fullName,
        relationship,
        contactNumber,
        documentUrl: documentStoragePath,
        status: "Pending",
      },
    });

    // Notify Admins via activity log
    await prisma.activityLog.create({
      data: {
        action: "Submitted Delegate Nomination",
        details: `Senior ${senior.lastName}, ${senior.firstName} nominated ${fullName} (${relationship}) as delegate.`,
        adminId: "SYSTEM",
      },
    }).catch(() => {});

    revalidatePath("/senior/delegate");
    return { success: true };
  } catch (error) {
    console.error("[submitDelegateRequestAction] Error:", error);
    return { success: false, error: "Failed to submit delegate nomination. Please try again." };
  }
}

// ─── Senior: Cancel Pending Delegate Request ──────────────────────────────────

export async function cancelDelegateRequestAction(requestId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "SENIOR") {
      return { success: false, error: "Unauthorized." };
    }

    const request = await prisma.delegateRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.seniorId !== session.userId) {
      return { success: false, error: "Request not found." };
    }

    if (request.status !== "Pending") {
      return { success: false, error: "Only pending requests can be cancelled." };
    }

    // Clean up uploaded document if any
    if (request.documentUrl) {
      await supabaseServer.storage
        .from(APP_DOC_BUCKET)
        .remove([request.documentUrl])
        .catch(() => {});
    }

    await prisma.delegateRequest.delete({
      where: { id: requestId },
    });

    revalidatePath("/senior/delegate");
    return { success: true };
  } catch (error) {
    console.error("[cancelDelegateRequestAction] Error:", error);
    return { success: false, error: "Failed to cancel request." };
  }
}

// ─── Admin: Approve Delegate Request ──────────────────────────────────────────

export async function approveDelegateRequestAction(requestId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin role required." };
    }

    const request = await prisma.delegateRequest.findUnique({
      where: { id: requestId },
      include: { senior: true },
    });

    if (!request) {
      return { success: false, error: "Delegate request not found." };
    }

    if (request.status !== "Pending") {
      return { success: false, error: `This request is already ${request.status.toLowerCase()}.` };
    }

    if (request.senior.delegateId) {
      return { success: false, error: "Senior already has an active delegate. Remove the current delegate first." };
    }

    // Single transaction: create Delegate, update Senior, update Request, log, notify
    await prisma.$transaction(async (tx) => {
      const delegate = await tx.delegate.create({
        data: {
          fullName: request.fullName,
          relationship: request.relationship,
          contactNumber: request.contactNumber,
          idPhotoUrl: request.documentUrl,
        },
      });

      await tx.senior.update({
        where: { id: request.seniorId },
        data: { delegateId: delegate.id },
      });

      await tx.delegateRequest.update({
        where: { id: requestId },
        data: {
          status: "Approved",
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          action: "Approved Delegate Request",
          details: `Approved delegate ${request.fullName} (${request.relationship}) for senior ${request.senior.lastName}, ${request.senior.firstName} (OSCA: ${request.senior.oscaId}).`,
          adminId: session.userId,
        },
      });

      await tx.notification.create({
        data: {
          title: "Delegate Approved",
          message: `Your nominated delegate ${request.fullName} (${request.relationship}) has been approved by OSCA and is now active.`,
          type: "Alert",
          seniorId: request.seniorId,
        },
      });
    });

    revalidatePath("/senior/delegate");
    revalidatePath(`/admin/seniors/${request.seniorId}`);
    revalidatePath("/admin/delegates");
    return { success: true };
  } catch (error) {
    console.error("[approveDelegateRequestAction] Error:", error);
    return { success: false, error: "Failed to approve delegate request." };
  }
}

// ─── Admin: Reject Delegate Request ───────────────────────────────────────────

export async function rejectDelegateRequestAction(requestId: string, reason?: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin role required." };
    }

    const request = await prisma.delegateRequest.findUnique({
      where: { id: requestId },
      include: { senior: true },
    });

    if (!request) {
      return { success: false, error: "Delegate request not found." };
    }

    if (request.status !== "Pending") {
      return { success: false, error: `This request is already ${request.status.toLowerCase()}.` };
    }

    await prisma.$transaction(async (tx) => {
      await tx.delegateRequest.update({
        where: { id: requestId },
        data: {
          status: "Rejected",
          reviewNote: reason || null,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          action: "Rejected Delegate Request",
          details: `Rejected delegate request for ${request.fullName} (Senior: ${request.senior.lastName}, ${request.senior.firstName}). Reason: ${reason || "None specified"}`,
          adminId: session.userId,
        },
      });

      await tx.notification.create({
        data: {
          title: "Delegate Request Update",
          message: `Your nominated delegate request for ${request.fullName} was not approved.${reason ? ` Note: ${reason}` : ""}`,
          type: "Alert",
          seniorId: request.seniorId,
        },
      });
    });

    revalidatePath("/senior/delegate");
    revalidatePath(`/admin/seniors/${request.seniorId}`);
    revalidatePath("/admin/delegates");
    return { success: true };
  } catch (error) {
    console.error("[rejectDelegateRequestAction] Error:", error);
    return { success: false, error: "Failed to reject delegate request." };
  }
}

// ─── Admin: Fetch Paginated Delegate Requests with Signed URLs ────────────────

export async function getPendingDelegateRequestsCount(): Promise<number> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") return 0;
    return await prisma.delegateRequest.count({
      where: { status: "Pending" },
    });
  } catch {
    return 0;
  }
}

export async function getDelegateRequestsAction(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Admin role required." };
    }

    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Math.min(50, Number(params?.limit || 15)));
    const skip = (page - 1) * limit;

    const statusFilter = params?.status && params.status !== "all" ? params.status : undefined;
    const search = params?.search?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (statusFilter) {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { contactNumber: { contains: search } },
        { relationship: { contains: search, mode: "insensitive" } },
        {
          senior: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { oscaId: { contains: search, mode: "insensitive" } },
              { barangay: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [requests, total, pendingCount] = await Promise.all([
      prisma.delegateRequest.findMany({
        where,
        include: {
          senior: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              oscaId: true,
              barangay: true,
              contactNumber: true,
              delegateId: true,
            },
          },
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.delegateRequest.count({ where }),
      prisma.delegateRequest.count({ where: { status: "Pending" } }),
    ]);

    // Generate 1-hour signed URLs for any uploaded document paths in private bucket
    const requestsWithUrls = await Promise.all(
      requests.map(async (req) => {
        let signedDocUrl: string | null = null;
        if (req.documentUrl) {
          const { data } = await supabaseServer.storage
            .from(APP_DOC_BUCKET)
            .createSignedUrl(req.documentUrl, 3600);
          signedDocUrl = data?.signedUrl || null;
        }
        return {
          ...req,
          signedDocUrl,
        };
      })
    );

    return {
      success: true,
      requests: requestsWithUrls,
      total,
      pendingCount,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    console.error("[getDelegateRequestsAction] Error:", error);
    return { success: false, error: "Failed to load delegate requests." };
  }
}
