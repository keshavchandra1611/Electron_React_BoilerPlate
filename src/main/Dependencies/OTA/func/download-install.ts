import { shell, app, dialog, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import log from 'electron-log';
import { getPlatformAsset } from './platform';
import { markInstallerForCleanup } from './installer-cleanup';

export async function downloadAndInstall(
  mainWindow: BrowserWindow,
  release: any,
) {
  const { download } = await import('electron-dl');
  const asset = getPlatformAsset(release);

  if (!asset) throw new Error('No installer found for your platform.');

  const downloadUrl = asset.browser_download_url;
  log.info(`Downloading from: ${downloadUrl}`);

  const result = await download(mainWindow, downloadUrl, {
    onProgress: (progress) => {
      mainWindow.webContents.send('download_progress', progress);
    },
    saveAs: false,
    overwrite: true,
    directory: app.getPath('temp'), // OR app.getPath('downloads')
  });

  const installerPath = result.getSavePath();
  markInstallerForCleanup(installerPath);
  log.info(`Downloaded update to: ${installerPath}`);

  // Fully release the app before the installer runs. The mainWindow 'close'
  // handler keeps the process alive ~1s for SDK cleanup (see main.ts), which
  // makes the NSIS installer complain that the app is still running. Destroy the
  // windows directly (bypasses the cancelable 'close' guard) so nothing holds a
  // lock on the app's exe.
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.destroy();
  });

  if (process.platform === 'win32') {
    // Launch the NSIS installer as an independent, detached process so it keeps
    // running after we exit, then hard-exit immediately (app.exit skips the
    // graceful 'close' handlers) so the installer sees no running instance.
    spawn(installerPath, [], { detached: true, stdio: 'ignore' }).unref();
    app.exit(0);
  } else {
    // macOS/Linux: open the .dmg / package in the default handler, then quit.
    await shell.openPath(installerPath);
    app.exit(0);
  }
}

export async function downloadOnly(mainWindow: BrowserWindow, release: any) {
  const { download } = await import('electron-dl');
  const asset = getPlatformAsset(release);

  if (!asset) throw new Error('No suitable file found.');

  const downloadUrl = asset.browser_download_url;
  const result = await download(mainWindow, downloadUrl, {
    onProgress: (progress) => {
      mainWindow.webContents.send('download_progress', progress);
    },
    saveAs: true,
  });

  return { path: result.getSavePath() };
}
