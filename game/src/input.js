// Keyboard + mouse input state.
export class Input {
  constructor() {
    this.forward = false; this.back = false; this.left = false; this.right = false;
    this.run = false; this.aim = false;
    this.keys = new Set();
    this._down = new Set();
    this._handlers = {};
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.key.toLowerCase());
      this._down.add(e.key.toLowerCase());
      this._sync();
      const h = this._handlers[e.key.toLowerCase()];
      if (h) h();
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.key.toLowerCase()); this._sync(); });
    window.addEventListener('mousedown', (e) => { if (e.button === 0) this.aim = true; });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.aim = false; });
    window.addEventListener('blur', () => { this.keys.clear(); this._sync(); });
  }
  _sync() {
    this.forward = this.keys.has('w') || this.keys.has('arrowup');
    this.back = this.keys.has('s') || this.keys.has('arrowdown');
    this.left = this.keys.has('a') || this.keys.has('arrowleft');
    this.right = this.keys.has('d') || this.keys.has('arrowright');
    this.run = this.keys.has('shift');
  }
  on(key, fn) { this._handlers[key.toLowerCase()] = fn; }
  pressed(key) { return this._down.has(key.toLowerCase()); }
  endFrame() { this._down.clear(); }
}
