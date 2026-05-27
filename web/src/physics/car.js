import { TERRAIN, terrainAtX } from '../world/terrain.js';

export class Car {
  constructor() {
    this.gravity = 1600;
    this.maxFallSpeed = 1400;
    this.jumpVelocity = 760;
    this.groundSnap = 2;
    this.contactSpring = 95;
    this.contactDamping = 16;
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

    const engine = 900 * traction;
    this.vx += axis * engine * dt;
    this.vx *= this.onGround ? (0.985 - (1 - traction) * 0.06) : 0.997;

    this.vy += this.gravity * dt;
    this.vy = Math.min(this.vy, this.maxFallSpeed);

    if (input.jumpPressed() && this.onGround) {
      this.vy = -this.jumpVelocity;
      this.onGround = false;
    }

    if (!this.onGround && Math.abs(axis) > 0.01) {
      this.av += axis * 7.0 * dt;
    }

    this.av *= 0.992;
    this.angle += this.av * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const gy = groundHeightFn(this.x);
    const penetration = this.y - gy;
    if (penetration >= -this.groundSnap) {
      const springForce = Math.max(0, penetration) * this.contactSpring;
      const dampingForce = this.vy * this.contactDamping;
      this.vy -= (springForce + dampingForce) * dt;

      if (this.y > gy) this.y = gy;

      if (Math.abs(this.vy) < 25) this.vy = 0;
      this.onGround = true;
      this.av *= 0.94;
    } else {
      this.onGround = false;
    }

    this.wheelSpin += this.vx * dt * 0.12;
  }
}
