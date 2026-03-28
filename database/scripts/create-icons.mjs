import fs from 'fs';
import { createCanvas } from 'canvas';

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('刷', size / 2, size / 2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

try {
  createIcon(192, 'icon-192.png');
  createIcon(512, 'icon-512.png');
  console.log('✅ Icons created successfully');
} catch (error) {
  console.error('❌ Error creating icons:', error.message);
  console.log('ℹ️  Install canvas package: npm install canvas');
}
