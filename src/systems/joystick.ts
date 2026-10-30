/** Joystick virtual táctil (DOM + Pointer Events). Zona amplia abajo a la izquierda; la base sigue al dedo. */
export class Joystick {
  vec = { x: 0, y: 0 };
  private zone = document.getElementById('joy-zone')!;
  private base = document.getElementById('joy-base')!;
  private knob = document.getElementById('joy-knob')!;
  private id: number | null = null;
  private cx = 0; private cy = 0;
  private readonly R = 46;
  private onResize = () => this.rest();

  constructor() {
    this.zone.addEventListener('pointerdown', this.down);
    this.zone.addEventListener('pointermove', this.move);
    this.zone.addEventListener('pointerup', this.up);
    this.zone.addEventListener('pointercancel', this.up);
    this.zone.addEventListener('lostpointercapture', this.up);
    this.zone.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', this.onResize);
    this.rest();
  }
  get active() { return this.id !== null; }
  setEnabled(on: boolean) {
    this.zone.classList.toggle('on', on);
    if (!on) this.release();
    else this.rest();
  }
  destroy() {
    this.setEnabled(false);
    this.zone.removeEventListener('pointerdown', this.down); this.zone.removeEventListener('pointermove', this.move);
    this.zone.removeEventListener('pointerup', this.up); this.zone.removeEventListener('pointercancel', this.up);
    this.zone.removeEventListener('lostpointercapture', this.up);
    window.removeEventListener('resize', this.onResize);
  }
  private rest() {
    const r = this.zone.getBoundingClientRect();
    this.place(Math.max(72, r.width * 0.2), r.height - 78 - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-b')) || 0));
    this.knob.style.transform = 'translate(0px,0px)';
  }
  private place(x: number, y: number) { this.base.style.left = x + 'px'; this.base.style.top = y + 'px'; this.cx = x; this.cy = y; }
  private down = (e: PointerEvent) => {
    if (this.id !== null) return;
    e.preventDefault();
    this.id = e.pointerId;
    try { this.zone.setPointerCapture(e.pointerId); } catch { /* */ }
    const r = this.zone.getBoundingClientRect();
    this.place(Math.min(Math.max(e.clientX - r.left, 62), r.width - 62), Math.min(Math.max(e.clientY - r.top, 62), r.height - 62));
    this.base.classList.add('active');
    this.move(e);
  };
  private move = (e: PointerEvent) => {
    if (e.pointerId !== this.id) return;
    e.preventDefault();
    const r = this.zone.getBoundingClientRect();
    let dx = e.clientX - r.left - this.cx, dy = e.clientY - r.top - this.cy;
    const len = Math.hypot(dx, dy);
    if (len > this.R) { dx = (dx / len) * this.R; dy = (dy / len) * this.R; }
    this.knob.style.transform = `translate(${dx}px,${dy}px)`;
    let vx = dx / this.R, vy = dy / this.R;
    const m = Math.hypot(vx, vy);
    if (m < 0.16) { vx = 0; vy = 0; } else { const k = (m - 0.16) / 0.84 / m; vx *= k; vy *= k; }
    this.vec.x = vx; this.vec.y = vy;
  };
  private up = (e: PointerEvent) => { if (e.pointerId === this.id) this.release(); };
  private release() {
    if (this.id !== null) { try { this.zone.releasePointerCapture(this.id); } catch { /* */ } }
    this.id = null; this.vec.x = 0; this.vec.y = 0;
    this.base.classList.remove('active');
    this.rest();
  }
}
