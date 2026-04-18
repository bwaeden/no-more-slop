const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');
const pkg = require(path.join(root, 'package.json'));
const zipName = `no-more-slop-v${pkg.version}.zip`;
const zipPath = path.join(root, zipName);

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(`powershell -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${zipPath}' -Force"`, {
    stdio: 'inherit',
  });
  const stat = fs.statSync(zipPath);
  console.log(`\nPackaged: ${zipName} (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log('Upload this file to the Chrome Web Store Developer Dashboard.');
} catch (err) {
  console.error('Failed to package:', err.message);
  process.exit(1);
}
