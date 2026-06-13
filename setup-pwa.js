import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SOURCE_IMAGE = path.join(PUBLIC_DIR, 'RaShoyi_logo_circle.png');

// Delete manual PWA files
try {
  fs.unlinkSync(path.join(PUBLIC_DIR, 'sw.js'));
  console.log('Deleted sw.js');
} catch (e) {
  // ignore
}

try {
  fs.unlinkSync(path.join(PUBLIC_DIR, 'manifest.json'));
  console.log('Deleted manifest.json');
} catch (e) {
  // ignore
}

// Create icons directory
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Copy the generated icon
try {
  fs.copyFileSync(SOURCE_IMAGE, path.join(ICONS_DIR, 'icon-192x192.png'));
  fs.copyFileSync(SOURCE_IMAGE, path.join(ICONS_DIR, 'icon-512x512.png'));
  console.log('Icons copied successfully.');
} catch (e) {
  console.error('Failed to copy icons:', e);
}
