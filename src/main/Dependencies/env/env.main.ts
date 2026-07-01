import dotenv from 'dotenv';
import { app } from 'electron';
import path from 'path';

// Load .env BEFORE any consumer reads process.env. In a packaged build the
// `.env` is shipped via electron-builder `extraResources` to
// `process.resourcesPath/.env` — NOT inside app.asar (which is what
// `app.getAppPath()` points at once packed), so it must be read from resources.
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env')
  : path.join(app.getAppPath(), '.env');

dotenv.config({ path: envPath });

// Main process: Read environment variables directly.
// console.log(process.env.API_BASE_URL);

// Renderer process: Read environment variables via the preload API.
// const apiBaseUrl = window.electron.env.get('API_BASE_URL');