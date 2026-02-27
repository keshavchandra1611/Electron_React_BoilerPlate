// Optional: -------------👇
// npm install ts-node typescript
// Optional: -------------👆

// npx ts-node file.ts --mac   # add dependencies
// npx ts-node file.ts --win   # remove dependencies

// A Node.js script to manage platform-specific dependencies in package.json.
// Adds macOS-only dependencies with --mac.
// Removes them on Windows with --win.

import fs from 'fs';
import path from 'path';

// --- Hardcoded dependencies object ---
const hardcodedDependencies = {
  serialport: '^13.0.0',  //For example
};
// ------------------------------------

const packageJsonPath = path.resolve(__dirname, `../../../../release/app/package.json`); // adjust if needed
console.log(packageJsonPath)
const pkgRaw = fs.readFileSync(packageJsonPath, 'utf-8');
const pkg = JSON.parse(pkgRaw);

// Get the flag from CLI
const flag = process.argv[2]; // e.g., --win or --mac

if (!flag || (flag !== '--win' && flag !== '--mac')) {
  console.error('Please pass --win or --mac');
  process.exit(1);
}

if (flag === '--mac') {
  // Add dependencies
  pkg.dependencies = { ...(pkg.dependencies || {}), ...hardcodedDependencies };
  console.log('Added dependencies:', Object.keys(hardcodedDependencies));
} else if (flag === '--win') {
  // Remove dependencies
  if (pkg.dependencies) {
    for (const dep of Object.keys(hardcodedDependencies)) {
      if (pkg.dependencies[dep]) {
        delete pkg.dependencies[dep];
        console.log('Removed dependency:', dep);
      }
    }
  }
}

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf-8');
console.log('package.json updated successfully!');
