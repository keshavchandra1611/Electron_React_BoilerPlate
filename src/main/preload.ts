// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ElectronStoreHandler } from './Dependencies/ElectronStore/ElectronStoreType';

export type Channels = 'ipc-example';

const electronHandler: {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]): void;
    on(channel: Channels, func: (...args: unknown[]) => void): () => void;
    once(channel: Channels, func: (...args: unknown[]) => void): void;
    invoke(channel: Channels, ...args: unknown[]): Promise<unknown>;
  };
  electronStore: ElectronStoreHandler;
} = {
  ipcRenderer: {
    sendMessage(channel, ...args) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel, func) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel, func) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    async invoke(channel, ...args) {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
  electronStore: {
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
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;