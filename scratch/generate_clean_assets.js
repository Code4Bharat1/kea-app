const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const logoPath = path.join(__dirname, '../assets/logo1.png');
const logoData = fs.readFileSync(logoPath);
const srcPng = PNG.sync.read(logoData);

// Bounding box of Globe Emblem
const emblemX0 = 42;
const emblemY0 = 43;
const emblemW = 531;
const emblemH = 496;

// Create 1024x1024 Square Icon / Splash Emblem (kea-logo.png)
const SQUARE_SIZE = 1024;
const squarePng = new PNG({ width: SQUARE_SIZE, height: SQUARE_SIZE });

// Fill background with pure white (255, 255, 255, 255)
for (let i = 0; i < squarePng.data.length; i += 4) {
  squarePng.data[i] = 255;
  squarePng.data[i + 1] = 255;
  squarePng.data[i + 2] = 255;
  squarePng.data[i + 3] = 255;
}

// We want the emblem to span ~75% of SQUARE_SIZE (approx 768px in height/width)
const targetSize = 780;
const scale = Math.min(targetSize / emblemW, targetSize / emblemH);
const scaledW = Math.round(emblemW * scale);
const scaledH = Math.round(emblemH * scale);

const offsetX = Math.round((SQUARE_SIZE - scaledW) / 2);
const offsetY = Math.round((SQUARE_SIZE - scaledH) / 2);

// Bilinear / nearest-neighbor interpolation to render scaled emblem onto squarePng
for (let destY = 0; destY < scaledH; destY++) {
  const srcY = emblemY0 + Math.floor(destY / scale);
  if (srcY >= srcPng.height) continue;

  for (let destX = 0; destX < scaledW; destX++) {
    const srcX = emblemX0 + Math.floor(destX / scale);
    if (srcX >= srcPng.width) continue;

    const srcIdx = (srcPng.width * srcY + srcX) << 2;
    const destXPos = offsetX + destX;
    const destYPos = offsetY + destY;

    if (destXPos < 0 || destXPos >= SQUARE_SIZE || destYPos < 0 || destYPos >= SQUARE_SIZE) continue;

    const destIdx = (SQUARE_SIZE * destYPos + destXPos) << 2;

    const sR = srcPng.data[srcIdx];
    const sG = srcPng.data[srcIdx + 1];
    const sB = srcPng.data[srcIdx + 2];
    const sA = srcPng.data[srcIdx + 3];

    if (sA > 10) {
      // Alpha blending over white background
      const alpha = sA / 255;
      squarePng.data[destIdx] = Math.round(sR * alpha + 255 * (1 - alpha));
      squarePng.data[destIdx + 1] = Math.round(sG * alpha + 255 * (1 - alpha));
      squarePng.data[destIdx + 2] = Math.round(sB * alpha + 255 * (1 - alpha));
      squarePng.data[destIdx + 3] = 255;
    }
  }
}

// Write generated square PNGs
const assetsDir = path.join(__dirname, '../assets');
const squareBuffer = PNG.sync.write(squarePng);

fs.writeFileSync(path.join(assetsDir, 'kea-logo.png'), squareBuffer);
fs.writeFileSync(path.join(assetsDir, 'logo.png'), squareBuffer);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), squareBuffer);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), squareBuffer);
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), squareBuffer);

console.log('Successfully generated clean 1024x1024 centered logo assets in assets/');

// Also generate tightly cropped full horizontal banner logo (kea-logo-banner.png)
const fullMinX = 42, fullMaxX = 1288, fullMinY = 43, fullMaxY = 538;
const fullW = fullMaxX - fullMinX + 1;
const fullH = fullMaxY - fullMinY + 1;

// Add 20px padding around full banner logo
const pad = 20;
const bannerW = fullW + pad * 2;
const bannerH = fullH + pad * 2;
const bannerPng = new PNG({ width: bannerW, height: bannerH });

// Fill background white
for (let i = 0; i < bannerPng.data.length; i += 4) {
  bannerPng.data[i] = 255;
  bannerPng.data[i + 1] = 255;
  bannerPng.data[i + 2] = 255;
  bannerPng.data[i + 3] = 255;
}

for (let y = 0; y < fullH; y++) {
  const srcY = fullMinY + y;
  for (let x = 0; x < fullW; x++) {
    const srcX = fullMinX + x;
    const srcIdx = (srcPng.width * srcY + srcX) << 2;
    const destIdx = (bannerW * (y + pad) + (x + pad)) << 2;

    bannerPng.data[destIdx] = srcPng.data[srcIdx];
    bannerPng.data[destIdx + 1] = srcPng.data[srcIdx + 1];
    bannerPng.data[destIdx + 2] = srcPng.data[srcIdx + 2];
    bannerPng.data[destIdx + 3] = srcPng.data[srcIdx + 3];
  }
}

fs.writeFileSync(path.join(assetsDir, 'kea-logo-banner.png'), PNG.sync.write(bannerPng));
console.log('Successfully generated kea-logo-banner.png');
