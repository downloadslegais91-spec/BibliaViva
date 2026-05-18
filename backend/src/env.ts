import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Try multiple candidate paths for .env to ensure robust loading in all environments
const candidates = [
  path.resolve(__dirname, '../.env'), // Relative to backend/src/
  path.resolve(__dirname, '../../.env'), // Relative to backend/src/nested_folders
  path.resolve(process.cwd(), '.env'), // Current working directory (usually root in Vercel or local backend dir)
  path.resolve(process.cwd(), 'backend/.env'), // From root directory when running local dev
];

let loaded = false;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loaded = true;
    break;
  }
}

if (!loaded) {
  // If not loaded from local file, default dotenv configuration will run
  dotenv.config();
}
