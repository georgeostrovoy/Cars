import { TERRAIN, terrainAtX } from '../world/terrain.js';

export class Car {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 120;
    this.y = 460;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.av = 0;
    this.wheelSpin = 0;
    this.onGround = false;
    this.surface = 'dirt';
  }

  update(input, dt, groundHeightFn) {
    this.surface = terrainAtX(this.x);
    const traction = TERRAIN[this.surface].traction;
    const axis = input.axis();

    const engine = 950 * traction;
    this.vx += axis * engine * dt;
    this.vx *= this.onGround ? (0.985 - (1 - traction) * 0.05) : 0.995;

    this.vy += 1800 * dt;

    if (input.jumpPressed() && this.onGround) {
      this.vy = -680;
      this.onGround = false;
    }

    if (!this.onGround && Math.abs(axis) > 0.01) {
      this.av += axis * 7.0 * dt;
    }

    this.av *= 0.99;
    this.angle += this.av * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const gy = groundHeightFn(this.x);
    if (this.y > gy) {
      const penetration = this.y - gy;
      this.y = gy;
      this.vy = -Math.min(120, penetration * 18);
      this.onGround = true;
      this.av *= 0.92;
    } else {
      this.onGround = false;
    }

    this.wheelSpin += this.vx * dt * 0.12;
  }
}
