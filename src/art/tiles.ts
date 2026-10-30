import { Px, hash2, vnoise, rng } from './px';
import { PATHS, MUD, STRAW, WORLD, DOOR, START } from '../config/world';
import { tuft, flower, feathers } from './props';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5;
const GRASS = [hexA('#82cc50'), hexA('#72bb44'), hexA('#62a83a'), hexA('#549a33')];
const GRASS_DARK = [hexA('#5f9e56'), hexA('#528e4f'), hexA('#467e48'), hexA('#3c6e42')];  // junto a la puerta
const DIRT = [hexA('#d4a05e'), hexA('#c8934f'), hexA('#bb8744')];
function hexA(c: string): [number, number, number] { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const tick = () => new Promise<void>(r => setTimeout(r, 0));

/** Campo de distancia firmado a los caminos (dist - radio). Negativo = dentro del camino. */
export function buildPathField(): Float32Array {
  const { w, h } = WORLD;
  const f = new Float32Array(w * h).fill(999);
  for (const path of PATHS) {
    for (let i = 0; i + 1 < path.pts.length; i++) {
      const [x0, y0] = path.pts[i], [x1, y1] = path.pts[i + 1];
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(len / 2));
      const R = path.r + 9;
      for (let k = 0; k <= n; k++) {
        const cx = x0 + ((x1 - x0) * k) / n, cy = y0 + ((y1 - y0) * k) / n;
        for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(h - 1, Math.ceil(cy + R)); y++) {
          for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(w - 1, Math.ceil(cx + R)); x++) {
            const d = Math.hypot(x - cx, y - cy) - path.r;
            const idx = y * w + x;
            if (d < f[idx]) f[idx] = d;
          }
        }
      }
    }
  }
  return f;
}

export interface GroundResult { canvas: HTMLCanvasElement; field: Float32Array }

