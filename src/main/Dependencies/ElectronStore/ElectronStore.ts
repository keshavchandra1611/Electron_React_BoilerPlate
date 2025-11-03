import { ipcMain } from 'electron';
import ElectronStore from 'electron-store';
const electronStore = new ElectronStore();

// ========== ELECTRON STORE IPC ==========
ipcMain.on('electron-store-get', (event, val) => {
  event.returnValue = electronStore?.get(val);
});
ipcMain.on('electron-store-set', (_event, key, val) => {
  electronStore?.set(key, val);
});
ipcMain.on('electron-store-delete', (event, key) => {
  electronStore?.delete(key);
  event.returnValue = true;
});
// ipcMain.on('electron-store-clear', () => {
//   electronStore?.clear();
// });

ipcMain.handle('electron-store-clear', async () => {
  electronStore.clear();
  return true; // send a response to unblock the renderer
});

// ✅ NEW: Return the entire store object
ipcMain.on('electron-store-get-all', (event) => {
  event.returnValue = electronStore.store;
});
