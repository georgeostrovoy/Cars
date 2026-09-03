export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, jump: false };
    this.resetQueued = false;

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));

    this._bindHoldButton('btn-left', 'left');
    this._bindHoldButton('btn-right', 'right');
    this._bindHoldButton('btn-jump', 'jump');
    this._bindTapButton('btn-reset', () => { this.resetQueued = true; });
  }

  _bindHoldButton(id, action) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const onDown = (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      this.touch[action] = true;
    };

    const onUp = (e) => {
      e.preventDefault();
      this.touch[action] = false;
    };

    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointercancel', onUp);
    btn.addEventListener('lostpointercapture', onUp);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  _bindTapButton(id, cb) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cb();
    });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  axis() {
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.touch.left;
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.touch.right;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  jumpPressed() {
    return this.keys.has('Space') || this.touch.jump;
  }

  resetPressed() {
    const pressed = this.keys.has('KeyR') || this.resetQueued;
    this.resetQueued = false;
    return pressed;
  }
}
