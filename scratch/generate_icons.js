const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createCircularIcons() {
  const inputPath = 'C:\\Users\\onixc\\.gemini\\antigravity\\brain\\0c944480-3aa9-45ee-9401-ec34aed77fbf\\.user_uploaded\\media_1786540355504.jpg';
  const outDir = 'C:\\Users\\onixc\\.gemini\\antigravity\\scratch\\CREN2026\\public';
  const artifactDir = 'C:\\Users\\onixc\\.gemini\\antigravity\\brain\\0c944480-3aa9-45ee-9401-ec34aed77fbf';

  // Crop input image to square 1000x1000 centered vertically
  const squareBuffer = await sharp(inputPath)
    .extract({ left: 0, top: 12, width: 1000, height: 1000 })
    .toBuffer();

  // Create circular SVG mask for 1000x1000
  // Radius of 472 pixels fits the outer dark blue ring boundary cleanly
  const circleSvg = Buffer.from(`
    <svg width="1000" height="1000">
      <circle cx="500" cy="500" r="472" fill="#ffffff" />
    </svg>
  `);

  const circularBuffer = await sharp(squareBuffer)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Save 512x512
  await sharp(circularBuffer)
    .resize(512, 512)
    .toFile(path.join(outDir, 'icon-512.png'));

  // Save 192x192
  await sharp(circularBuffer)
    .resize(192, 192)
    .toFile(path.join(outDir, 'icon-192.png'));

  // Save apple-touch-icon 180x180
  await sharp(circularBuffer)
    .resize(180, 180)
    .toFile(path.join(outDir, 'apple-touch-icon.png'));

  // Save favicon.ico / favicon.png
  await sharp(circularBuffer)
    .resize(48, 48)
    .toFile(path.join(outDir, 'favicon.ico'));

  await sharp(circularBuffer)
    .resize(64, 64)
    .toFile(path.join(outDir, 'favicon.png'));

  // Update cren-logo.png and logo.png in public folder
  await sharp(circularBuffer)
    .resize(512, 512)
    .toFile(path.join(outDir, 'cren-logo.png'));

  await sharp(circularBuffer)
    .resize(512, 512)
    .toFile(path.join(outDir, 'logo.png'));

  // Copy 512x512 PNG to artifacts for preview
  await sharp(circularBuffer)
    .resize(512, 512)
    .toFile(path.join(artifactDir, 'cren_circular_app_icon.png'));

  console.log('Circular transparent app icons generated successfully!');
}

createCircularIcons().catch(console.error);
