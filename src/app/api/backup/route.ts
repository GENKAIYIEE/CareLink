import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  // Auth: SuperAdmin only
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify SuperAdmin role from DB
  const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
  if (!admin || admin.role !== 'SuperAdmin') {
    return NextResponse.json({ error: 'Forbidden: SuperAdmin access required.' }, { status: 403 });
  }

  // Fetch all table data in parallel
  const [
    admins,
    seniors,
    delegates,
    benefitPrograms,
    claims,
    announcements,
    activityLogs,
    systemSettings,
    notifications,
  ] = await Promise.all([
    // Exclude passwordHash — bcrypt hash, not needed for restore and reduces leak surface
    prisma.admin.findMany({ select: {
      id: true, email: true, fullName: true, role: true, createdAt: true,
    }}),
    prisma.senior.findMany({ select: {
      id: true, oscaId: true, email: true, firstName: true, middleName: true,
      lastName: true, gender: true, civilStatus: true, dateOfBirth: true,
      bloodType: true, healthConditions: true, photoUrl: true,
      emergencyContactName: true, emergencyContactNum: true, emergencyContactRel: true,
      status: true, barangay: true, contactNumber: true,
      delegateId: true, createdAt: true, updatedAt: true,
      // Exclude face_embedding — binary vector, not portable
    }}),
    prisma.delegate.findMany(),
    prisma.benefitProgram.findMany(),
    prisma.claim.findMany(),
    prisma.announcement.findMany(),
    prisma.activityLog.findMany(),
    prisma.systemSetting.findMany(),
    prisma.notification.findMany(),
  ]);

  const backup = {
    exportedAt: new Date().toISOString(),
    exportedBy: admin.fullName,
    version: '1.0',
    tables: {
      admins,
      seniors,
      delegates,
      benefitPrograms,
      claims,
      announcements,
      activityLogs,
      systemSettings,
      notifications,
    },
  };

  const filename = `carelink-backup-${new Date().toISOString().split('T')[0]}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
