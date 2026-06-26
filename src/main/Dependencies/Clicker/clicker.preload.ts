import RemoteControlService from '../../../SDK/clickerControl';
import { PortInfo } from './../../../SDK/init';
import { SerialMessageTypeInterface } from '../../../SDK/serial-commands.enum';

import { ipcRenderer } from 'electron';

export type ClickerSDKHandler = {
  list(): Promise<PortInfo[]>;
  open(): boolean;
  close(): boolean;
  write(payload: SerialMessageTypeInterface): boolean;
  pairClicker(macId: string): boolean;
  subscribeEvents(callback: (event: any) => void): void;
  unsubscribeEvents(): void;
};

export const ClickerSDKBridge: ClickerSDKHandler = {
  list: () => ipcRenderer.invoke('get-port-list'),
  open: () => RemoteControlService.open(),
  close: () => RemoteControlService.close(),
  write: (payload) => RemoteControlService.write(payload),
  pairClicker: (macId) =>
    RemoteControlService.write(
      `${SerialMessageTypeInterface.PAIR_CLICKER},${macId}`,
    ),
  subscribeEvents: (callback) => RemoteControlService.subscribeEvents(callback),
  unsubscribeEvents: () => RemoteControlService.unsubscribeEvents(),
};


// ✅ Listen for "app-closing" event from main process
ipcRenderer.on('app-closing', () => {
  try {
    console.log('⚙️ App closing — requesting main process cleanup');

    // Send event to renderer UI
    window.dispatchEvent(
      new CustomEvent('app-closing-event', {
        detail: 'App is closing, cleaning up SDK connections...',
      }),
    );

    RemoteControlService.write(SerialMessageTypeInterface.DISABLE_MULTI_MODE);
    setTimeout(() => {
      RemoteControlService.write(SerialMessageTypeInterface.END_PAIR);
    }, 100);
    // MyNote: For V2 version, use this ========================================
    // setTimeout(() => {
    //   RemoteControlService.writeForFirmwareUpdate(
    //     `${SerialMessageTypeInterface.UPDATE_CLICKER},0,wrong,wrong,wrong`,
    //   );
    // }, 200);
    // MyNote: ========================================

    // MyNote: For above V3 version, use this ========================================
    setTimeout(() => {
      RemoteControlService.write(
        SerialMessageTypeInterface.STOP_UPDATE_CLICKER,
      );
    }, 200);
    // MyNote: ========================================

    setTimeout(() => {
      RemoteControlService.close();
    }, 300);
    // ipcRenderer.send('cleanup-remote-control');
  } catch (err) {
    console.error('Failed to trigger cleanup:', err);
  }
});