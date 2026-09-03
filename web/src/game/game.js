import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm';
import { Input } from '../core/input.js';

const { Engine, World, Bodies, Body, Constraint, Runner, Events, Vector } = Matter;

export class Game {
  constructor(canvas, surfaceEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.surfaceEl = surfaceEl;

    this.engine = Engine.create({ gravity: { x: 0, y: 1.2 }, enableSleeping: true });
    this.engine.positionIterations = 8;
    this.engine.velocityIterations = 7;
    this.world = this.engine.world;
    this.runner = Runner.create({ delta: 1000 / 120, isFixed: true });

    this.segmentStep = 80;
    this.segmentDepth = 100;
    this.keepRange = 3000;
    this.spawnAhead = 2200;
    this.spawnBehind = 800;

    this.terrainSegments = new Map();
    this.terrainPoints = new Map();
    this.surfaceZones = [{ color: '#6a4a2e', friction: 0.92, name: 'dirt' }];

    this.car = this._buildCar(200, 380);
    this.cameraX = 0;

    this._extendTerrainAround(200);
    Events.on(this.runner, 'beforeUpdate', () => this._stepControls());
  }

  start() {
    Runner.run(this.runner, this.engine);
    requestAnimationFrame(() => this.loop());
  }

  loop() {
    const focusX = this.car.chassis.position.x;
    this._extendTerrainAround(focusX);
    this._cleanupTerrain(focusX);
    this._updateHud();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  _buildCar(x, y) {
    const chassis = Bodies.rectangle(x, y, 130, 36, {
      density: 0.0029,
      frictionAir: 0.05,
      restitution: 0.0,
      chamfer: { radius: 10 },
      sleepThreshold: 55,
      label: 'chassis',
    });
    const wheelOptions = {
      density: 0.0038,
      friction: 1.15,
      frictionStatic: 1.8,
      restitution: 0.0,
      frictionAir: 0.018,
      inertia: 0.9,
      sleepThreshold: 20,
      label: 'wheel',
    };
    const leftWheel = Bodies.circle(x - 42, y + 26, 19, wheelOptions);
    const rightWheel = Bodies.circle(x + 42, y + 26, 19, wheelOptions);

    const constraints = [
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 18 }, bodyB: leftWheel, stiffness: 0.34, damping: 0.82, length: 9 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 18 }, bodyB: rightWheel, stiffness: 0.34, damping: 0.82, length: 9 }),
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 2 }, bodyB: leftWheel, stiffness: 0.12, damping: 0.9, length: 29 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 2 }, bodyB: rightWheel, stiffness: 0.12, damping: 0.9, length: 29 }),
    ];

    World.add(this.world, [chassis, leftWheel, rightWheel, ...constraints]);
    return { chassis, leftWheel, rightWheel };
  }

  _extendTerrainAround(centerX) {
    const minX = this._snapX(centerX - this.spawnBehind);
    const maxX = this._snapX(centerX + this.spawnAhead);

    for (let x = minX; x <= maxX; x += this.segmentStep) {
      if (this.terrainSegments.has(x)) continue;

      const aX = x;
      const bX = x + this.segmentStep;
      const aY = this._groundY(aX);
      const bY = this._groundY(bX);
      this.terrainPoints.set(aX, aY);
      this.terrainPoints.set(bX, bY);

      const dx = bX - aX;
      const dy = bY - aY;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const midX = (aX + bX) * 0.5;
      const midY = (aY + bY) * 0.5;
      const zone = this.surfaceZones[0];

      const ground = Bodies.rectangle(midX, midY + 48, length + 2, this.segmentDepth, {
        isStatic: true,
        angle,
        friction: zone.friction,
        label: 'ground',
        renderColor: zone.color,
      });

      this.terrainSegments.set(x, ground);
      World.add(this.world, ground);
    }
  }

  _cleanupTerrain(centerX) {
    const minKeep = centerX - this.keepRange;
    const maxKeep = centerX + this.keepRange;

    for (const [x, body] of this.terrainSegments) {
      if (x < minKeep || x > maxKeep) {
        World.remove(this.world, body);
        this.terrainSegments.delete(x);
      }
    }
  }

  _groundY(x) {
    return 540
      - Math.sin(x * 0.0042) * 46
      - Math.sin(x * 0.0098) * 18
      + Math.sin(x * 0.0017) * 24;
  }

  _snapX(x) {
    return Math.floor(x / this.segmentStep) * this.segmentStep;
  }

  _stepControls() {
    const axis = this.input.axis();
    const { chassis, leftWheel, rightWheel } = this.car;
    const zone = this.surfaceZones[0];
    const traction = zone.friction;
    const groundAhead = this._groundY(chassis.position.x + 45);
    const groundBehind = this._groundY(chassis.position.x - 45);
    const slopeAngle = Math.atan2(groundAhead - groundBehind, 90);

    if (axis !== 0) {
      // Apply torque instead of overwriting angular velocity so contact friction
      // can turn the wheels and the solver can keep the car settled.
      const torque = axis * 0.0022 * traction;
      Body.setAwake(leftWheel, true);
      Body.setAwake(rightWheel, true);
      Body.applyTorque(leftWheel, torque);
      Body.applyTorque(rightWheel, torque);
      Body.applyForce(chassis, chassis.position, { x: axis * 0.00034 * traction, y: 0 });
    }

    // Keep wheel spin finite and let the ground solver damp small contact jitter.
    Body.setAngularVelocity(leftWheel, leftWheel.angularVelocity * 0.995);
    Body.setAngularVelocity(rightWheel, rightWheel.angularVelocity * 0.995);

    if (this.input.jumpPressed() && this._isGrounded()) Body.applyForce(chassis, chassis.position, { x: 0, y: -0.038 });

    // anti-flip stabilization on throttle/brake
    const angleError = slopeAngle - chassis.angle;
    const angVel = chassis.angularVelocity;
    const stabilize = (axis !== 0 && this._isGrounded()) ? 0.0028 : 0.0011;
    Body.setAngularVelocity(chassis, angVel + angleError * stabilize - angVel * 0.025);

    if (!this._isGrounded() && axis !== 0) Body.setAngularVelocity(chassis, chassis.angularVelocity + axis * 0.0045);
    if (this.input.resetPressed()) this._resetCar();
  }

  _isGrounded() {
    const { leftWheel, rightWheel } = this.car;
    return leftWheel.position.y > this._groundY(leftWheel.position.x) - 6
      || rightWheel.position.y > this._groundY(rightWheel.position.x) - 6;
  }

  _resetCar() {
    const { chassis, leftWheel, rightWheel } = this.car;
    Body.setPosition(chassis, { x: chassis.position.x + 20, y: 360 });
    Body.setVelocity(chassis, Vector.create(0, 0));
    Body.setAngle(chassis, 0);
    Body.setAngularVelocity(chassis, 0);
    Body.setPosition(leftWheel, { x: chassis.position.x - 42, y: 390 });
    Body.setVelocity(leftWheel, Vector.create(0, 0));
    Body.setAngularVelocity(leftWheel, 0);
    Body.setPosition(rightWheel, { x: chassis.position.x + 42, y: 390 });
    Body.setVelocity(rightWheel, Vector.create(0, 0));
    Body.setAngularVelocity(rightWheel, 0);
  }

  _updateHud() {
    this.surfaceEl.textContent = 'Surface: dirt';
  }

  render() {
    const { ctx, canvas } = this;
    this.cameraX += (this.car.chassis.position.x - canvas.width * 0.35 - this.cameraX) * 0.1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this._drawTerrain('#6a4a2e');
    this._drawBody(this.car.chassis, '#cc2b2b');
    this._drawCircle(this.car.leftWheel, '#1f1f1f');
    this._drawCircle(this.car.rightWheel, '#1f1f1f');
    ctx.restore();
  }

  _drawTerrain(color) {
    const { ctx, canvas } = this;
    const sortedX = [...this.terrainPoints.keys()].sort((a, b) => a - b);
    if (sortedX.length < 2) return;

    ctx.fillStyle = color;
    ctx.beginPath();
    const firstX = sortedX[0];
    ctx.moveTo(firstX, canvas.height + 200);
    for (const x of sortedX) {
      ctx.lineTo(x, this.terrainPoints.get(x));
    }
    const lastX = sortedX[sortedX.length - 1];
    ctx.lineTo(lastX, canvas.height + 200);
    ctx.closePath();
    ctx.fill();
  }

  _drawBody(body, color) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = color;
    ctx.fillRect(-65, -18, 130, 36);
    ctx.restore();
  }

  _drawCircle(body, color) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke();
    ctx.restore();
  }
}
