import { createRoot } from 'react-dom/client';
import App from './App';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppWrapper from './Components/global/AppWrapper';

import config from '../utils/Version/current-details.json'; // adjust relative path

// Run this command in Mac if not registered
// xattr -cr "/Applications/YOUR APP NAME.app"



const container = document.getElementById('root') as HTMLElement;
document.title = `${config.productName} ${config.version}` || 'Hello Electron!';
const root = createRoot(container);
root.render(
  <AppWrapper>
    <App />
  </AppWrapper>,
);

// calling IPC exposed from preload script
window.electron?.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron?.ipcRenderer.sendMessage('ipc-example', ['ping']);
