export class Input {
  constructor() {
    this.keys = new Set();
    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  axis() {
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  jumpPressed() { return this.keys.has('Space'); }
  resetPressed() { return this.keys.has('KeyR'); }
}
