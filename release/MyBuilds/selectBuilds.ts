import fs from 'fs';
import path from 'path';

// --- Config ---
const srcDir = path.resolve('./release/build');
const destDir = path.resolve('./release/MyBuilds/selected-builds');

// Create destination folder if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Define file patterns to copy
const patterns = [/\.exe$/i, /-arm64\.dmg$/i, /\.dmg$/i];

// Read all files in source folder
const files = fs.readdirSync(srcDir);

files.forEach((file) => {
  const filePath = path.join(srcDir, file);

  // Check if file matches any pattern
  if (patterns.some((regex) => regex.test(file))) {
    const destPath = path.join(destDir, file);
    fs.copyFileSync(filePath, destPath);
    console.log(`Copied: ${file}`);
  }
});

console.log(`\x1b[1;32mPlease find attached the selected files at ${destDir}\x1b[0m`)