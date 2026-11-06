import { Px, ramp, hash2, rng } from './px';
const OUT = '#2a1a22';

export interface PropArt { px: Px; ox: number; oy: number; fw: number; fh: number }   // ox/oy origen (pies), fw/fh huella de colisión
const P = (px: Px, fw = 0, fh = 0, ox = px.w / 2, oy = px.h - 1): PropArt => ({ px, ox, oy, fw, fh });

function leafCluster(p: Px, cx: number, cy: number, rx: number, ry: number, base: string, seed = 1) {
  const r = rng(seed);
  const g = ramp(base);
  p.ell(cx, cy, rx, ry, g);
  for (let i = 0; i < 6; i++) { const x = cx + (r() - 0.5) * rx * 1.4, y = cy + (r() - 0.7) * ry; p.rect(Math.round(x), Math.round(y), 2, 1, g.light); }
}

export function tree(variant = 0): PropArt {
  const p = new Px(72, 90);
  const trunk = ramp('#7a4a2a');
  p.box(30, 56, 12, 30, trunk, true); p.rect(33, 62, 1, 20, trunk.dark); p.poly([[30, 86], [24, 89], [30, 89]], trunk.base); p.poly([[42, 86], [48, 89], [42, 89]], trunk.base);
  const c = variant === 1 ? ['#5aa83a', '#68b844', '#4a9a34'] : ['#4e9e3a', '#5cae42', '#428c30'];
  leafCluster(p, 22, 48, 17, 13, c[2], 3); leafCluster(p, 50, 48, 17, 13, c[2], 4);
  leafCluster(p, 36, 34, 25, 20, c[0], 5);
  leafCluster(p, 24, 28, 14, 12, c[1], 6); leafCluster(p, 48, 26, 14, 11, c[1], 7); leafCluster(p, 36, 16, 14, 11, c[1], 8);
  if (variant === 1) for (const [x, y] of [[26, 30], [44, 36], [36, 24], [52, 28]]) p.rect(x, y, 2, 2, '#e8402c');
  p.outline(OUT);
  return P(p, 12, 8);
}
export function deadTree(): PropArt {
  const p = new Px(64, 90);
  const t = ramp('#4a3a46');
  p.box(28, 40, 9, 46, t, true);
  p.line(32, 50, 12, 24, t.base, 4); p.line(12, 24, 6, 10, t.base, 3); p.line(12, 24, 20, 12, t.base, 2);
  p.line(34, 44, 52, 22, t.base, 4); p.line(52, 22, 58, 8, t.base, 3); p.line(52, 22, 46, 12, t.base, 2);
  p.line(32, 36, 32, 8, t.base, 3); p.line(32, 20, 24, 10, t.base, 2);
  p.line(30, 50, 12, 24, t.light, 1);
  p.poly([[28, 86], [20, 89], [28, 89]], t.base); p.poly([[37, 86], [45, 89], [37, 89]], t.base);
  // ojos en el tronco (pequeño guiño)
  p.rect(30, 62, 2, 1, '#ff3a2a'); p.rect(34, 62, 2, 1, '#ff3a2a');
  p.outline('#16101c');
  return P(p, 10, 8);
}
export function bush(variant = 0): PropArt {
  const p = new Px(40, 30);
  const base = variant === 1 ? '#5aa23c' : '#4f9a3a';
  leafCluster(p, 12, 19, 10, 8, '#428c30', 11); leafCluster(p, 28, 19, 10, 8, '#428c30', 12); leafCluster(p, 20, 14, 14, 10, base, 13);
  if (variant === 1) for (const [x, y] of [[12, 16], [24, 12], [30, 18], [18, 20]]) { p.rect(x, y, 2, 2, '#ff5a8a'); p.set(x, y, '#ffd0e0'); }
  p.outline(OUT);
  return P(p, 28, 9);
}
export function rock(): PropArt {
  const p = new Px(24, 16);
  p.ell(12, 10, 10, 5.5, '#9a98a8'); p.ell(9, 8, 4, 2.5, ramp('#b8b6c6'));
  p.outline(OUT);
  return P(p, 18, 6);
}
export function hayBale(): PropArt {
  const p = new Px(30, 24);
  const h = ramp('#e4bd4a');
  p.box(1, 4, 28, 18, h, true);
  for (let i = 0; i < 14; i++) { const x = 2 + ((i * 7) % 24), y = 5 + ((i * 5) % 15); p.rect(x, y, 3, 1, h.light); p.rect(x + 1, y + 2, 2, 1, h.dark); }
  p.rect(9, 4, 1, 18, '#a8472c'); p.rect(20, 4, 1, 18, '#a8472c');
  p.rect(1, 3, 28, 2, h.light);
  p.outline(OUT);
  return P(p, 28, 10);
}
export function haystack(): PropArt {
  const p = new Px(56, 50);
  const h = ramp('#e8c24e');
  p.ell(28, 34, 26, 15, h); p.poly([[10, 30], [28, 2], [46, 30]], h.base); p.ell(28, 26, 18, 14, h);
  p.poly([[28, 4], [20, 22], [28, 18]], h.light);
  for (let i = 0; i < 26; i++) { const x = 6 + ((i * 11) % 44), y = 10 + ((i * 7) % 34); p.rect(x, y, 3, 1, i % 2 ? h.light : h.dark); }
  p.rect(26, 3, 4, 3, h.dark);
  p.outline(OUT);
  return P(p, 44, 14);
}
export function trough(water = false): PropArt {
  const p = new Px(52, 22);
  const w = ramp('#8a5a30');
  p.box(1, 6, 50, 14, w, true);
  p.rect(3, 8, 46, 5, water ? '#4aa8e0' : '#3a2a1a');
  if (water) { p.rect(3, 8, 46, 1, '#9ad8ff'); p.rect(10, 10, 6, 1, '#cdeeff'); p.rect(30, 11, 8, 1, '#cdeeff'); }
  else { for (let i = 0; i < 18; i++) p.rect(4 + ((i * 5) % 44), 8 + (i % 3), 2, 1, i % 2 ? '#f1c94a' : '#d89a2a'); }
  p.rect(3, 19, 4, 3, w.dark); p.rect(45, 19, 4, 3, w.dark);
  p.outline(OUT);
  return P(p, 48, 10);
}
export function barrel(): PropArt {
  const p = new Px(20, 26);
  const w = ramp('#9a6030');
  p.ell(10, 15, 8, 10, w);
  p.rect(2, 8, 16, 2, '#4a4a58'); p.rect(2, 19, 16, 2, '#4a4a58');
  p.rect(5, 6, 1, 16, w.light);
  p.ell(10, 6, 7, 3, ramp('#b07a40'));
  p.outline(OUT);
  return P(p, 14, 7);
}
export function crate(): PropArt {
  const p = new Px(22, 22);
  const w = ramp('#b98a4a');
  p.box(1, 3, 20, 18, w, true); p.rect(1, 11, 20, 2, w.dark); p.line(2, 4, 20, 20, w.dark); p.line(20, 4, 2, 20, w.dark);
  p.outline(OUT);
  return P(p, 20, 8);
}
export function scarecrow(): PropArt {
  const p = new Px(36, 56);
  const w = ramp('#7a4a2a');
  p.rect(17, 18, 3, 36, w.base); p.rect(4, 22, 28, 3, w.base);
  p.ell(18, 14, 6, 6, '#e8d090'); p.rect(14, 12, 2, 2, '#1b1424'); p.rect(21, 12, 2, 2, '#1b1424'); p.rect(15, 17, 6, 1, '#1b1424');
  p.poly([[8, 10], [28, 10], [24, 4], [12, 4]], '#a86a30'); p.rect(8, 9, 20, 2, '#7a4a20');
  p.poly([[11, 24], [25, 24], [27, 44], [9, 44]], '#c8403a'); p.rect(12, 30, 4, 4, '#4a78c0'); p.rect(21, 36, 4, 4, '#f0d060');
  for (const x of [3, 31]) { p.rect(x, 25, 2, 6, '#e8c24e'); p.rect(x - 1, 31, 4, 1, '#e8c24e'); }
  p.rect(14, 44, 3, 4, '#e8c24e'); p.rect(21, 44, 3, 4, '#e8c24e');
  p.outline(OUT);
  return P(p, 8, 6);
}
export function coop(opts: { wall?: string; roof?: string; big?: boolean } = {}): PropArt {
  const W = opts.big ? 104 : 80, H = opts.big ? 88 : 70;
  const p = new Px(W, H);
  const wall = ramp(opts.wall ?? '#c88a4a'), roof = ramp(opts.roof ?? '#b24a30');
  const bw = W - 16, bx = 8, by = H - 38, bh = 34;
  p.rect(bx, by, bw, bh, wall.base);
  for (let x = bx + 6; x < bx + bw; x += 8) p.rect(x, by, 1, bh, wall.dark);
  p.rect(bx, by, bw, 2, wall.light); p.rect(bx, by + bh - 3, bw, 3, wall.dark);
  // tejado a dos aguas
  p.poly([[2, by + 3], [W / 2, by - 24], [W - 2, by + 3]], roof.base);
  p.poly([[2, by + 3], [W / 2, by - 24], [W / 2, by - 20], [8, by + 3]], roof.light);
  for (let y = by - 18; y < by + 3; y += 5) p.line(Math.max(4, W / 2 - (y - (by - 24)) * 1.4), y, Math.min(W - 4, W / 2 + (y - (by - 24)) * 1.4), y, roof.dark);
  p.rect(2, by + 2, W - 4, 3, roof.deep);
  // puerta + rampa
  const dx = Math.round(W / 2 - 7);
  p.rect(dx, by + 12, 14, 22, '#2a1a1e'); p.ell(dx + 7, by + 12, 7, 5, '#2a1a1e');
  p.poly([[dx - 2, H - 1], [dx + 16, H - 1], [dx + 12, by + 30], [dx + 2, by + 30]], wall.dark);
  for (let y = by + 32; y < H - 1; y += 3) p.line(dx - 1, y, dx + 15, y, wall.light);
  // ventana redonda
  p.ell(bx + 12, by + 14, 5, 5, '#2a1a1e'); p.ell(bx + 12, by + 14, 3, 3, '#ffd870', false);
  p.ell(bx + bw - 12, by + 14, 5, 5, '#2a1a1e'); p.ell(bx + bw - 12, by + 14, 3, 3, '#ffd870', false);
  // percha
  p.rect(bx + bw - 2, by + 18, 8, 2, wall.dark); p.rect(bx + bw + 4, by + 18, 2, 14, wall.dark);
  p.outline(OUT);
  return P(p, W - 14, 16);
}
export function horreo(): PropArt {
  const p = new Px(76, 66);
  const w = ramp('#b88a52'), st = ramp('#a8a6b4'), roof = ramp('#b8523a');
  for (const x of [10, 22, 40, 52]) { p.box(x, 46, 8, 18, st, true); p.rect(x - 2, 46, 12, 3, st.light); }
  p.rect(6, 22, 54, 26, w.base);
  for (let x = 9; x < 60; x += 5) p.rect(x, 22, 1, 26, w.dark);
  p.rect(6, 22, 54, 2, w.light); p.rect(6, 45, 54, 3, w.dark);
  p.poly([[0, 24], [33, 2], [66, 24]], roof.base); p.poly([[0, 24], [33, 2], [33, 6], [6, 24]], roof.light);
  for (let y = 8; y < 24; y += 4) p.line(33 - (y - 2) * 1.45, y, 33 + (y - 2) * 1.45, y, roof.dark);
  p.rect(0, 23, 66, 3, roof.deep);
  p.rect(33, 0, 2, 4, '#e8d078'); p.rect(31, 0, 6, 1, '#e8d078');
  p.outline(OUT);
  return P(p, 64, 14, 33, 64);
}
export function sign(): PropArt {
  const p = new Px(28, 34);
  const w = ramp('#8a5a30');
  p.rect(12, 8, 4, 25, w.base); p.rect(12, 8, 1, 25, w.light);
  p.poly([[2, 4], [20, 4], [26, 8], [20, 12], [2, 12]], '#d8a860'); p.rect(4, 6, 12, 1, '#7a4a20'); p.rect(4, 9, 9, 1, '#7a4a20');
  p.poly([[4, 16], [22, 16], [22, 24], [4, 24], [0, 20]], '#c89850'); p.rect(8, 18, 10, 1, '#7a4a20'); p.rect(8, 21, 7, 1, '#7a4a20');
  p.outline(OUT);
  return P(p, 8, 5);
}
export function fenceH(dark = false): PropArt {
  const p = new Px(16, 22);
  const w = ramp(dark ? '#4a3a40' : '#b27a40');
  p.rect(2, 8, 14, 3, w.base); p.rect(2, 8, 14, 1, w.light); p.rect(2, 10, 14, 1, w.dark);
  p.rect(2, 15, 14, 3, w.base); p.rect(2, 15, 14, 1, w.light); p.rect(2, 17, 14, 1, w.dark);
  p.box(0, 4, 4, 18, w, true); p.rect(0, 3, 4, 1, w.light); p.set(1, 3, w.base);
  p.outline(OUT);
  return P(p, 16, 6, 8, 21);
}
export function fenceV(dark = false): PropArt {
  const p = new Px(14, 26);
  const w = ramp(dark ? '#4a3a40' : '#b27a40');
  p.rect(5, 0, 3, 26, w.base); p.rect(5, 0, 1, 26, w.light);       // travesaños verticales (vista lateral)
  p.box(3, 8, 8, 18, w, true); p.rect(3, 7, 8, 1, w.light);
  p.outline(OUT);
  return P(p, 8, 8, 7, 25);
}
export function flower(color: string): Px {
  const p = new Px(7, 8);
  p.rect(3, 4, 1, 4, '#3f8a30'); p.rect(2, 6, 2, 1, '#3f8a30');
  p.rect(3, 1, 1, 3, color); p.rect(2, 2, 3, 1, color); p.set(3, 2, '#ffe36a');
  return p;
}
export function tuft(v: number): Px {
  const p = new Px(7, 6);
  const c = ['#8ad45a', '#5aa035', '#a6e070'];
  p.rect(1, 3, 1, 3, c[1]); p.rect(3, 1, 1, 5, c[0]); p.rect(5, 2, 1, 4, c[1]);
  if (v) { p.rect(2, 2, 1, 4, c[2]); p.rect(4, 3, 1, 3, c[0]); }
  return p;
}
export function feathers(): Px {
  const p = new Px(14, 8);
  p.rect(2, 4, 4, 1, '#ffffff'); p.rect(3, 3, 2, 1, '#e8e8f0'); p.rect(8, 5, 4, 1, '#ffffff'); p.rect(9, 6, 2, 1, '#d8d8e8'); p.rect(6, 1, 3, 1, '#f0f0f8');
  return p;
}

