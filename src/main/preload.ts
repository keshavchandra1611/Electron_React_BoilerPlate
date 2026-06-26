// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge } from 'electron';
import {
  ElectronStoreBridge,
  ElectronStoreHandler,
} from './Dependencies/ElectronStore/ElectronStore.preload';
import {
  ipcRendererBridge,
  ipcRendererHandler,
} from './Dependencies/ipc/ipc.preload';
import { envBridge, EnvHandler } from './Dependencies/env/env.preload';
import { OTABridge, OTAHandler } from './Dependencies/OTA/OTA.preload';
import { ClickerSDKBridge, ClickerSDKHandler} from './Dependencies/Clicker/clicker.preload';

const electronHandler: {
  ipcRenderer: ipcRendererHandler;
  electronStore: ElectronStoreHandler;
  env: EnvHandler;
  OverTheAirUpdates: OTAHandler;
  clickerSDK: ClickerSDKHandler;
} = {
  ipcRenderer: ipcRendererBridge,
  electronStore: ElectronStoreBridge,
  env: envBridge,
  OverTheAirUpdates: OTABridge,
  clickerSDK: ClickerSDKBridge,
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
