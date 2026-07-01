import fs from 'fs';
import ElectronStore from 'electron-store';
import log from 'electron-log';

/**
 * Deferred cleanup of the downloaded update installer.
 *
 * The installer can't be deleted right after it's launched: the app exits
 * immediately (so no code is left to delete it) and Windows locks the .exe while
 * it's running. Instead we remember the path here and delete it on the NEXT
 * launch of the (freshly-installed) app, by which point the file is unlocked.
 *
 * NOT wired up yet — call `markInstallerForCleanup()` right after the download
 * finishes (in download-install.ts) and `cleanupPendingInstaller()` once on app
 * startup (in main.ts) to activate it.
 */

// Uses the default electron-store file, so this key is shared with the rest of
// the app's store (a fresh instance still points at the same config.json).
const store = new ElectronStore();
const PENDING_KEY = 'pendingInstallerCleanup';

/** Remember an installer path to delete on the next app launch. */
export function markInstallerForCleanup(installerPath: string): void {
  try {
    store.set(PENDING_KEY, installerPath);
    log.info(`[installer-cleanup] marked for deletion: ${installerPath}`);
  } catch (err) {
    log.warn('[installer-cleanup] failed to mark installer:', err);
  }
}

/**
 * Delete any installer left over from a previous update, then clear the marker.
 * Safe to call unconditionally on startup — it's a no-op when nothing is pending.
 */
export function cleanupPendingInstaller(): void {
  const pending = store.get(PENDING_KEY) as string | undefined;
  if (!pending) return;

  try {
    if (fs.existsSync(pending)) {
      fs.unlinkSync(pending);
      log.info(`[installer-cleanup] deleted leftover installer: ${pending}`);
    }
  } catch (err) {
    // File may be gone, still locked, or on a path we can't touch — never let
    // cleanup crash startup. It'll just be retried (or the OS clears temp).
    log.warn('[installer-cleanup] could not delete installer:', err);
  } finally {
    store.delete(PENDING_KEY);
  }
}
