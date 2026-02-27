import { ipcRenderer, IpcRendererEvent } from 'electron';

export type OTAHandler = {
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<any>;
  getAllVersions: () => Promise<any>;
  installSpecific: (tag: string) => Promise<void>;
  installLatest: () => Promise<void>;
  downloadLatest: () => Promise<any>;
  onDownloadProgress: (callback: (progress: any) => void) => void;
};

export const OTABridge: OTAHandler = {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getAllVersions: () => ipcRenderer.invoke('get-all-versions'),
  installSpecific: (tag: string) =>
    ipcRenderer.invoke('install-specific-version', tag),
  installLatest: () => ipcRenderer.invoke('install-latest'),
  downloadLatest: () => ipcRenderer.invoke('download-latest'),
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download_progress', (_, progress) => callback(progress));
  },
};
