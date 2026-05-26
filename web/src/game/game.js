import { Input } from '../core/input.js';
import { Car } from '../physics/car.js';
import { groundY, drawLevel } from '../world/level.js';
import { drawCar } from '../ui/render.js';

export class Game {
  constructor(canvas, surfaceEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.car = new Car();
    this.surfaceEl = surfaceEl;
    this.last = performance.now();
  }

  start() { requestAnimationFrame((t) => this.loop(t)); }

  loop(t) {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;

    if (this.input.resetPressed()) this.car.reset();
    this.car.update(this.input, dt, groundY);
    this.surfaceEl.textContent = `Surface: ${this.car.surface}`;

    this.render();
    requestAnimationFrame((n) => this.loop(n));
  }

  render() {
    const { ctx, canvas } = this;
    const camX = this.car.x - canvas.width * 0.35;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camX, 0);
    drawLevel(ctx, camX, canvas.width, canvas.height);
    drawCar(ctx, this.car);
    ctx.restore();
  }
}
