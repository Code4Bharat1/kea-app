const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const logoPath = path.join(__dirname, '../assets/logo1.png');
const logoData = fs.readFileSync(logoPath);
const srcPng = PNG.sync.read(logoData);

// Full Logo non-white bounding box from logo1.png
const minX = 42;
const maxX = 1288;
const minY = 43;
const maxY = 538;

const fullW = maxX - minX + 1; // 1247
const fullH = maxY - minY + 1; // 496

// Create 1080 x 1920 full portrait screen splash image (splash-full.png)
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const splashPng = new PNG({ width: CANVAS_W, height: CANVAS_H });

// Fill background pure white
for (let i = 0; i < splashPng.data.length; i += 4) {
  splashPng.data[i] = 255;
  splashPng.data[i + 1] = 255;
  splashPng.data[i + 2] = 255;
  splashPng.data[i + 3] = 255;
}

// Target logo width on splash screen: 960px (approx 89% of 1080 screen width)
const targetWidth = 960;
const scale = targetWidth / fullW;
const scaledW = Math.round(fullW * scale);
const scaledH = Math.round(fullH * scale);

const offsetX = Math.round((CANVAS_W - scaledW) / 2);
const offsetY = Math.round((CANVAS_H - scaledH) / 2 - 80); // Slightly above center

for (let destY = 0; destY < scaledH; destY++) {
  const srcY = minY + Math.floor(destY / scale);
  if (srcY >= srcPng.height) continue;

  for (let destX = 0; destX < scaledW; destX++) {
    const srcX = minX + Math.floor(destX / scale);
    if (srcX >= srcPng.width) continue;

    const srcIdx = (srcPng.width * srcY + srcX) << 2;
    const destXPos = offsetX + destX;
    const destYPos = offsetY + destY;

    if (destXPos < 0 || destXPos >= CANVAS_W || destYPos < 0 || destYPos >= CANVAS_H) continue;

    const destIdx = (CANVAS_W * destYPos + destXPos) << 2;

    const sR = srcPng.data[srcIdx];
    const sG = srcPng.data[srcIdx + 1];
    const sB = srcPng.data[srcIdx + 2];
    const sA = srcPng.data[srcIdx + 3];

    if (sA > 10) {
      const alpha = sA / 255;
      splashPng.data[destIdx] = Math.round(sR * alpha + 255 * (1 - alpha));
      splashPng.data[destIdx + 1] = Math.round(sG * alpha + 255 * (1 - alpha));
      splashPng.data[destIdx + 2] = Math.round(sB * alpha + 255 * (1 - alpha));
      splashPng.data[destIdx + 3] = 255;
    }
  }
}

const assetsDir = path.join(__dirname, '../assets');
const splashBuffer = PNG.sync.write(splashPng);

fs.writeFileSync(path.join(assetsDir, 'splash-full.png'), splashBuffer);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splashBuffer);

console.log('Successfully generated 1080x1920 full portrait screen splash image in assets/splash-full.png');
