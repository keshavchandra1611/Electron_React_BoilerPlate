import fs from 'fs';
import path from 'path';
import { apps, AppConfig, VersionHistory, thisApp } from './apps';
import moment from 'moment-timezone';

/**
 * This script automates app metadata and version management.
 *
 * What it does:
 * 1. Reads the selected app configuration (`thisApp`) from `apps.ts`.
 * 2. Picks the latest version entry from the app's version history.
 * 3. Updates multiple `package.json` files with:
 *    - app name
 *    - product name
 *    - appId (if build config exists)
 *    - latest version
 *    - description
 * 4. Writes the updated `package.json` files back to disk.
 * 5. Exports the currently applied app details (appKey, version, product info, timestamp)
 *    into `current-details.json` for tracking and build/reference purposes.
 *
 * Notes:
 * - The timestamp is generated in IST (Asia/Kolkata).
 * - Only existing `build` configurations are updated (no new build config is created).
 * - This script is typically used before packaging/releasing the Electron app
 *   to ensure consistent metadata across environments.
 */

const appKey = thisApp;
if (!appKey || !apps[appKey]) {
  console.error(
    `Please provide a valid app key: ${Object.keys(apps).join(', ')}`,
  );
  process.exit(1);
}

// Get the latest version object from the history
const app = apps[appKey];
const latest = app.history[app.history.length - 1];

const timestamp = moment().tz('Asia/Kolkata').format('YYYYMMDD_HHmm'); // 20251107_1630

// To Change: Paths to package.json files
const filesToUpdate = [
  path.join(__dirname, '../../../..', 'package.json'),
  path.join(__dirname, '../../../..', 'release', 'app', 'package.json'),
];

// Function to update package.json
function updatePackageJson(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Update basic info
  pkg.name = app.name;
  pkg.version = latest.version;
  // pkg.description = latest.description;
  pkg.description = app.productName;

  // Update build info if exists
  // if (!pkg.build) pkg.build = {};  // create if not exists
  if (pkg.build) {
    pkg.build.productName = app.productName;
    pkg.build.appId = app.appId;
  }

  const rootPath = path.join(__dirname, '../../../..', 'package.json');
  const isRoot = filePath === rootPath;
  if (isRoot) {
    setOrDelete(pkg, 'homepage', app.homepage);
    setOrDelete(pkg, 'bugs', app.bugs);
    setOrDelete(pkg, 'repository', app.repository);
    setOrDelete(pkg, 'author', app.author);
    setOrDelete(pkg, 'collective', app.collective);

    // publish config inside build
    if (pkg.build) {
      setOrDelete(pkg.build, 'publish', app.buildPublish);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2), 'utf-8');
  console.log(
    `\x1b[1;33m🐹 Updated\x1b[0m \x1b[0;35m${filePath} for app '${app.productName}' with version ${latest.version}\x1b[0m`,
  );
  return pkg; // explicitly return updated package.json
}

// Update all package.json files
// filesToUpdate.forEach(updatePackageJson);

// Update all package.json files and collect their updated content
const updatedPackages = filesToUpdate
  .map((filePath) => updatePackageJson(filePath))
  .filter(Boolean) as Record<string, any>[]; // TS type assertion

// ----------------------
// Update installer.nsh
// ----------------------
const installerPath = path.join(
  __dirname,
  '../../../..',
  'assets',
  'installer.nsh',
);

if (fs.existsSync(installerPath)) {
  let installerContent = fs.readFileSync(installerPath, 'utf8');

  installerContent = installerContent.replace(
    /taskkill\s+\/F\s+\/T\s+\/IM\s+"[^"]+\.exe"/,
    `taskkill /F /T /IM "${app.productName}.exe"`,
  );

  fs.writeFileSync(installerPath, installerContent, 'utf8');

  console.log(
    `\x1b[1;32m✅ Updated installer.nsh\x1b[0m \x1b[0;36m→ ${app.productName}.exe\x1b[0m`,
  );
} else {
  console.warn(`\x1b[1;33m⚠ installer.nsh not found:\x1b[0m ${installerPath}`);
}

// Export only the changed/current details
const changedDetails = {
  appKey,
  name: app.name,
  productName: app.productName,
  appId: app.appId,
  version: latest.version,
  description: latest.description,
  // timestamp: new Date().toISOString(),
  timestamp: timestamp,
};

// const exportPath = path.join(__dirname, `${appKey}-current-details.json`);
const exportPath = path.join(__dirname, `../current-details.json`);
fs.writeFileSync(exportPath, JSON.stringify(changedDetails, null, 2), 'utf-8');

console.log(
  `\x1b[1;32m✅ Exported changed details to\x1b[0m \x1b[0;36m${exportPath}\x1b[0m`,
);

function setOrDelete(obj: any, key: string, value: any) {
  if (!value || value === '') {
    delete obj[key];
  } else {
    obj[key] = value;
  }
}
