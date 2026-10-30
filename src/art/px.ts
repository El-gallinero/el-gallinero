// Mini-kit de pixel art por código: dibuja sobre un buffer RGBA, con sombreado automático
// (luz arriba-izquierda), polígonos, líneas, contorno y espejo. Sin suavizado.
export type RGB = [number, number, number];
export interface Ramp { base: string; dark: string; light: string; deep: string }

const hexCache = new Map<string, RGB>();
export function hex(c: string): RGB {
  let v = hexCache.get(c);
  if (!v) {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(c, v);
  }
  return v;
}
export function toHex([r, g, b]: RGB): string {
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
export function mix(a: string, b: string, t: number): string {
  const A = hex(a), B = hex(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
const rampCache = new Map<string, Ramp>();
/** Rampa de 4 tonos coherente: sombras hacia violeta, luces hacia crema cálida. */
export function ramp(base: string): Ramp {
  let r = rampCache.get(base);
  if (!r) {
    r = { base, dark: mix(base, '#2a1a4a', 0.36), deep: mix(base, '#160c2a', 0.62), light: mix(base, '#fff2c8', 0.34) };
    rampCache.set(base, r);
  }
  return r;
}

export class Px {
  d: Uint8ClampedArray;
  constructor(public w: number, public h: number) { this.d = new Uint8ClampedArray(w * h * 4); }

  set(x: number, y: number, col: string | RGB, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const c = typeof col === 'string' ? hex(col) : col;
    const i = (y * this.w + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a;
  }
  get(x: number, y: number): RGB | null {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4;
    return this.d[i + 3] ? [this.d[i], this.d[i + 1], this.d[i + 2]] : null;
  }
  alpha(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[(y * this.w + x) * 4 + 3];
  }
  rect(x: number, y: number, w: number, h: number, col: string | RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, col);
  }
  /** Caja con luz arriba/izquierda y sombra abajo/derecha. */
  box(x: number, y: number, w: number, h: number, r: Ramp, edge = true) {
    this.rect(x, y, w, h, r.base);
    if (edge) {
      this.rect(x, y, w, 1, r.light); this.rect(x, y, 1, h, r.light);
      this.rect(x, y + h - 1, w, 1, r.dark); this.rect(x + w - 1, y + 1, 1, h - 1, r.dark);
    }
  }
  ell(cx: number, cy: number, rx: number, ry: number, col: string | Ramp, shade = true) {
    const r = typeof col === 'string' ? (shade ? ramp(col) : null) : col;
    const flat = typeof col === 'string' ? col : col.base;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const dd = dx * dx + dy * dy;
        if (dd > 1) continue;
        if (!r) { this.set(x, y, flat); continue; }
        const l = -(dx * 0.5 + dy * 0.85);       // >0 = zona iluminada
        let c = r.base;
        if (l > 0.5 && dd < 0.8) c = r.light;
        else if (l < -0.42) c = r.dark;
        if (l < -0.85 && dd > 0.55) c = r.deep;
        this.set(x, y, c);
      }
    }
  }
  /** Rellena solo donde la función devuelva color. */
  where(x0: number, y0: number, x1: number, y1: number, f: (x: number, y: number) => string | RGB | null) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = f(x, y); if (c) this.set(x, y, c); }
  }
  poly(pts: [number, number][], col: string | RGB) {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const yy = y + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + ((yy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, col);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, col: string | RGB, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      if (t <= 1) this.set(x, y, col);
      else this.rect(Math.round(x - t / 2), Math.round(y - t / 2), t, t, col);
    }
  }
  /** Contorno exterior de 1px (4 vecinos). */
  outline(col: string | RGB) {
    const c = typeof col === 'string' ? hex(col) : col;
    const src = new Uint8ClampedArray(this.d);
    const A = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[(y * this.w + x) * 4 + 3]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (A(x, y) > 0) continue;
      if (A(x - 1, y) > 0 || A(x + 1, y) > 0 || A(x, y - 1) > 0 || A(x, y + 1) > 0) this.set(x, y, c);
    }
  }
  blit(s: Px, ox: number, oy: number) {
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      const i = (y * s.w + x) * 4;
      if (s.d[i + 3] > 0) this.set(ox + x, oy + y, [s.d[i], s.d[i + 1], s.d[i + 2]], s.d[i + 3]);
    }
  }
  mirror(): Px {
    const o = new Px(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4, j = (y * this.w + (this.w - 1 - x)) * 4;
      o.d[j] = this.d[i]; o.d[j + 1] = this.d[i + 1]; o.d[j + 2] = this.d[i + 2]; o.d[j + 3] = this.d[i + 3];
    }
    return o;
  }
  canvas(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const g = c.getContext('2d')!;
    g.putImageData(new ImageData(new Uint8ClampedArray(this.d), this.w, this.h), 0, 0);
    return c;
  }
}

// ruido determinista
export function hash2(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 100000) / 100000;
}
export function vnoise(x: number, y: number, s = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
