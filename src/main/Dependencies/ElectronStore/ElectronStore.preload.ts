import { ipcRenderer } from 'electron';

export type ElectronStoreHandler = {
  get: (key: string) => any; // returns whatever electronStore.get(key) returns
  set: (key: string, val: any) => void; // sends value to main
  delete: (key: string) => boolean; // returns true from main
  clear: () => void; // no return value
  getAll: () => any; // returns whatever electronStore.get(key) returns
};

export const ElectronStoreBridge: ElectronStoreHandler = {
  get(key) {
    return ipcRenderer.sendSync('electron-store-get', key);
  },
  set(key, val) {
    ipcRenderer.send('electron-store-set', key, val);
  },
  delete(key) {
    return ipcRenderer.sendSync('electron-store-delete', key);
  },
  // clear() {
  //   return ipcRenderer.sendSync('electron-store-clear');
  // },
  clear: () => ipcRenderer.invoke('electron-store-clear'),
  getAll: () => ipcRenderer.sendSync('electron-store-get-all'), // ✅ Added
};
