import { Px, ramp, Ramp, vnoise } from './px';
import { Look, LOOKS } from './looks';
import type { Dir } from './chicken';
import { FACES } from './faces';

export type Arm = 'urn' | 'point' | 'knock' | 'cheer' | 'scared';
export interface PolPose { dir: Dir; legs?: number; bob?: number; mouth?: 0 | 1 | 2; arm?: Arm; blink?: boolean; eyes?: 'normal' | 'wide' | 'happy'; point?: number; shake?: number }
export interface UrnSpec { color: number; mark: string; ballot: boolean }
export const POL_W = 48, POL_H = 60;
const OUT = '#1b1424';
const hx = (n: number) => '#' + n.toString(16).padStart(6, '0');

// glifos 3x5 para las etiquetas de las urnas
const GLYPH: Record<string, string[]> = {
  P: ['111', '101', '111', '100', '100'], S: ['111', '100', '111', '001', '111'],
  V: ['101', '101', '101', '101', '010'], X: ['101', '101', '010', '101', '101'],
};
const FEM = ['.XXX.', 'X...X', 'X...X', '.XXX.', '..X..', '.XXX.'];

export function drawUrn(p: Px, x: number, y: number, w: number, h: number, u: UrnSpec, glyph = true) {
  p.rect(x, y, w, h, '#d6ecf4');
  p.rect(x, y, w, 1, '#ffffff'); p.rect(x + 1, y + 1, 2, h - 3, '#f3fbff');
  p.rect(x, y + h - 2, w, 2, '#aac6d4');
  p.rect(x, y, 1, h, '#7d9cb0'); p.rect(x + w - 1, y, 1, h, '#7d9cb0'); p.rect(x, y + h - 1, w, 1, '#6f8ea2');
  // tapa
  p.rect(x - 1, y - 3, w + 2, 3, '#56657a'); p.rect(x - 1, y - 3, w + 2, 1, '#8a9bb2');
  p.rect(x + Math.floor(w / 2) - 3, y - 2, 6, 1, '#14101c');
  // papeletas dentro
  if (u.ballot) {
    p.rect(x + 2, y + h - 5, 5, 4, '#ffffff'); p.rect(x + 3, y + h - 6, 4, 2, '#ffffff'); p.rect(x + w - 8, y + h - 6, 5, 5, '#f4f4f8');
    p.rect(x + 7, y + h - 4, 4, 3, '#e6e8f0'); p.set(x + 4, y + h - 4, '#9aa5c0'); p.set(x + w - 6, y + h - 4, '#9aa5c0');
  }
  // etiqueta
  const lw = 10, lh = 8, lx = x + Math.floor((w - lw) / 2), ly = y + 2;
  const c = hx(u.color);
  p.rect(lx, ly, lw, lh, c); p.rect(lx, ly, lw, 1, ramp(c).light); p.rect(lx, ly + lh - 1, lw, 1, ramp(c).dark);
  if (glyph) drawMark(p, lx, ly, lw, u);
}

function drawMark(p: Px, lx: number, ly: number, lw: number, u: UrnSpec) {
  if (u.mark === 'F') {
    FEM.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') p.set(lx + 2 + i, ly + 1 + j, '#ffffff'); }));
  } else if (u.mark) {
    const letters = [...u.mark];
    const total = letters.length * 3 + (letters.length - 1);
    let gx = lx + Math.floor((lw - total) / 2);
    for (const L of letters) {
      (GLYPH[L] ?? GLYPH.P).forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '1') p.set(gx + i, ly + 1 + j + 1, '#ffffff'); }));
      gx += 4;
    }
  } else { p.rect(lx + 2, ly + 3, 6, 1, '#b9bccb'); p.rect(lx + 2, ly + 5, 4, 1, '#b9bccb'); }
}

function arm(p: Px, x0: number, y0: number, x1: number, y1: number, sleeve: Ramp, skin: Ramp, hand = true) {
  p.line(x0, y0, x1, y1, sleeve.base, 4);
  p.line(x0 - 1, y0, x1 - 1, y1, sleeve.light, 1);
  p.line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, sleeve.dark, 1);
  if (hand) p.ell(x1 + 0.5, y1 + 2, 2.4, 2.4, skin);
}