/** Puerta misteriosa: caseta de madera oscura. k = 0 cerrada … 3 abierta. */
export function doorShed(k: number): PropArt {
  const W = 120, H = 96;
  const p = new Px(W, H);
  const wall = ramp('#3e2c34'), roof = ramp('#2a2030'), stone = ramp('#58546a');
  // zócalo de piedra
  p.rect(4, H - 14, W - 8, 14, stone.base); for (let x = 4; x < W - 4; x += 12) p.rect(x, H - 14, 1, 14, stone.dark); p.rect(4, H - 14, W - 8, 2, stone.light);
  // muro de tablones
  p.rect(8, 34, W - 16, H - 48, wall.base);
  for (let x = 12; x < W - 8; x += 7) { p.rect(x, 34, 1, H - 48, wall.dark); }
  for (let i = 0; i < 30; i++) p.rect(10 + ((i * 17) % 98), 36 + ((i * 11) % 40), 1, 3, wall.light);
  p.rect(8, 34, W - 16, 2, wall.light);
  // tejado
  p.poly([[0, 36], [W / 2, 4], [W, 36]], roof.base); p.poly([[0, 36], [W / 2, 4], [W / 2, 8], [8, 36]], roof.light);
  for (let y = 10; y < 36; y += 5) p.line(W / 2 - (y - 4) * 1.85, y, W / 2 + (y - 4) * 1.85, y, roof.dark);
  p.rect(0, 35, W, 3, roof.deep);
  // marco y hueco
  const dx = W / 2 - 17, dy = 38, dw = 34, dh = H - 14 - dy;
  p.rect(dx - 4, dy - 4, dw + 8, dh + 4, '#26181c'); p.rect(dx - 4, dy - 4, dw + 8, 2, '#5a4048');
  // interior (rojo oscuro, se ilumina al abrir)
  const open = k / 3;
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const g = Math.max(0, 1 - Math.abs(x - dw / 2) / (dw / 2)) * 0.5 + (y / dh) * 0.6;
    const r = Math.round(30 + open * g * 225), gg = Math.round(4 + open * g * 50), bb = Math.round(8 + open * g * 36);
    p.set(dx + x, dy + y, [Math.min(255, r), gg, bb]);
  }
  // hoja de la puerta (se pliega hacia dentro)
  const lw = Math.max(3, Math.round(dw * (1 - open * 0.92)));
  const leaf = ramp('#5a3a2a');
  p.rect(dx, dy, lw, dh, leaf.base);
  for (let x = dx + 4; x < dx + lw; x += 6) p.rect(x, dy, 1, dh, leaf.dark);
  p.rect(dx, dy, lw, 2, leaf.light);
  if (lw > 14) {
    p.rect(dx, dy + 8, lw, 3, '#2a2a34'); p.rect(dx, dy + dh - 14, lw, 3, '#2a2a34');
    p.ell(dx + lw - 8, dy + dh / 2 + 2, 3, 3, '#a89048'); p.ell(dx + lw - 8, dy + dh / 2 + 2, 1.5, 1.5, '#2a2030', false);
    p.rect(dx + lw / 2 - 3, dy + 14, 6, 8, '#1a1018'); p.rect(dx + lw / 2 - 2, dy + 16, 4, 1, '#ff3a2a');     // mirilla roja
  } else p.rect(dx, dy, lw, dh, leaf.dark);
  // escalón
  p.rect(dx - 6, H - 14, dw + 12, 3, stone.light);
  // farol apagado
  p.rect(10, 44, 2, 10, '#1a1018'); p.rect(6, 54, 10, 12, '#3a2a30'); p.rect(8, 56, 6, 8, k > 0 ? '#ff6a3a' : '#7a2a24');
  p.rect(W - 16, 44, 2, 10, '#1a1018'); p.rect(W - 20, 54, 10, 12, '#3a2a30'); p.rect(W - 18, 56, 6, 8, k > 0 ? '#ff6a3a' : '#7a2a24');
  p.outline('#14101c');
  return { px: p, ox: W / 2, oy: H - 1, fw: W - 8, fh: 14 };
}
export const DOOR_SPEC = { w: 120, h: 96, openingX: 60, openingTop: 38, openingW: 34 };

