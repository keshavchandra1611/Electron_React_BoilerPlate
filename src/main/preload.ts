// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge } from 'electron';
import {
  ElectronStoreBridge,
  ElectronStoreHandler,
} from './Dependencies/ElectronStore/ElectronStorePreload';
import {
  ipcRendererBridge,
  ipcRendererHandler,
} from './Dependencies/ipc/ipcPreload';

const electronHandler: {
  ipcRenderer: ipcRendererHandler;
  electronStore: ElectronStoreHandler;
} = {
  ipcRenderer: ipcRendererBridge,
  electronStore: ElectronStoreBridge,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