function hairMask(look: Look, x: number, y: number, oy: number, dir: Dir): boolean {
  const yy = y - oy;
  // dentro de elipse ligeramente mayor que la cabeza
  const dx = (x + 0.5 - 24) / 12.9, dy = (yy + 0.5 - 18.6) / 12.4;
  if (dx * dx + dy * dy > 1) return false;
  const back = dir === 'up';
  switch (look.hairStyle) {
    case 'rufion': return back ? yy < 24 : yy <= (x < 22 ? 14.5 : 13) || (x < 13 && yy < 18) || (x > 35 && yy < 17);
    case 'irene':  return back ? true : yy <= 15 - Math.abs(x - 24) * 0.12 - (x < 24 ? 0 : 0.5) || x < 13.5 || x > 34.5;
    case 'feijoo': return back ? yy < 24 : yy <= 13 + (x < 18 ? 2 : 0) || (x < 13.5 && yy < 20) || (x > 34.5 && yy < 20);
    case 'sanxe':  return back ? yy < 23 : yy <= 12.6 + (x < 17 || x > 31 ? 1.5 : 0) || (x < 13.5 && yy < 19) || (x > 34.5 && yy < 19);
    case 'abascal': return back ? yy < 23 : yy <= 12.8 + (x < 17 || x > 31 ? 1.5 : 0) || ((x < 14 || x > 34) && yy < 19);
  }
}

