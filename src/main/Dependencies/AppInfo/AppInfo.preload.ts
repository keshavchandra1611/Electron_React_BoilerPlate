import { ipcRenderer } from 'electron';

export type AppInfoHandler = {
  /** The app's real running version (from the packaged package.json). */
  getVersion(): Promise<string>;
  /** The app's product name. */
  getName(): Promise<string>;
};

export const AppInfoBridge: AppInfoHandler = {
  getVersion() {
    return ipcRenderer.invoke('app-info:get-version');
  },
  getName() {
    return ipcRenderer.invoke('app-info:get-name');
  },
};
