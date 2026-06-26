import { app, ipcMain, WebContents } from 'electron';
import { ReadlineParser, SerialPort } from 'serialport';

let classKeySerialPort: SerialPort | null = null; // Store serial port instance
let isReconnecting = false; // Reconnection flag
let isDeviceVerified = false;
let manualClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null; // single reconnect-loop guard
let reconnectAttempts = 0; // how many reconnect attempts in the current loop
const reconnectionLoopTime = 3000; // in ms 1s=1000ms

const YouWantToAutoDetectOnceOpened = false;
const autoTryReconnectOnUnplugged = true;

// Initialize the dongle
function init() {
  console.log('Initializing SDK');
  app.on('ready', async () => {
    if (!app.requestSingleInstanceLock()) app.quit();

    try {
      await sleep(500);
      setupSerialPort();
    } catch (error) {
      console.error('Initialization error:', error);
    }
  });
}

// Retrieve available serial ports
async function portList(): Promise<PortInfo[]> {
  try {
    return await SerialPort.list();
  } catch (error) {
    console.error('Error fetching port list:', error);
    return [];
  }
}

// Setup IPC and serial port communication
function setupSerialPort() {
  ipcMain.on('serialport', (event, data) => {
    const webContents: WebContents = event.sender;
    console.log(
      `\x1b[1;33m🐹 From File: init.ts | From Func: SetupSerialPort():\x1b[0m \x1b[0;35m${Date.now()}\x1b[0m`,
    );
    console.log(
      `\x1b[1;33m🐹 data:\x1b[0;35m ${JSON.stringify(data, null, 2)}\x1b[0m`,
    );

    switch (data.type) {
      case 'open':
        handleOpenPort(webContents);
        break;

      case 'close':
        handleClosePort(webContents);
        break;

      case 'write':
        handleWritePort(data, webContents);
        break;

      default:
        break;
    }
  });
}

// Handle opening a port
async function handleOpenPort(webContents: WebContents): Promise<void> {
  const ports = await portList();
  if (!ports) return;

  if (classKeySerialPort && classKeySerialPort.isOpen) {
    console.log('Closing existing port before opening a new one...');
    manualClose = true;
    setTimeout(() => {
      manualClose = false;
    }, 1000);
    classKeySerialPort.close(() => {
      console.log('Existing port closed');
      classKeySerialPort = null;
      openSerialPort(ports, webContents);
    });
  } else {
    openSerialPort(ports, webContents);
  }
}

// Handle closing a port
function handleClosePort(webContents: WebContents) {
  manualClose = true; // <-- user intends to close
  isReconnecting = false; // if trying to reconnect, then stop trying
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0; // reset retry counter
  isDeviceVerified = false;
  if (classKeySerialPort && classKeySerialPort.isOpen) {
    console.log('Closing serial port on demand');
    classKeySerialPort.close(() => {
      console.log('Serial port closed successfully on demand');
      if (!webContents.isDestroyed()) {
        webContents.send('serialport', {
          type: 'closed',
          message: 'closed on demand',
        });
      }
      classKeySerialPort = null;
      // setTimeout(() => {
      //   manualClose = false; // reset after close
      // }, 500);
      manualClose = false; // reset after close
    });
  } else {
    // Nothing open to close — still acknowledge so the renderer's
    // connection state doesn't get stuck on "connected".
    if (!webContents.isDestroyed()) {
      webContents.send('serialport', {
        type: 'closed',
        message: 'already closed',
      });
    }
    classKeySerialPort = null;
    manualClose = false; // reset after close
  }
}

// Handle writing to the port
function handleWritePort(data: any, webContents: WebContents) {
  if (classKeySerialPort && classKeySerialPort.isOpen) {
    const writeBuffer = Buffer.from(data.payload);
    classKeySerialPort.write(writeBuffer, 'utf8', (err) => {
      if (err) {
        console.error('Write error:', err);
        if (!webContents.isDestroyed()) {
          webContents.send('serialport', {
            type: 'error',
            payload: { message: 'Failed to send data to the USB device.' },
          });
        }
      }
    });
  }
}

// Send write command from here (init.ts) directly
// Example :
// sendToSerialPort('END_PAIR', webContents); // 👈 send END_PAIR even for generic case
// sendToSerialPort('DEVICE_CHECK"', webContents); // 👈 send END_PAIR even for generic case
function sendToSerialPort(payload: string, webContents: WebContents) {
  if (classKeySerialPort && classKeySerialPort.isOpen) {
    const buffer = Buffer.from(payload);
    classKeySerialPort.write(buffer, 'utf8', (err) => {
      if (err) {
        console.error('Write error:', err);
        if (!webContents.isDestroyed()) {
          webContents.send('serialport', {
            type: 'error',
            payload: { message: 'Failed to send data to the USB device.' },
          });
        }
      } else if (payload === 'END_PAIR') {
        setTimeout(() => {
          sendToSerialPort('DEVICE_CHECK', webContents);
        }, 500);
      } else {
        console.log(`📤 Sent command to device: ${payload}`);
      }
    });
  } else {
    console.warn('⚠️ Cannot send data — port is not open.');
  }
}

