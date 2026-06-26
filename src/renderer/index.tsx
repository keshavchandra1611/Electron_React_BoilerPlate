import { createRoot } from 'react-dom/client';
import App from './App';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppWrapper from './Components/global/AppWrapper';
import SecondaryWindow from './Screens/SecondaryWindow/SecondaryWindow';

import config from '../utils/Version/current-details.json'; // adjust relative path

// Run this command in Mac if not registered
// xattr -cr "/Applications/YOUR APP NAME.app"



const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
// The overlay window loads the same bundle with a `#secondary` hash. Because the
// app uses MemoryRouter (which ignores the URL), we branch here on the hash to
// render the standalone overlay UI instead of the main router app.
const isSecondaryWindow = window.location.hash === '#secondary';

if (isSecondaryWindow) {
  document.title = 'Overlay';
  root.render(<SecondaryWindow />);
} else {
  document.title = `${config.productName} ${config.version}` || 'Hello Electron!';
  root.render
  (
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
}