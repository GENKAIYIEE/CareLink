import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Config ignored in App Router, manual check implemented in POST

type BackupFile = {
  version: string;
  exportedAt: string;
  tables: {
    systemSettings?: { key: string; value: string }[];
    // All other tables are restored read-only (no upsert for sensitive data like passwords)
  };
};

export async function POST(req: NextRequest) {
  // Auth: SuperAdmin only
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: session.userId } });
  if (!admin || admin.role !== 'SuperAdmin') {
    return NextResponse.json({ error: 'Forbidden: SuperAdmin access required.' }, { status: 403 });
  }

  let backup: BackupFile;
  try {
    const body = await req.text();
    // Manual size limit: 50MB (approx 50 * 1024 * 1024 bytes)
    if (body.length > 52428800) {
      return NextResponse.json({ error: 'Payload too large. Max 50MB.' }, { status: 413 });
    }
    backup = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON file.' }, { status: 400 });
  }

  if (!backup?.version || !backup?.tables) {
    return NextResponse.json({ error: 'Invalid backup format. Missing required fields.' }, { status: 400 });
  }

  // ── Restore SystemSettings only (safe to upsert, no PII) ──────────────────
  // Full table restores (seniors, admins, etc.) are deliberately excluded from
  // automated restore to prevent accidental data destruction in production.
  // The backup JSON can be used by a DBA for manual selective restoration.
  const results: string[] = [];

  if (backup.tables.systemSettings && Array.isArray(backup.tables.systemSettings)) {
    for (const setting of backup.tables.systemSettings) {
      if (setting.key && setting.value) {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        });
      }
    }
    results.push(`${backup.tables.systemSettings.length} system setting(s) restored.`);
  }

  // Log the restore action
  await prisma.activityLog.create({
    data: {
      action: 'DATABASE_RESTORE',
      details: `Backup restore initiated from file exported on ${backup.exportedAt}. Restored: ${results.join(', ')}`,
      adminId: admin.id,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Restore complete. ${results.join(' ')}`,
    restoredAt: new Date().toISOString(),
  });
}
