const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'store', 'Screenshots');
const outputDir = path.join(__dirname, '..', 'store', 'screenshots');

const TARGET_W = 1280;
const TARGET_H = 800;
const BG = { r: 246, g: 243, b: 236, alpha: 1 };

function makeShadow(width, height) {
  const pad = 60;
  const shadow = Buffer.from(
    `<svg width="${width + pad * 2}" height="${height + pad * 2}" xmlns="http://www.w3.org/2000/svg">
      <filter id="b"><feGaussianBlur stdDeviation="18"/></filter>
      <rect x="${pad}" y="${pad + 10}" width="${width}" height="${height}" rx="16" fill="rgba(0,0,0,0.22)" filter="url(#b)"/>
    </svg>`,
  );
  return sharp(shadow).png().toBuffer();
}

async function process(inputFile, outputName) {
  const inputPath = path.join(inputDir, inputFile);
  const outputPath = path.join(outputDir, outputName);

  const meta = await sharp(inputPath).metadata();
  const origW = meta.width ?? 0;
  const origH = meta.height ?? 0;

  let scale = 1;
  if (origW < 500) scale = 2;
  else if (origW < 800) scale = 1.5;

  const newW = Math.round(origW * scale);
  const newH = Math.round(origH * scale);

  const maxW = TARGET_W - 120;
  const maxH = TARGET_H - 120;
  const fit = Math.min(maxW / newW, maxH / newH, 1);
  const finalW = Math.round(newW * fit);
  const finalH = Math.round(newH * fit);

  const resized = await sharp(inputPath)
    .resize(finalW, finalH, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const shadow = await makeShadow(finalW, finalH);
  const shadowMeta = await sharp(shadow).metadata();
  const shadowW = shadowMeta.width ?? 0;
  const shadowH = shadowMeta.height ?? 0;

  await sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 4,
      background: BG,
    },
  })
    .composite([
      {
        input: shadow,
        left: Math.round((TARGET_W - shadowW) / 2),
        top: Math.round((TARGET_H - shadowH) / 2),
      },
      {
        input: resized,
        left: Math.round((TARGET_W - finalW) / 2),
        top: Math.round((TARGET_H - finalH) / 2),
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`  ${outputName}  (from ${origW}x${origH} → ${finalW}x${finalH} centered on ${TARGET_W}x${TARGET_H})`);
}

async function run() {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = fs
    .readdirSync(inputDir)
    .filter((f) => /\.png$/i.test(f))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] ?? '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] ?? '0', 10);
      return na - nb;
    });

  console.log(`Processing ${files.length} screenshots:\n`);
  for (let i = 0; i < files.length; i++) {
    await process(files[i], `screenshot-${i + 1}.png`);
  }
  console.log(`\nDone. Files in: ${outputDir}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
