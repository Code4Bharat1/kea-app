const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const logoPath = path.join(__dirname, '../assets/logo1.png');
const data = fs.readFileSync(logoPath);
const png = PNG.sync.read(data);

console.log(`Original logo1.png dimensions: ${png.width} x ${png.height}`);

let minX = png.width, maxX = 0, minY = png.height, maxY = 0;

// Also find bounding box of the Globe emblem specifically (left side)
let emblemMinX = png.width, emblemMaxX = 0, emblemMinY = png.height, emblemMaxY = 0;

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    // Check if pixel is not pure white or transparent
    const isWhiteOrTransparent = a < 10 || (r > 245 && g > 245 && b > 245);
    if (!isWhiteOrTransparent) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      // Globe emblem is on the left side (x < width * 0.45)
      if (x < png.width * 0.45) {
        if (x < emblemMinX) emblemMinX = x;
        if (x > emblemMaxX) emblemMaxX = x;
        if (y < emblemMinY) emblemMinY = y;
        if (y > emblemMaxY) emblemMaxY = y;
      }
    }
  }
}

console.log(`Full Logo Non-White Bounding Box: X [${minX}, ${maxX}] (width ${maxX - minX + 1}), Y [${minY}, ${maxY}] (height ${maxY - minY + 1})`);
console.log(`Globe Emblem Bounding Box: X [${emblemMinX}, ${emblemMaxX}] (width ${emblemMaxX - emblemMinX + 1}), Y [${emblemMinY}, ${emblemMaxY}] (height ${emblemMaxY - emblemMinY + 1})`);