// Open serial port
function openSerialPort(ports: PortInfo[], webContents: WebContents) {
  for (const port of ports) {
    if (
      (port.vendorId?.toLocaleLowerCase() === '0403' &&
        port.productId?.toLocaleLowerCase() === '6001') ||
      (port.vendorId?.toLocaleLowerCase() === '1a86' &&
        port.productId?.toLocaleLowerCase() === '7523')
    ) {
      // console.log('port', port);
      // console.log('Connecting to port:', port.path);

      classKeySerialPort = new SerialPort({
        path: port.path,
        baudRate: 74880,
        dataBits: 8,
        parity: 'none',
      });

      // console.log(
      //   `\x1b[1;34m🔌 Connecting to Serial Port:\x1b[0m\n` +
      //     `  path: ${port.path}\n` +
      //     `  baudRate: 74880\n` +
      //     `  vendorId: ${port.vendorId}\n` +
      //     `  productId: ${port.productId}`,
      // );

      // console.log(
      //   `\x1b[1;34m🔌 Connecting to Serial Port:\x1b[0m\n` +
      //     `  path: ${classKeySerialPort.path}\n` +
      //     `  baudRate: 74880\n` +
      //     `  vendorId: ${port.vendorId}\n` +
      //     `  productId: ${port.productId}`,
      // );

      const verificationMessage = 'DEVICE_CHECKIN';
      const verificationBuffer = Buffer.from(verificationMessage);

      classKeySerialPort.write(verificationBuffer, 'utf8', (err) => {
        if (err) {
          console.error('Write error:', err);
          if (!webContents.isDestroyed()) {
            webContents.send('serialport', {
              type: 'error',
              payload: { message: 'Failed to send data to the USB device.' },
            });
          }
        }
      });

      // const parser = classKeySerialPort.pipe(
      //   new ReadlineParser({ delimiter: '\r\n' }),
      // );

      // parser.on('data', (data: string) => {
      //   console.log('Data:', data);
      //   if (!webContents.isDestroyed()) {
      //     webContents.send('serialport', { type: 'data', payload: data });
      //   }
      // });

      let buffer = '';
      classKeySerialPort.on('data', (data: string) => {
        // console.log('📥 Received Raw Data:', data.toString()); // ✅ Log every received message
        buffer += data.toString(); // append incoming data

        // Try to extract all complete JSON objects from the buffer.
        // Track brace depth (ignoring braces inside string literals) so that
        // nested objects like {"a":{"b":1}} are read as a single message
        // instead of being cut off at the first inner '}'.
        let objectStart = buffer.indexOf('{');

        while (objectStart !== -1) {
          let depth = 0;
          let inString = false;
          let escaped = false;
          let objectEnd = -1;

          for (let i = objectStart; i < buffer.length; i++) {
            const char = buffer[i];

            if (escaped) {
              escaped = false;
              continue;
            }
            if (char === '\\') {
              escaped = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            if (inString) continue;

            if (char === '{') {
              depth++;
            } else if (char === '}') {
              depth--;
              if (depth === 0) {
                objectEnd = i;
                break;
              }
            }
          }

          // No complete object yet — wait for more data to arrive.
          if (objectEnd === -1) break;

          const jsonString = buffer.slice(objectStart, objectEnd + 1);

          try {
            const parsedData = JSON.parse(jsonString);
            console.log('Init.ts | Parsed Data ', parsedData); // ✅ Only prints JSON
            if (parsedData.messageType === 'DEVICE_CHECK') {
              isReconnecting = false; // ✅ stop further reconnect attempts
              isDeviceVerified = true;
              if (
                parsedData.receiverId &&
                parsedData.receiverId !== 'FE:00:00:00:00:01'
              ) {
                console.log(
                  `✅ Device Connected with receiverId ${parsedData.receiverId}`,
                );
              } else {
                console.log('✅ Device Connected');
                sendToSerialPort('END_PAIR', webContents); // 👈 send END_PAIR even for generic case
              }
            }
            if (!webContents.isDestroyed()) {
              webContents.send('serialport', {
                type: 'data',
                payload: parsedData,
              });
            }
          } catch (e) {
            // A brace-balanced frame that still won't parse is genuinely
            // malformed — drop it so one bad frame can't stall the buffer.
            console.warn(
              '⚠️ Failed to parse JSON frame, dropping:',
              jsonString,
            );
          }

          // buffer = '';
          // Remove the consumed object (parsed or dropped) from the buffer
          // and look for the next one.
          buffer = buffer.slice(objectEnd + 1);
          objectStart = buffer.indexOf('{');
        }
      });

      setupPortListeners(webContents);
      return;
    }
  }

  console.error('Device not found');
  isDeviceVerified = false;
  if (!webContents.isDestroyed()) {
    // ✅ Attempt reconnect only if not already reconnecting
    if (!isReconnecting && YouWantToAutoDetectOnceOpened && !manualClose) {
      console.log('Reconnecting Command From SetupSerialPort');
      isReconnecting = true;
      reconnectPort(webContents);
    }
  }

  // Only surface this error on a fresh/manual attempt. During an active
  // reconnect loop the renderer already knows it's disconnected, so don't
  // re-send (and previously double-send) the same error every cycle.
  // if (!isReconnecting) {
  if (true) {
    webContents.send('serialport', {
      type: 'error',
      payload: {
        message: `Attempted but device not found. Please connect the USB device.${isReconnecting ? ` (Reconnecting — attempt ${reconnectAttempts})` : ''}`,
        // retryCount: reconnectAttempts,
        // isReconnecting,
      },
    });
  }
}

// Setup listeners for port events
function setupPortListeners(webContents: WebContents) {
  classKeySerialPort
    ?.on('open', () => {
      console.log('Serial port opened');
      isReconnecting = false;
      reconnectAttempts = 0; // reset retry counter on successful open
      if (!webContents.isDestroyed()) {
        webContents.send('serialport', { type: 'opened' });
      }
    })
    // .on('data', (data) => {
    //   console.log('Data:', data.toString());
    //   if (!webContents.isDestroyed()) {
    //     webContents.send('serialport', { type: 'data', payload: data.toString() });
    //   }
    // })
    .on('close', () => handleEventPortClose(webContents))
    .on('error', (error) => handleEventPortError(error, webContents));
}

// Handle port close events
function handleEventPortClose(webContents: WebContents) {
  if (manualClose) {
    console.log('Manual close detected, skipping auto-reconnect');
    return; // do NOT reconnect if user manually closed
  }
  console.log('Serial port closed Event');
  if (!webContents.isDestroyed()) {
    webContents.send('serialport', {
      type: 'closed',
      message: 'Receiver unplugged!',
    });
  }

  if (autoTryReconnectOnUnplugged && !isReconnecting) {
    isReconnecting = true;
    isDeviceVerified = false;
    reconnectPort(webContents);
  }
}

// Handle port errors
function handleEventPortError(error: Error, webContents: WebContents) {
  console.error('Serial port error:', error);
  if (!webContents.isDestroyed()) {
    webContents.send('serialport', {
      type: 'error',
      payload: { message: error.message },
    });
  }
  if (classKeySerialPort && classKeySerialPort.isOpen) {
    classKeySerialPort.close();
  }

  if (!isReconnecting) {
    // ✅ guard
    isReconnecting = true;
    isDeviceVerified = false;
    reconnectPort(webContents);
  }
}

// Attempt to reconnect the port
function reconnectPort(webContents: WebContents) {
  if (!isReconnecting) return;
  // Only ever run ONE reconnect loop at a time. Without this, a 'close' and an
  // 'error' event from the same unplug could each spawn a loop, so every cycle
  // would emit the "device not found" error twice.
  if (reconnectTimer) return;

  console.log(
    `Attempting to reconnect in ${reconnectionLoopTime / 1000} seconds...`,
  );

  // To Check/Open New Port Every time with correct vendor/product id
  // To Reopen that port only: use this
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (!isReconnecting) return;
    reconnectAttempts += 1; // count this reconnect attempt
    try {
      if (!isDeviceVerified) {
        await handleOpenPort(webContents); // re-scan and open port
        // loop every 5 seconds
        if (!isDeviceVerified && isReconnecting) {
          reconnectPort(webContents);
        } else console.log('Reconnection attempt done.');
      }
    } catch (err) {
      console.error('Reconnection failed:', err);
      if (!isDeviceVerified && isReconnecting) {
        reconnectPort(webContents); // retry only if not verified
      }
    }
  }, reconnectionLoopTime);

  // setTimeout(() => {
  //   if (classKeySerialPort) {
  //     classKeySerialPort.open((err) => {
  //       if (err) {
  //         console.log('Reconnection failed, retrying...');
  //         reconnectPort(webContents);
  //       } else {
  //         console.log('Reconnected successfully!');
  //         isReconnecting = false;
  //         if (!webContents.isDestroyed()) {
  //           webContents.send('serialport', {
  //             type: 'opened',
  //             message: 'Reconnected successfully',
  //           });
  //         }
  //       }
  //     });
  //   }
  // }, 5000);
}

// Sleep function
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface PortInfo {
  path: string;
  manufacturer: string | undefined;
  serialNumber: string | undefined;
  pnpId: string | undefined;
  locationId: string | undefined;
  productId: string | undefined;
  vendorId: string | undefined;
}

export { init, portList };
