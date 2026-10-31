/**
 * When the user last exported their progress file. Kept out of the exported
 * payload: importing a file from another device must not claim this device was
 * backed up.
 */

const LAST_BACKUP_KEY = "goyo-last-backup";

export function recordBackup(at = new Date()): void {
  try {
    localStorage.setItem(LAST_BACKUP_KEY, at.toISOString());
  } catch {
    /* storage may be unavailable; the age line then stays silent */
  }
}

export function getLastBackupAt(): Date | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(date: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

export function describeBackupAge(lastBackupAt: Date | null, now = new Date()): string {
  if (!lastBackupAt) return "Progress has never been exported from this device.";
  const days = daysSince(lastBackupAt, now);
  if (days === 0) return "Last backed up today.";
  if (days === 1) return "Last backed up yesterday.";
  return `Last backed up ${days} days ago.`;
}

export function isBackupOverdue(lastBackupAt: Date | null, now = new Date(), staleAfterDays = 7): boolean {
  return !lastBackupAt || daysSince(lastBackupAt, now) >= staleAfterDays;
}
