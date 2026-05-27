export class Input {
  constructor() {
    this.keys = new Set();
    this.touch = { left: false, right: false, jump: false, reset: false };

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));

    this._bindTouchButton('btn-left', 'left');
    this._bindTouchButton('btn-right', 'right');
    this._bindTouchButton('btn-jump', 'jump');
    this._bindTouchButton('btn-reset', 'reset', true);
  }

  _bindTouchButton(id, action, oneShot = false) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const press = (e) => {
      e.preventDefault();
      this.touch[action] = true;
    };

    const release = (e) => {
      e.preventDefault();
      if (!oneShot) this.touch[action] = false;
    };

    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('pointercancel', release);

    if (oneShot) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.touch[action] = true;
      });
    }
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
    const keyboard = this.keys.has('KeyR');
    const touchReset = this.touch.reset;
    this.touch.reset = false;
    return keyboard || touchReset;
  }
}
