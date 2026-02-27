// OverTheAirUpdates
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import log from 'electron-log';
import {
  getLatestGitHubRelease,
  getAllGitHubReleases,
  getGitHubReleaseByTag,
} from './func/github-api';
import { downloadAndInstall, downloadOnly } from './func/download-install';

let mainWindow: BrowserWindow | null = null;

export function initOTAUpdater(window: BrowserWindow) {
  mainWindow = window;

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  /** 1️⃣ Check for updates */
  ipcMain.handle('check-for-updates', async () => {
    try {
      const release = await getLatestGitHubRelease();
      if (!release) throw new Error('No GitHub releases found.');

      const currentVersion = app.getVersion();
      const latestVersion = release.tag_name.replace(/^v/, '');
      const isUpdateAvailable = latestVersion !== currentVersion;

      log.info(`Current: ${currentVersion}, Latest: ${latestVersion}`);

      return { currentVersion, latestVersion, isUpdateAvailable, release };
    } catch (err: any) {
      log.error('Check update error:', err);
      dialog.showErrorBox('Update Check Error', err.message);
    }
  });

  /** 2️⃣ Get all versions */
  ipcMain.handle('get-all-versions', async () => {
    try {
      return await getAllGitHubReleases();
    } catch (err: any) {
      log.error('Get versions error:', err);
      dialog.showErrorBox('Error', err.message);
    }
  });

  /** 3️⃣ Install specific version */
  ipcMain.handle('install-specific-version', async (_, tag: string) => {
    try {
      const release = await getGitHubReleaseByTag(tag);
      if (!release) throw new Error(`Version ${tag} not found.`);
      await downloadAndInstall(mainWindow!, release);
    } catch (err: any) {
      log.error('Install specific version error:', err);
      dialog.showErrorBox('Install Error', err.message);
    }
  });

  /** 4️⃣ Install latest */
  ipcMain.handle('install-latest', async () => {
    try {
      const release = await getLatestGitHubRelease();
      if (!release) throw new Error('No releases found.');
      await downloadAndInstall(mainWindow!, release);
    } catch (err: any) {
      log.error('Install latest error:', err);
      dialog.showErrorBox('Install Error', err.message);
    }
  });

  /** 5️⃣ Download latest only (no install) */
  ipcMain.handle('download-latest', async () => {
    try {
      const release = await getLatestGitHubRelease();
      if (!release) throw new Error('No releases found.');
      return await downloadOnly(mainWindow!, release);
    } catch (err: any) {
      log.error('Download latest error:', err);
      dialog.showErrorBox('Download Error', err.message);
    }
  });
}
