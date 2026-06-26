import { init, portList } from './../../../SDK/init';
import { ipcMain } from 'electron';

ipcMain.handle('get-port-list', async (event) => {
  const ports = await portList();
  return ports;
});

init();
