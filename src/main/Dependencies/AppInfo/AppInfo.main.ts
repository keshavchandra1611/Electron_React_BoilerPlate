import { app, ipcMain } from 'electron';

// Expose the app's real runtime identity to the renderer. `app.getVersion()` /
// `app.getName()` read the packaged package.json — the source of truth the
// auto-updater compares against — rather than a hand-maintained JSON file.

ipcMain.handle('app-info:get-version', () => app.getVersion());

ipcMain.handle('app-info:get-name', () => app.getName());
