import { ipcRenderer, IpcRendererEvent } from 'electron';
import { Channels } from './../../channels';

export type ipcRendererHandler = {
  sendMessage(channel: Channels, ...args: unknown[]): void;
  on(channel: Channels, func: (...args: unknown[]) => void): () => void;
  once(channel: Channels, func: (...args: unknown[]) => void): void;
  invoke(channel: Channels, ...args: unknown[]): Promise<unknown>;
};

export const ipcRendererBridge: ipcRendererHandler = {
  sendMessage(channel, ...args) {
    ipcRenderer.send(channel, ...args);
  },
  on(channel, func) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      func(...args);
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
};
