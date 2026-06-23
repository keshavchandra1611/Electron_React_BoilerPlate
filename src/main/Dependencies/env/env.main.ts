import dotenv from 'dotenv';
import { app } from 'electron';
import path from 'path';

// Load .env BEFORE using process.env
dotenv.config({
  path: path.join(app.getAppPath(), '.env'),
});

// Main process: Read environment variables directly.
// console.log(process.env.API_BASE_URL);

// Renderer process: Read environment variables via the preload API.
// const apiBaseUrl = window.electron.env.get('API_BASE_URL');