export function drawPol(look: Look, urn: UrnSpec, o: PolPose): Px {
  const p = new Px(POL_W, POL_H);
  const dir = o.dir === 'right' ? 'left' : o.dir;
  const bob = o.bob ?? 0, oy = -bob, legs = o.legs ?? 0;
  const sk = ramp(look.skin), ja = ramp(look.jacket), pa = ramp(look.pants), ha = ramp(look.hair);
  const armMode: Arm = o.arm ?? 'urn';
  const side = dir === 'left';
  const cx = side ? 22 : 24;           // centro de cabeza
  const female = !!look.female;

  // ── piernas ─────────────────────────────────────────────
  const legTop = 46;
  const legsX = side ? [20 + (legs === -1 ? -3 : legs === 1 ? 3 : 0), 25 + (legs === -1 ? 3 : legs === 1 ? -3 : 0)] : [18, 26];
  const lift = [legs === -1 ? 2 : 0, legs === 1 ? 2 : 0];
  legsX.forEach((lx, i) => {
    const bot = 56 - lift[i];
    p.box(lx, legTop, 5, bot - legTop - 2, pa, true);
    p.rect(lx - 1 + (side ? -1 : 0), bot - 3, 7, 3, look.shoes);
    p.rect(lx - 1 + (side ? -1 : 0), bot - 3, 7, 1, ramp(look.shoes).light);
  });

  // pelo largo trasero (Irene)
  if (look.hairStyle === 'irene') {
    p.ell(24, 27 + oy, 15, 16, ramp(look.hair));
  }

  // ── torso ───────────────────────────────────────────────
  const tw = side ? 8.5 : female ? 9.2 : 10.3;
  p.ell(side ? 24.5 : 24, 41 + oy, tw, 9.3, ja);
  if (dir === 'down') {
    p.poly([[21, 33 + oy], [27, 33 + oy], [24, 43 + oy]], look.shirt);
    if (look.tie) { p.rect(23, 35 + oy, 2, 8, look.tie); p.rect(23, 34 + oy, 2, 2, ramp(look.tie).dark); p.poly([[23, 43 + oy], [25, 43 + oy], [24, 45 + oy]], look.tie); }
    p.line(21, 33 + oy, 19, 42 + oy, ja.dark); p.line(27, 33 + oy, 29, 42 + oy, ja.dark);
    if (look.jacket === '#5e6832') { p.rect(15, 37 + oy, 3, 3, ja.dark); p.rect(31, 37 + oy, 3, 3, ja.dark); } // bolsillos
  } else if (dir === 'up') {
    p.line(24, 33 + oy, 24, 46 + oy, ja.dark);
  } else {
    p.poly([[18, 33 + oy], [22, 33 + oy], [20, 41 + oy]], look.shirt);
    if (look.tie) p.rect(19, 35 + oy, 2, 7, look.tie);
  }

  // ── urna (solo de frente y de lado) ────────────────────
  const urnY = 43 + oy + (armMode === 'scared' ? (o.shake ?? 0) : 0);
  const showUrn = dir !== 'up';
  if (dir === 'down' && showUrn) {
    if (armMode === 'cheer') drawUrn(p, 15, urnY, 18, 11, urn);
    else drawUrn(p, 15, urnY, 18, 11, urn);
  } else if (dir === 'left') drawUrn(p, 6, urnY, 15, 11, urn, false);

  // ── brazos ──────────────────────────────────────────────
  if (dir === 'down') {
    if (armMode === 'urn' || armMode === 'scared') {
      arm(p, 14, 36 + oy, 16, 46 + oy, ja, sk); arm(p, 34, 36 + oy, 32, 46 + oy, ja, sk);
    } else if (armMode === 'point') {
      arm(p, 14, 36 + oy, 16, 46 + oy, ja, sk);
      const k = o.point ?? 0;                                // 0 = señalando adelante, 1 = arriba
      const ex = 41 + k, ey = 28 + oy - k * 3;
      arm(p, 34, 36 + oy, ex, ey, ja, sk, false);
      p.ell(ex + 0.5, ey, 2.7, 2.7, sk); p.rect(ex + 1, ey - 6, 2, 6, look.skin); p.rect(ex + 1, ey - 6, 2, 1, ramp(look.skin).dark);
    } else if (armMode === 'cheer') {
      arm(p, 14, 36 + oy, 8, 27 + oy, ja, sk, false); arm(p, 34, 36 + oy, 40, 27 + oy, ja, sk, false);
      p.ell(8, 25 + oy, 3, 3, sk); p.ell(41, 25 + oy, 3, 3, sk);
    }
  } else if (dir === 'left') {
    arm(p, 25, 37 + oy, 20, 47 + oy, ja, sk);
  } else {
    if (armMode === 'knock') {
      arm(p, 14, 37 + oy, 12, 48 + oy, ja, sk);
      const k = o.point ?? 0;
      arm(p, 34, 36 + oy, 35, 25 + oy - k * 2, ja, sk, false);
      p.ell(35.5, 23 + oy - k * 2, 3, 3, sk);
    } else { arm(p, 14, 37 + oy, 13, 48 + oy, ja, sk); arm(p, 34, 37 + oy, 35, 48 + oy, ja, sk); }
  }

  // ── cabeza: de frente se usa el retrato de la hoja de referencia; de lado/espalda, dibujo procedural ──
  const FACE = dir === 'down' ? FACES[look.hairStyle] : undefined;
  if (FACE) {
    const fx = Math.round(24 - FACE.w / 2), fy = 1 + oy;
    p.rect(21, 30 + oy, 7, 6, sk.dark);                                // cuello
    FACE.rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.') p.set(fx + i, fy + j, FACE.pal[parseInt(ch, 36)]); } });
  } else {
  // ── cabeza ──────────────────────────────────────────────
  const hxc = cx;
  p.ell(hxc, 19 + oy, side ? 11 : 12, 11, sk);
  // orejas
  if (dir === 'down' || dir === 'up') { p.ell(12, 20 + oy, 2.2, 3, sk); p.ell(36, 20 + oy, 2.2, 3, sk); }
  else p.ell(28, 20 + oy, 2.3, 3.2, sk);
  if (look.earrings && dir === 'down') { p.rect(10, 23 + oy, 2, 4, '#f2c230'); p.rect(36, 23 + oy, 2, 4, '#f2c230'); p.set(11, 27 + oy, '#c9981a'); p.set(37, 27 + oy, '#c9981a'); }
  if (look.earrings && dir === 'left') { p.rect(27, 23 + oy, 2, 4, '#f2c230'); }

  // mandíbula y modelado de la cara (más "cabezón" caricaturesco, con pómulos y barbilla)
  if (dir === 'down') {
    p.poly([[13, 23 + oy], [35, 23 + oy], [32.5, 29 + oy], [28, 32 + oy], [20, 32 + oy], [15.5, 29 + oy]], sk.base);
    p.line(14, 24 + oy, 14, 27 + oy, sk.light); p.line(16, 30 + oy, 20, 32 + oy, sk.dark);
    p.rect(20, 32 + oy, 9, 1, sk.dark); p.line(29, 31 + oy, 33, 28 + oy, sk.dark); p.line(34, 26 + oy, 34, 24 + oy, sk.dark);
  } else {
    p.poly([[16, 24 + oy], [28, 24 + oy], [26, 30 + oy], [22, 32 + oy], [17, 31 + oy]], sk.base);
    p.line(17, 32 + oy, 24, 31 + oy, sk.dark); p.line(26, 29 + oy, 28, 25 + oy, sk.dark);
  }
  if (dir === 'down') { // sombra de cuello y mejillas
    p.rect(20, 33 + oy, 9, 2, sk.deep);
    if (female) { p.rect(14, 24 + oy, 3, 2, '#e9917f'); p.rect(31, 24 + oy, 3, 2, '#e9917f'); }
    else { p.rect(15, 25 + oy, 2, 1, sk.dark); p.rect(32, 25 + oy, 2, 1, sk.dark); }
  }

  // barba
  if (look.beard && dir !== 'up') {
    const bc = ramp(look.beard);
    const full = look.beardStyle === 'full';
    p.where(8, 14 + oy, 40, 40 + oy, (x, y) => {
      const yy = y - oy;
      const dx = (x + 0.5 - hxc) / (side ? 11.2 : 12.2), dy = (yy + 0.5 - 19) / 11.2;
      const inHead = dx * dx + dy * dy <= 1;
      const inBeard = full ? ((x + 0.5 - hxc) ** 2 / 11 ** 2 + (yy + 0.5 - 27.5) ** 2 / 8.2 ** 2 <= 1 && yy > 21) : (inHead && yy > 23.5);
      if (!inBeard && !(inHead && yy > (full ? 22 : 23.5))) return null;
      if (side && x > hxc + 4) return null;
      return yy > 31 ? bc.dark : (x + yy) % 7 === 0 ? bc.light : bc.base;
    });
  }

  // pelo
  const hr = ramp(look.hair);
  p.where(6, 2 + oy, 42, 28 + oy, (x, y) => {
    if (!hairMask(look, x, y, oy, dir)) return null;
    if (side && dir === 'left' && x < 17 && y - oy < 16 && look.hairStyle !== 'irene') return y - oy < 13.5 ? hr.base : null;
    const yy = y - oy;
    let c = hr.base;
    const fine = look.hairStyle === 'rufion' ? 0.9 : look.hairStyle === 'irene' ? 0.4 : 0.6;
    const n = vnoise(x * fine, yy * (look.hairStyle === 'irene' ? 0.35 : 0.9), 7 + look.hair.length);
    if (n > 0.7) c = hr.light; else if (n < 0.27) c = hr.dark;
    if (yy < 8 && x < 26 && n > 0.5) c = hr.light;                                                   // brillo superior izquierdo
    if (yy > 15 && look.hair2 && look.hairStyle !== 'irene' && dir !== 'up') c = n > 0.5 ? look.hair2 : ramp(look.hair2).dark; // canas en patillas
    return c;
  });
  // volumen de pelo por arriba
  if (look.hairStyle === 'rufion') { p.poly([[22, 8 + oy], [30, 3 + oy], [38, 7 + oy], [36, 11 + oy]], hr.base); p.line(24, 7 + oy, 31, 4 + oy, hr.light); p.line(26, 9 + oy, 35, 6 + oy, hr.dark); }
  if (look.hairStyle === 'feijoo') { p.ell(26, 8 + oy, 11, 4, hr); p.line(18, 7 + oy, 33, 5 + oy, hr.light); if (dir === 'down') p.line(16, 12 + oy, 30, 10 + oy, ramp(look.hair2!).light); }
  if (look.hairStyle === 'sanxe') { p.ell(24, 8 + oy, 11.5, 4.5, hr); p.line(16, 8 + oy, 31, 5 + oy, hr.light); }
  if (look.hairStyle === 'irene') {
    p.ell(24, 9 + oy, 12.5, 5, hr); p.line(24, 5 + oy, 24, 12 + oy, hr.dark); p.line(18, 7 + oy, 23, 6 + oy, hr.light);
    if (dir === 'down') { p.rect(8, 22 + oy, 5, 16, hr.base); p.rect(35, 22 + oy, 5, 16, hr.base); p.rect(8, 22 + oy, 1, 16, hr.light); p.rect(39, 24 + oy, 1, 14, hr.dark); p.rect(8, 37 + oy, 5, 2, hr.dark); p.rect(35, 37 + oy, 5, 2, hr.dark); }
    if (dir === 'up') { p.ell(24, 34 + oy, 12, 10, hr); p.line(24, 24 + oy, 24, 42 + oy, hr.dark); }
  }
  if (look.hairStyle === 'abascal') { p.ell(24, 8 + oy, 11, 4, hr); p.line(17, 7 + oy, 28, 5 + oy, hr.light); }

  // ── cara ────────────────────────────────────────────────
  if (dir !== 'up') {
    const ey = 19 + oy;
    const eyes: number[] = dir === 'down' ? [19, 29] : [15, 23];
    const eyeCol = '#1b1424';
    eyes.forEach((ex, i) => {
      const far = dir === 'left' && i === 1;
      const w = far ? 3 : 5;
      if (o.blink || o.eyes === 'happy') {
        if (o.eyes === 'happy') { p.rect(ex - 2, ey + 1, 1, 1, eyeCol); p.rect(ex - 1, ey, 2, 1, eyeCol); p.rect(ex + 1, ey + 1, 1, 1, eyeCol); }
        else p.rect(ex - 2, ey + 1, w, 1, eyeCol);
      } else if (o.eyes === 'wide') {
        p.rect(ex - 2, ey - 2, w, 6, '#ffffff'); p.rect(ex - 2, ey - 2, w, 1, '#d6d6e0');
        p.rect(ex - 1 + (dir === 'left' ? -1 : 0), ey, 2, 2, eyeCol);
      } else {
        p.rect(ex - 2, ey - 1, w, 4, '#ffffff'); p.rect(ex - 2, ey + 2, w, 1, '#dcdce6');
        const px = dir === 'down' ? (i === 0 ? ex : ex - 1) : ex - 2;
        p.rect(px, ey - 1, 2, 4, look.eye ?? '#5a3418'); p.rect(px, ey, 2, 2, eyeCol); p.set(px, ey - 1, '#fff6e0');
        p.rect(ex - 2, ey - 2, w, 1, ramp(look.skin).deep);                                          // párpado superior
      }
    });
    // cejas
    const brow = ramp(look.brow).base, bt = 2;
    const wide = o.eyes === 'wide';
    if (dir === 'down') {
      if (wide) { p.line(16, ey - 5, 21, ey - 6, brow, bt); p.line(32, ey - 5, 27, ey - 6, brow, bt); }
      else { p.line(14, ey - 6, 22, ey - 3, brow, bt); p.line(34, ey - 6, 26, ey - 3, brow, bt); p.set(22, ey - 4, ramp(look.skin).dark); p.set(26, ey - 4, ramp(look.skin).dark); }
    } else { p.line(11, ey - 4, 18, ey - 2, brow, bt); p.line(20, ey - 3, 25, ey - 3, brow, 1); }
    // gafas
    if (look.glasses) {
      const gl = '#17121c';
      const rings = dir === 'down' ? [19, 29] : [15, 23];
      rings.forEach(ex => { p.rect(ex - 4, ey - 3, 8, 1, gl); p.rect(ex - 4, ey + 4, 8, 1, gl); p.rect(ex - 4, ey - 3, 1, 8, gl); p.rect(ex + 3, ey - 3, 1, 8, gl); p.set(ex - 3, ey + 3 + 1, gl); });
      if (dir === 'down') p.rect(23, ey, 2, 1, gl); else p.rect(19, ey, 4, 1, gl);
    }
    // nariz
    if (dir === 'down') { p.rect(23, ey + 1, 1, 4, ramp(look.skin).light); p.rect(24, ey + 2, 1, 3, ramp(look.skin).dark); p.rect(22, ey + 5, 4, 1, ramp(look.skin).deep); }
    else { p.ell(10.5, ey + 4, 2.6, 2.3, sk); p.set(9, ey + 5, ramp(look.skin).deep); }
    // bigote (barbas)
    if (look.beard) p.rect(dir === 'down' ? 19 : 11, ey + 5, dir === 'down' ? 10 : 6, 2, ramp(look.beard).base);
    // boca
    const my = ey + 8, mx = dir === 'down' ? 24 : 15;
    const lip = female ? '#c4303c' : '#5a2a2c';
    const m = o.mouth ?? 0;
    if (m === 0) { p.rect(mx - 3, my, 6, 1, lip); p.set(mx - 4, my - 1, lip); p.set(mx + 3, my - 1, lip); if (female) p.rect(mx - 2, my + 1, 4, 1, '#d84a58'); }
    else if (m === 1) { p.rect(mx - 3, my - 1, 6, 3, '#3a1218'); p.rect(mx - 2, my - 1, 4, 1, '#ffffff'); p.rect(mx - 1, my + 1, 2, 1, '#d8586a'); }
    else { p.rect(mx - 4, my - 2, 8, 5, '#3a1218'); p.rect(mx - 3, my - 2, 6, 1, '#ffffff'); p.rect(mx - 2, my + 1, 4, 2, '#d8586a'); }
  }
  }

  // sudor / pánico
  if (armMode === 'scared' && dir === 'down') {
    p.rect(8, 12 + oy, 2, 3, '#7fd0ff'); p.set(9, 11 + oy, '#7fd0ff'); p.rect(38, 15 + oy, 2, 3, '#7fd0ff'); p.set(39, 14 + oy, '#7fd0ff');
    p.rect(6, 22 + oy, 1, 2, '#bfeaff'); p.rect(42, 8 + oy, 1, 2, '#bfeaff');
  }
  p.outline(OUT);
  const res = o.dir === 'right' ? p.mirror() : p;
  if (dir === 'left') drawMark(res, o.dir === 'right' ? 30 : 8, urnY + 2, 10, urn);
  return res;
}
export { LOOKS };
