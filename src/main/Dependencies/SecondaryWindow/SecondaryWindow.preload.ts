import { ipcRenderer, IpcRendererEvent } from 'electron';

export type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SecondaryWindowHandler = {
  open(): Promise<void>;
  close(): Promise<void>;
  toggle(): Promise<boolean>;
  isOpen(): Promise<boolean>;
  setCollapsed(collapsed: boolean): Promise<void>;
  getBounds(): Promise<WindowBounds | null>;
  setPosition(x: number, y: number): Promise<void>;
  snapToEdge(): Promise<void>;
  /** Subscribe to open/close changes. Returns an unsubscribe function. */
  onStateChange(callback: (isOpen: boolean) => void): () => void;
};

export const SecondaryWindowBridge: SecondaryWindowHandler = {
  open() {
    return ipcRenderer.invoke('secondary-window:open');
  },
  close() {
    return ipcRenderer.invoke('secondary-window:close');
  },
  toggle() {
    return ipcRenderer.invoke('secondary-window:toggle');
  },
  isOpen() {
    return ipcRenderer.invoke('secondary-window:is-open');
  },
  setCollapsed(collapsed) {
    return ipcRenderer.invoke('secondary-window:set-collapsed', collapsed);
  },
  getBounds() {
    return ipcRenderer.invoke('secondary-window:get-bounds');
  },
  setPosition(x, y) {
    return ipcRenderer.invoke('secondary-window:set-position', x, y);
  },
  snapToEdge() {
    return ipcRenderer.invoke('secondary-window:snap-to-edge');
  },
  onStateChange(callback) {
    const subscription = (_event: IpcRendererEvent, isOpen: boolean) =>
      callback(isOpen);
    ipcRenderer.on('secondary-window:state', subscription);
    return () => {
      ipcRenderer.removeListener('secondary-window:state', subscription);
    };
  },
};
