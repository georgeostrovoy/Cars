import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.20.0/+esm';
import { Input } from '../core/input.js';

const { Engine, World, Bodies, Body, Constraint, Runner, Events, Vector } = Matter;

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
    this.surfaceZones = [{ from: 0, to: 6000, color: '#6a4a2e', friction: 0.92, name: 'dirt' }];
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
    const chassis = Bodies.rectangle(x, y, 130, 36, { density: 0.0025, frictionAir: 0.02, restitution: 0.05, chamfer: { radius: 10 }, label: 'chassis' });
    const wheelOptions = { density: 0.0035, friction: 1.0, restitution: 0.02, label: 'wheel' };
    const leftWheel = Bodies.circle(x - 42, y + 26, 19, wheelOptions);
    const rightWheel = Bodies.circle(x + 42, y + 26, 19, wheelOptions);

    const constraints = [
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 20 }, bodyB: leftWheel, stiffness: 0.65, damping: 0.2, length: 8 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 20 }, bodyB: rightWheel, stiffness: 0.65, damping: 0.2, length: 8 }),
      Constraint.create({ bodyA: chassis, pointA: { x: -42, y: 0 }, bodyB: leftWheel, stiffness: 0.35, damping: 0.25, length: 30 }),
      Constraint.create({ bodyA: chassis, pointA: { x: 42, y: 0 }, bodyB: rightWheel, stiffness: 0.35, damping: 0.25, length: 30 }),
    ];

    World.add(this.world, [chassis, leftWheel, rightWheel, ...constraints]);
    return { chassis, leftWheel, rightWheel };
  }

  _buildTerrain() {
    const zone = this.surfaceZones[0];
    for (let x = zone.from; x < zone.to; x += 80) {
      const mid = x + 40;
      const y = 530;
      const ground = Bodies.rectangle(mid, y + 45, 80, 90, {
        isStatic: true,
        friction: zone.friction,
        label: 'ground',
        renderColor: zone.color,
      });
      this.terrainBodies.push(ground);
    }
    World.add(this.world, this.terrainBodies);
  }

  _stepControls() {
    const axis = this.input.axis();
    const { chassis, leftWheel, rightWheel } = this.car;
    const zone = this._surfaceForX(chassis.position.x);
    const traction = zone?.friction ?? 0.9;

    if (axis !== 0) {
      const torque = 0.0038 * traction;
      Body.setAngularVelocity(leftWheel, leftWheel.angularVelocity + axis * torque);
      Body.setAngularVelocity(rightWheel, rightWheel.angularVelocity + axis * torque);
      Body.applyForce(chassis, chassis.position, { x: axis * 0.00055 * traction, y: 0 });
    }

    if (this.input.jumpPressed() && this._isGrounded()) Body.applyForce(chassis, chassis.position, { x: 0, y: -0.04 });
    if (!this._isGrounded() && axis !== 0) Body.setAngularVelocity(chassis, chassis.angularVelocity + axis * 0.007);
    if (this.input.resetPressed()) this._resetCar();
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
    return this.surfaceZones.find((z) => x >= z.from && x < z.to) ?? this.surfaceZones[0];
  }

  _updateHud() {
    const zone = this._surfaceForX(this.car.chassis.position.x);
    this.surfaceEl.textContent = `Surface: ${zone?.name ?? 'dirt'}`;
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
