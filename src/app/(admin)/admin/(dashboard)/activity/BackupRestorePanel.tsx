'use client';

import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function BackupRestorePanel() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to generate backup.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      a.download = match?.[1] ?? 'carelink-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('An unexpected error occurred during backup.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';

    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setRestoreStatus({ type: 'error', message: 'Please select a valid CareLink backup (.json) file.' });
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to restore from this backup file? This will overwrite existing system settings.'
    );
    if (!confirmed) return;

    setIsRestoring(true);
    setRestoreStatus(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) {
        setRestoreStatus({ type: 'error', message: data.error || 'Restore failed.' });
      } else {
        setRestoreStatus({ type: 'success', message: data.message });
      }
    } catch {
      setRestoreStatus({ type: 'error', message: 'An unexpected error occurred during restore.' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Database Backup &amp; Restore</h3>
        <p className="text-sm text-slate-500 mt-1">
          Download a full JSON backup of all application data, or restore from a previous backup file.
          Only SuperAdmins can perform this action.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Download Backup */}
        <button
          onClick={handleBackup}
          disabled={isDownloading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? 'Generating...' : 'Download Backup'}
        </button>

        {/* Restore from File */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isRestoring}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isRestoring ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isRestoring ? 'Restoring...' : 'Restore from File'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleRestoreFile}
        />
      </div>

      {restoreStatus && (
        <div
          className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            restoreStatus.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {restoreStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Backup includes all seniors, programs, claims, announcements, and system settings.
        Face embeddings are excluded from the backup file.
      </p>
    </div>
  );
}
