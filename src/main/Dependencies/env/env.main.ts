import dotenv from 'dotenv';
import { app } from 'electron';
import path from 'path';

// Load .env BEFORE using process.env
dotenv.config({
  path: path.join(app.getAppPath(), '.env'),
});

// // Example
// console.log(process.env.API_BASE_URL);
