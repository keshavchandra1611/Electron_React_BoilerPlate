import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import log from 'electron-log';
import https from 'https';

let mainWindow: BrowserWindow;

export function initUpdater(window: BrowserWindow) {
  mainWindow = window;

  ipcMain.handle('install-new-version', async () => {
    const { download } = await import('electron-dl');

    try {
      const currentVersion = app.getVersion();
      const release = await getLatestGitHubRelease();
      
      console.log("release")
      console.log(release)

      if (!release) {
        dialog.showErrorBox('Update', 'No GitHub releases found.');
        return;
      }

      const latestVersion = release.tag_name.replace(/^v/, '');
      log.info(`Current version: ${currentVersion}, Latest: ${latestVersion}`);

      if (latestVersion === currentVersion) {
        dialog.showMessageBox({
          type: 'info',
          title: 'No Update Found',
          message: `You are already on the latest version (${currentVersion}).`,
        });
        return;
      }

      // ✅ Pick correct file for the current platform & architecture
      const asset = getPlatformAsset(release);

      if (!asset) {
        dialog.showErrorBox(
          'Update',
          'No suitable installer found for your OS/architecture.',
        );
        return;
      }

      const downloadUrl = asset.browser_download_url;
      log.info(`Downloading update from: ${downloadUrl}`);

      const downloadDetails = await download(mainWindow, downloadUrl, {
        onProgress: (progress) => {
          mainWindow.webContents.send('download_progress', progress);
        },
        saveAs: false,
      });

      const newVersionPath = downloadDetails.getSavePath();
      log.info(`Downloaded new version to: ${newVersionPath}`);

      await shell.openPath(newVersionPath);
      app.quit();
    } catch (error) {
      log.error('Update install error:', error);
      dialog.showErrorBox('Update Error', String(error));
    }
  });
}

// ✅ GitHub release fetcher
function getLatestGitHubRelease(): Promise<any> {
  return new Promise((resolve, reject) => {
    const repo = 'keshavchandra1611/pi-clickers-firmware-updates';
    const options = {
      headers: { 'User-Agent': 'Electron-App-Updater' },
    };

    https
      .get(
        `https://api.github.com/repos/${repo}/releases/latest`,
        options,
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        },
      )
      .on('error', reject);
  });
}

// ✅ Helper: Pick correct asset per OS + CPU architecture
function getPlatformAsset(release: any): any {
  const platform = process.platform; // 'win32', 'darwin', 'linux'
  const arch = process.arch; // 'x64', 'arm64', etc.
  const assets = release.assets || [];

  if (platform === 'win32') {
    // Windows -> Prefer .exe
    return (
      assets.find((a: any) => a.name.endsWith('.exe')) ||
      assets.find((a: any) => a.name.toLowerCase().includes('win'))
    );
  }

  if (platform === 'darwin') {
    // macOS -> Pick architecture-specific .dmg
    const archTag = arch === 'arm64' ? 'arm64' : 'x64';
    return (
      assets.find(
        (a: any) =>
          a.name.endsWith('.dmg') &&
          a.name.toLowerCase().includes(archTag.toLowerCase()),
      ) || assets.find((a: any) => a.name.endsWith('.dmg'))
    );
  }

  if (platform === 'linux') {
    // Linux -> Prefer .AppImage or tar.gz
    return (
      assets.find((a: any) => a.name.endsWith('.AppImage')) ||
      assets.find((a: any) => a.name.endsWith('.tar.gz'))
    );
  }

  return null;
}
