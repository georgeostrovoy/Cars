import { TERRAIN, terrainAtX } from './terrain.js';

export function groundY(x) {
  return 520
    - Math.sin(x * 0.006) * 30
    - Math.max(0, Math.sin((x - 900) * 0.01)) * 40
    - Math.max(0, Math.sin((x - 1700) * 0.014)) * 70;
}

export function drawLevel(ctx, camX, width, height) {
  const startX = Math.floor(camX / 100) * 100 - 300;
  for (let x = startX; x < camX + width + 300; x += 100) {
    const surface = terrainAtX(x);
    ctx.fillStyle = TERRAIN[surface].color;
    const y = groundY(x);
    ctx.fillRect(x, y, 100, height - y);
  }
}
