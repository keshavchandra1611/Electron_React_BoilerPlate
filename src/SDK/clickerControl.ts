import { Subject, Subscription } from 'rxjs';
import ElectronService from 'electron';

class RemoteControlService {
  private events: Subject<any>;
  private isListening: boolean;
  private subscription: Subscription | null = null;

  private subscription1: Subscription | null = null;

  constructor() {
    this.events = new Subject();
    this.isListening = false;
  }

  open() {
    // console.log("open")
    if (!checkElectronValidity()) return false;
    if (!this.isListening) {
      this.isListening = true;
      ElectronService.ipcRenderer.on('serialport', (event, data) => {
        onSerialPortData(this.events, event, data);
      });
    }
    ElectronService.ipcRenderer.send('serialport', { type: 'open' });
    return true;
  }

  close() {
    if (!checkElectronValidity()) return false;
    ElectronService.ipcRenderer.send('serialport', {
      type: 'close',
    });
    return true;
  }

  write(payload: string) {
    // Emit the payload to any subscriber in your app
    if (!checkElectronValidity()) return false;
    ElectronService.ipcRenderer.send('serialport', { type: 'write', payload });
    return true;
  }

  subscribeEvents(callbackArg: (data: any) => void) {
    if (this.subscription) {
      this.unsubscribeEvents();
    }
    this.subscription = this.events.subscribe((data) => callbackArg(data));
  }

  unsubscribeEvents() {
    if (this.subscription) {
      this.subscription?.unsubscribe();
      this.subscription = null;
    }
  }

  subscribeEventsSlots(slot: 1, callbackArg: (data: any) => void) {
    this.unsubscribeSlots(slot); // ensure clean before re-subscribing
    const sub = this.events.subscribe((data) => callbackArg(data));
    if (slot === 1) this.subscription1 = sub;
    // else if (slot === 2) this.subscription2 = sub;
    // else if (slot === 3) this.subscription3 = sub;
  }
  unsubscribeSlots(slot: 1) {
    const subs = [this.subscription1];
    const sub = subs[slot - 1];
    if (sub) sub.unsubscribe();

    if (slot === 1) this.subscription1 = null;
  }
  unsubscribeAll() {
    this.unsubscribeSlots(1);
    this.unsubscribeEvents();
  }
}

function checkElectronValidity() {
  // if (!window.navigator.userAgent.match(/Electron/)) {
  //   console.log('this is not electron app');
  //   return false;
  // }
  if (!ElectronService.ipcRenderer) {
    console.log('you are calling from ipcMain');
    return false;
  }
  return true;
}

// Event "coming from Main Process" and "Going/forwarding to Renderer Process"
// e.g., init.ts has webContents.send('', ''). those are coming here
function onSerialPortData(events: Subject<any>, event: any, data: any) {
  const eventsSubject = events;

  // console.log("onSerialPortData | clickerControl.ts: ", data)

  // These will trigger the subscribeEvents function above
  // console.log(data)
  switch (data.type) {
    case 'opened':
      eventsSubject.next({ type: 'opened' });
      break;
    case 'closed':
      eventsSubject.next({ type: 'closed', payload: data.message });
      break;
    case 'error':
      eventsSubject.next({ type: 'error', payload: data.payload });
      break;
    case 'data':
      // let payload = formatData(data.payload);
      let payload = data.payload;
      if (payload) {
        eventsSubject.next({
          type: 'data',
          payload,
        });
      }
      break;

    // Can be introduced in future

    // case 'disconnected': // New case for USB disconnection
    //   eventsSubject.next({ type: 'disconnected' });

    //   eventsSubject.next({
    //     type: 'error',
    //     payload: {
    //       message: 'USB device disconnected. Please reconnect the device.',
    //     },
    //   });
    //   break;
    // case 'reconnected': // New case for USB reconnection
    //   eventsSubject.next({ type: 'reconnected' });
    //   break;

    default:
      // Handle any unknown cases
      console.warn('Unknown data type received:', data.type);
      eventsSubject.next({
        type: 'error',
        payload: { message: `Unknown data type: ${data.type}` },
      });
      break;
  }
}

function formatData(data: string) {
  if (!data) return null;
  const start = data.indexOf('{');
  const end = data.indexOf('}');

  if (start === -1 || end === -1) {
    return null;
  }

  data = data.substring(start, end + 1);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  }
  return null;
}

export default new RemoteControlService();
