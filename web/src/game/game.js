import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm';
import { Input } from '../core/input.js';

const {
  Engine,
  World,
  Bodies,
  Body,
  Constraint,
  Composite,
  Runner,
  Events,
  Vector,
} = Matter;

export class Game {
  constructor(canvas, surfaceEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.surfaceEl = surfaceEl;

    this.engine = Engine.create({ gravity: { x: 0, y: 1.2 } });
    this.world = this.engine.world;
    this.runner = Runner.create({ delta: 1000 / 120, isFixed: true });

    this.terrainBodies = [];
    this.surfaceZones = [];
    this._buildTerrain();
    this.car = this._buildCar(200, 380);

    this.cameraX = 0;

    Events.on(this.runner, 'beforeUpdate', () => this._stepControls());
  }

  start() {
    Runner.run(this.runner, this.engine);
    requestAnimationFrame(() => this.loop());
  }

  loop() {
    this._updateHud();
    this.render();
    requestAnimationFrame(() => this.loop());
  }

  _buildCar(x, y) {
    const chassis = Bodies.rectangle(x, y, 130, 36, {
      density: 0.0025,
      frictionAir: 0.02,
      restitution: 0.05,
      chamfer: { radius: 10 },
      label: 'chassis',
    });

    const wheelOptions = { density: 0.0035, friction: 1.0, restitution: 0.02, label: 'wheel' };
    const leftWheel = Bodies.circle(x - 42, y + 26, 19, wheelOptions);
    const rightWheel = Bodies.circle(x + 42, y + 26, 19, wheelOptions);

    const axleStiffness = 0.65;
    const damping = 0.2;
    const constraints = [
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 20 }, bodyB: leftWheel, stiffness: axleStiffness, damping, length: 8 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 20 }, bodyB: rightWheel, stiffness: axleStiffness, damping, length: 8 }),
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 0 }, bodyB: leftWheel, stiffness: 0.35, damping: 0.25, length: 30 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 0 }, bodyB: rightWheel, stiffness: 0.35, damping: 0.25, length: 30 }),
    ];

    World.add(this.world, [chassis, leftWheel, rightWheel, ...constraints]);
    return { chassis, leftWheel, rightWheel };
  }

  _buildTerrain() {
    const segments = [
      { from: 0, to: 900, color: '#6a4a2e', friction: 0.95, amp: 25, freq: 0.005 },
      { from: 900, to: 1700, color: '#3f8f3f', friction: 0.8, amp: 35, freq: 0.007 },
      { from: 1700, to: 2500, color: '#d5bb74', friction: 0.55, amp: 45, freq: 0.009 },
      { from: 2500, to: 3600, color: '#c4ebff', friction: 0.22, amp: 38, freq: 0.011 },
    ];

    for (const zone of segments) {
      this.surfaceZones.push(zone);
      for (let x = zone.from; x < zone.to; x += 80) {
        const mid = x + 40;
        const y = 530 - Math.sin(mid * zone.freq) * zone.amp;
        const ground = Bodies.rectangle(mid, y + 45, 80, 90, {
          isStatic: true,
          friction: zone.friction,
          label: 'ground',
          renderColor: zone.color,
        });
        this.terrainBodies.push(ground);
      }
    }

    World.add(this.world, this.terrainBodies);
  }

  _stepControls() {
    const axis = this.input.axis();
    const { chassis, leftWheel, rightWheel } = this.car;
    const zone = this._surfaceForX(chassis.position.x);
    const traction = zone?.friction ?? 0.9;

    const torque = 0.0038 * traction;
    if (axis !== 0) {
      Body.setAngularVelocity(leftWheel, leftWheel.angularVelocity + axis * torque);
      Body.setAngularVelocity(rightWheel, rightWheel.angularVelocity + axis * torque);
      Body.applyForce(chassis, chassis.position, { x: axis * 0.00055 * traction, y: 0 });
    }

    if (this.input.jumpPressed() && this._isGrounded()) {
      Body.applyForce(chassis, chassis.position, { x: 0, y: -0.04 });
    }

    if (!this._isGrounded() && axis !== 0) {
      Body.setAngularVelocity(chassis, chassis.angularVelocity + axis * 0.007);
    }

    if (this.input.resetPressed()) {
      this._resetCar();
    }
  }

  _isGrounded() {
    const { leftWheel, rightWheel } = this.car;
    return leftWheel.position.y > 500 || rightWheel.position.y > 500;
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

  _surfaceForX(x) {
    return this.surfaceZones.find((z) => x >= z.from && x < z.to) ?? this.surfaceZones[this.surfaceZones.length - 1];
  }

  _updateHud() {
    const zone = this._surfaceForX(this.car.chassis.position.x);
    this.surfaceEl.textContent = `Surface: ${zone === undefined ? 'dirt' : zone.color === '#6a4a2e' ? 'dirt' : zone.color === '#3f8f3f' ? 'grass' : zone.color === '#d5bb74' ? 'sand' : 'ice'}`;
  }

  render() {
    const { ctx, canvas } = this;
    this.cameraX += (this.car.chassis.position.x - canvas.width * 0.35 - this.cameraX) * 0.1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-this.cameraX, 0);

    for (const body of this.terrainBodies) {
      ctx.fillStyle = body.renderColor ?? '#6a4a2e';
      ctx.fillRect(body.position.x - 40, body.position.y - 45, 80, 90);
    }

    this._drawBody(this.car.chassis, '#cc2b2b');
    this._drawCircle(this.car.leftWheel, '#1f1f1f');
    this._drawCircle(this.car.rightWheel, '#1f1f1f');

    ctx.restore();
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
