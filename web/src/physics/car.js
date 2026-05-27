import { TERRAIN, terrainAtX } from '../world/terrain.js';

export class Car {
  constructor() {
    this.gravity = 1600;
    this.maxFallSpeed = 1400;
    this.jumpVelocity = 760;
    this.groundSnap = 4;
    this.contactSpring = 95;
    this.contactDamping = 16;
    this.wheelBase = 88;
    this.chassisHeight = 18;
    this.alignStrength = 18;
    this.alignDamping = 5;
    this.selfRightStrength = 26;
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

    this._solveGroundContact(dt, groundHeightFn, traction);
    this._applySelfRighting(dt, axis);

    this.wheelSpin += this.vx * dt * 0.12;
  }

  _solveGroundContact(dt, groundHeightFn, traction) {
    const halfBase = this.wheelBase * 0.5;
    const leftX = this.x - halfBase;
    const rightX = this.x + halfBase;
    const leftGround = groundHeightFn(leftX);
    const rightGround = groundHeightFn(rightX);

    const minGround = Math.min(leftGround, rightGround);
    const penetration = this.y - minGround;

    if (penetration >= -this.groundSnap) {
      const springForce = Math.max(0, penetration) * this.contactSpring;
      const dampingForce = this.vy * this.contactDamping;
      this.vy -= (springForce + dampingForce) * dt;

      if (this.y > minGround) this.y = minGround;
      if (Math.abs(this.vy) < 25) this.vy = 0;

      const terrainAngle = Math.atan2(rightGround - leftGround, this.wheelBase);
      const angleDelta = normalizeAngle(terrainAngle - this.angle);

      this.av += angleDelta * this.alignStrength * traction * dt;
      this.av -= this.av * this.alignDamping * dt;
      this.angle += angleDelta * Math.min(1, dt * 8);

      this.onGround = true;
    } else {
      this.onGround = false;
    }
  }

  _applySelfRighting(dt, axis) {
    const upsideDown = Math.cos(this.angle) < -0.25;
    const almostStill = Math.abs(this.vx) < 80 && Math.abs(this.vy) < 80;

    if (this.onGround && upsideDown && almostStill) {
      const desired = axis !== 0 ? Math.sign(axis) * 0.1 : 0;
      const angleDelta = normalizeAngle(desired - this.angle);
      this.av += angleDelta * this.selfRightStrength * dt;
      this.av *= 0.96;
    }
  }
}

function normalizeAngle(value) {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}