export async function generateGround(progress: (p: number) => void): Promise<GroundResult> {
  const { w, h } = WORLD;
  const px = new Px(w, h);
  const d = px.d;
  const field = buildPathField();
  await tick();
  const put = (i: number, c: [number, number, number]) => { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x, i = idx * 4;
      const nWide = vnoise(x / 56, y / 56, 1) * 0.62 + vnoise(x / 17, y / 17, 2) * 0.38;
      const b = bay(x, y);
      // ¿zona oscura de la puerta?
      const dd = Math.hypot(x - DOOR.x, (y - DOOR.y) * 0.8);
      const dark = dd < 260 ? Math.min(1, (260 - dd) / 120) : 0;
      const pal = dark > 0.5 + b * 0.6 ? GRASS_DARK : GRASS;
      const v = nWide + b * 0.34;
      let gi = v < 0.34 ? 3 : v < 0.46 ? 2 : v < 0.62 ? 1 : 0;
      const hh = hash2(x, y);
      let col = pal[gi];
      if (hh < 0.01) col = pal[Math.max(0, gi - 1)]; else if (hh > 0.992) col = pal[Math.min(3, gi + 1)];
      // zona de salida (más clara y florida)
      let s = field[idx];
      if (s < 900) s += (vnoise(x / 8, y / 8, 3) - 0.5) * 7;
      if (s < -2.6) {
        // camino de tierra
        const dv = vnoise(x / 5, y / 5, 4) + b * 0.4;
        col = dv < 0.36 ? DIRT[2] : dv < 0.62 ? DIRT[1] : DIRT[0];
        if (hh < 0.016) col = hexA('#e6bd7a'); else if (hh > 0.985) col = hexA('#9a6a38');
        if (dd < 100) { // losas de piedra frente a la puerta
          const by = Math.floor(y / 9), off = (by & 1) * 8, bxx = Math.floor((x + off) / 16);
          const lx = (x + off) % 16, ly = y % 9;
          col = lx === 0 || ly === 0 ? hexA('#4a4658') : hash2(bxx, by) > 0.5 ? hexA('#7c788a') : hexA('#6c6878');
        }
      } else if (s < 0) col = dd < 100 ? hexA('#3a3648') : hexA('#8f5f32');
      else if (s < 1.7) col = dark > 0.5 ? hexA('#356338') : hexA('#4b8a31');
      put(i, col);
    }
    if (y % 120 === 0) { progress(0.15 + 0.6 * (y / h)); await tick(); }
  }
  // barro, charcos y paja (por encima del terreno)
  const blob = (list: { x: number; y: number; rx: number; ry: number }[], f: (x: number, y: number, k: number) => [number, number, number] | null) => {
    for (const m of list) {
      for (let y = Math.max(0, m.y - m.ry - 8); y < Math.min(h, m.y + m.ry + 8); y++) for (let x = Math.max(0, m.x - m.rx - 8); x < Math.min(w, m.x + m.rx + 8); x++) {
        const k = ((x - m.x) / m.rx) ** 2 + ((y - m.y) / m.ry) ** 2 + (vnoise(x / 9, y / 9, 7) - 0.5) * 0.55;
        const c = f(x, y, k); if (c) put((y * w + x) * 4, c);
      }
    }
  };
  blob(STRAW, (x, y, k) => {
    if (k > 1) return null;
    if (k > 0.82) return bay(x, y) > 0 ? hexA('#cfa84a') : null;
    const st = (x * 3 + y * 2) % 9;
    return st === 0 ? hexA('#f2d47a') : st === 3 ? hexA('#b58a32') : bay(x, y) > 0.1 ? hexA('#e2bd58') : hexA('#d6af4a');
  });
  blob(MUD, (x, y, k) => {
    if (k > 1.15) return null;
    if (k > 1) return hexA('#4a2e1c');
    if (k < 0.32) { // charco
      const wv = (x + y * 2) % 11 === 0 ? hexA('#bfe3f4') : (x * 2 + y) % 17 === 0 ? hexA('#8cc4e0') : hexA('#5d92b8');
      return wv;
    }
    if (k < 0.4) return hexA('#3f6684');
    const dv = vnoise(x / 4, y / 4, 8) + bay(x, y) * 0.4;
    return dv < 0.4 ? hexA('#523620') : dv < 0.7 ? hexA('#664328') : hexA('#7a5232');
  });
  progress(0.8); await tick();
  // matas de hierba, flores, plumas
  const r = rng(77);
  const ok = (x: number, y: number) => x > 20 && y > 20 && x < w - 20 && y < h - 20 && field[Math.floor(y) * w + Math.floor(x)] > 8;
  const isMud = (x: number, y: number) => [...MUD, ...STRAW].some(m => ((x - m.x) / m.rx) ** 2 + ((y - m.y) / m.ry) ** 2 < 1.1);
  const T = [tuft(0), tuft(1)];
  for (let n = 0; n < 1500; n++) { const x = r() * w, y = r() * h; if (ok(x, y) && !isMud(x, y) && Math.hypot(x - DOOR.x, y - DOOR.y) > 160) px.blit(T[n & 1], Math.floor(x), Math.floor(y)); }
  const FC = ['#ffffff', '#ff6f9c', '#ffd84a', '#b97aff', '#ff8a3a'];
  const F = FC.map(c => flower(c));
  for (let n = 0; n < 420; n++) {
    let x = r() * w, y = r() * h;
    if (n < 120) { x = START.x + (r() - 0.5) * 340; y = START.y + (r() - 0.5) * 230; }       // la zona de inicio, más florida
    if (ok(x, y) && !isMud(x, y) && Math.hypot(x - DOOR.x, y - DOOR.y) > 170) px.blit(F[Math.floor(r() * F.length)], Math.floor(x), Math.floor(y));
  }
  const FE = feathers();
  for (let n = 0; n < 60; n++) { const x = r() * w, y = r() * h; if (ok(x, y)) px.blit(FE, Math.floor(x), Math.floor(y)); }
  progress(1);
  return { canvas: px.canvas(), field };
}