export function butterfly(f: number, col: string): Px {
  const p = new Px(9, 8);
  if (f === 0) { p.ell(2, 3, 2.5, 3, col); p.ell(6, 3, 2.5, 3, col); p.rect(4, 1, 1, 5, '#2a1a30'); }
  else { p.ell(3, 4, 1.5, 3, col); p.ell(5, 4, 1.5, 3, col); p.rect(4, 1, 1, 5, '#2a1a30'); }
  return p;
}
export { hash2 };

/** Jaula de hierro para los presos (barrotes finos: se ve al preso detrás). */
export function cage(): PropArt {
  const p = new Px(46, 66);
  const iron = ramp('#6a7384');
  // base y techo
  p.rect(1, 61, 44, 4, iron.dark); p.rect(1, 61, 44, 1, iron.light);
  p.rect(1, 2, 44, 4, iron.base); p.rect(1, 2, 44, 1, iron.light); p.rect(1, 5, 44, 1, iron.dark);
  p.rect(18, 0, 10, 3, iron.base); p.rect(21, 0, 4, 1, iron.light);
  // barrotes
  for (let x = 3; x <= 43; x += 5) { p.rect(x, 6, 2, 55, iron.base); p.rect(x, 6, 1, 55, iron.light); }
  p.rect(1, 6, 2, 55, iron.dark); p.rect(43, 6, 2, 55, iron.dark);
  // travesaño medio
  p.rect(1, 33, 44, 2, iron.dark);
  // candado
  p.rect(20, 40, 6, 5, '#e0b030'); p.rect(20, 40, 6, 1, '#ffe27a'); p.rect(21, 37, 4, 3, '#8a8a92'); p.set(23, 42, '#2b1a10');
  p.outline(OUT);
  return P(p, 40, 10);
}
