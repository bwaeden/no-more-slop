const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '..', 'public', 'icons', 'logo.svg');
const outDir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [16, 48, 128, 256, 512];

async function generate() {
  const svgBuffer = fs.readFileSync(svgPath);
  for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    await sharp(svgBuffer, { density: Math.max(72, size * 4) })
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`wrote icon-${size}.png (${stat.size} bytes)`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
