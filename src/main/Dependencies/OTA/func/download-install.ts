import { shell, app, dialog, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getPlatformAsset } from './platform';

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
    saveAs: true,
  });

  log.info(`Downloaded update to: ${result.getSavePath()}`);
  await shell.openPath(result.getSavePath());
  app.quit();
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
