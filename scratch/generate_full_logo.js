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

// Create 1024x1024 canvas for logo.png & kea-logo.png
const SQUARE_SIZE = 1024;
const destPng = new PNG({ width: SQUARE_SIZE, height: SQUARE_SIZE });

// Fill background pure white
for (let i = 0; i < destPng.data.length; i += 4) {
  destPng.data[i] = 255;
  destPng.data[i + 1] = 255;
  destPng.data[i + 2] = 255;
  destPng.data[i + 3] = 255;
}

// Scale full logo (both Globe + Text) to fill ~92% of the SQUARE_SIZE width (approx 940px)
const targetWidth = 950;
const scale = targetWidth / fullW;
const scaledW = Math.round(fullW * scale);
const scaledH = Math.round(fullH * scale);

const offsetX = Math.round((SQUARE_SIZE - scaledW) / 2);
const offsetY = Math.round((SQUARE_SIZE - scaledH) / 2);

for (let destY = 0; destY < scaledH; destY++) {
  const srcY = minY + Math.floor(destY / scale);
  if (srcY >= srcPng.height) continue;

  for (let destX = 0; destX < scaledW; destX++) {
    const srcX = minX + Math.floor(destX / scale);
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
      const alpha = sA / 255;
      destPng.data[destIdx] = Math.round(sR * alpha + 255 * (1 - alpha));
      destPng.data[destIdx + 1] = Math.round(sG * alpha + 255 * (1 - alpha));
      destPng.data[destIdx + 2] = Math.round(sB * alpha + 255 * (1 - alpha));
      destPng.data[destIdx + 3] = 255;
    }
  }
}

const assetsDir = path.join(__dirname, '../assets');
const buffer = PNG.sync.write(destPng);

fs.writeFileSync(path.join(assetsDir, 'logo.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'kea-logo.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), buffer);
fs.writeFileSync(path.join(assetsDir, 'android-icon-foreground.png'), buffer);

console.log('Successfully updated logo.png & kea-logo.png with FULL wide logo spanning 95% of canvas!');
