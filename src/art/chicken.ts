import { Px, ramp } from './px';

export interface ChickenStyle { body: string; wing: string; comb: string; beak: string; ballot: boolean; bow?: string; speck?: string; wattle?: number; cheek?: string }
export const HERO: ChickenStyle = { body: '#b8763f', wing: '#8f552b', comb: '#e02430', beak: '#f7a823', ballot: true, wattle: 1, speck: '#e0a468' };
export const HERO_NB: ChickenStyle = { ...HERO, ballot: false };
export const NPC: ChickenStyle = { body: '#fbfbf4', wing: '#dfe3ee', comb: '#d8283a', beak: '#f2a020', ballot: false, bow: '#ff5fa8' };
export const HEN_W: ChickenStyle = { body: '#fbfbf4', wing: '#e3e6ee', comb: '#e02430', beak: '#f7a823', ballot: false };
export const HEN_C: ChickenStyle = { body: '#f1d9a4', wing: '#d9b270', comb: '#e02430', beak: '#f2a020', ballot: false, speck: '#c89a52' };
export const HEN_G: ChickenStyle = { body: '#8f94a6', wing: '#5f6478', comb: '#e02430', beak: '#f2a020', ballot: false, speck: '#c9cde0' };

export type Dir = 'down' | 'up' | 'left' | 'right';
export interface ChickenPose {
  dir: Dir; legA?: number; legB?: number;   // elevación de cada pata (0..3)
  bob?: number; sway?: number; blink?: boolean; breath?: number; open?: number; wingUp?: number; // wingUp: 1=empieza,2=extendida
  noBallotNow?: boolean;
}
const OUT = '#2a1a30';
const LEG = '#e98a1c';

function ballotPaper(p: Px, x: number, y: number, w = 8, h = 11, tilt = 0) {
  p.rect(x, y, w, h, '#ffffff');
  p.rect(x, y, w, 1, '#ffffff'); p.rect(x + w - 1, y + 1, 1, h - 1, '#c9cfe0'); p.rect(x, y + h - 1, w, 1, '#c9cfe0');
  p.rect(x + 1, y + 2, w - 3, 1, '#6e7a99'); p.rect(x + 1, y + 4, w - 4, 1, '#9aa5c0'); p.rect(x + 1, y + 6, w - 3, 1, '#9aa5c0');
  p.rect(x + w - 3, y + h - 4, 2, 2, '#d8242c');
  if (tilt) p.set(x + w, y, '#ffffff');
}
export function ballotSprite(): Px {
  const p = new Px(12, 14);
  ballotPaper(p, 1, 1, 9, 12);
  p.outline(OUT);
  return p;
}

export function drawChicken(st: ChickenStyle, o: ChickenPose): Px {
  const p = new Px(34, 34);
  const bob = o.bob ?? 0, sway = o.sway ?? 0, br = o.breath ?? 0;
  const bodyR = ramp(st.body), wingR = ramp(st.wing);
  const dir = o.dir === 'right' ? 'left' : o.dir;
  const A = o.legA ?? 0, B = o.legB ?? 0;
  const leg = (x: number, lift: number, side: boolean) => {
    const top = 26 - bob;
    p.rect(x, top, 2, 4 - lift + bob, LEG);
    const fy = 30 - lift;
    p.rect(x - (side ? 2 : 1), fy, 5, 1, LEG); p.set(x - (side ? 2 : 1), fy - 0, '#c96d10'); p.set(x + 2, fy, '#c96d10');
  };

  if (dir === 'down') {
    leg(12, A, false); leg(20, B, false);
    // cuerpo
    p.ell(17, 22 - bob, 9.5, 7.5 + br * 0.5, bodyR);
    if (st.speck) for (const [sx, sy] of [[12, 20], [20, 24], [16, 26], [22, 20]]) p.set(sx, sy - bob, st.speck);
    // ala izquierda (del espectador)
    p.ell(8.5, 23 - bob, 3, 5, wingR);
    // papeleta en el ala derecha: sobredimensionada y muy visible
    if (st.ballot) { ballotPaper(p, 21, 14 - bob, 11, 14); }
    p.ell(24.5, 25 - bob, 3.2, 4.5, wingR);
    // cabeza
    const hx = 16.5 + sway, hy = 11 - bob - br;
    p.ell(hx, hy, 8.5, 7.5, bodyR);
    // cresta
    const cr = ramp(st.comb);
    p.ell(hx - 4.5, hy - 7, 2.3, 2.3, cr); p.ell(hx, hy - 8.5, 2.8, 3, cr); p.ell(hx + 4.5, hy - 7, 2.3, 2.3, cr);
    if (st.bow) { p.ell(hx + 6, hy - 5, 2.6, 2.2, ramp(st.bow)); p.ell(hx + 8.5, hy - 3.5, 2, 1.8, ramp(st.bow)); p.set(hx + 6, hy - 5, '#ffffff'); }
    // ojos grandes
    const ey = hy - 0.5;
    for (const ex of [hx - 3.6, hx + 3.6]) {
      if (o.blink) { p.rect(ex - 2, ey + 1, 4, 1, '#2a1a30'); continue; }
      p.rect(ex - 2, ey - 2, 4, 5, '#ffffff'); p.rect(ex - 1, ey - 1, 2, 3, '#1b1424'); p.set(ex - 1, ey - 1, '#ffffff');
    }
    if (st.bow) { p.line(hx - 6, ey - 4, hx - 2, ey - 3, '#7a4a24'); p.line(hx + 2, ey - 3, hx + 6, ey - 5, '#7a4a24'); }
    // pico y moco
    const open = o.open ?? 0;
    p.poly([[hx - 2.5, hy + 3], [hx + 2.5, hy + 3], [hx, hy + 6]], st.beak);
    p.rect(hx - 2, hy + 3, 4, 1, '#ffd45a');
    if (open) { p.rect(hx - 2, hy + 5, 4, 2 + open, '#7a1e22'); p.rect(hx - 1, hy + 6 + open, 2, 1, '#ff7f8a'); p.poly([[hx - 2.5, hy + 5 + open], [hx + 2.5, hy + 5 + open], [hx, hy + 8 + open]], st.beak); }
    else if (st.wattle) { p.ell(hx, hy + 7.6, 2.4, 3.2, '#e02430'); p.rect(hx - 1, hy + 6, 1, 2, '#ff6a6a'); }
    else p.ell(hx, hy + 7.2, 1.2, 1.6, '#d8242c', false);
  } else if (dir === 'up') {
    leg(12, A, false); leg(20, B, false);
    const tailC = ramp(st.wing);
    p.ell(17, 22 - bob, 9.5, 7.5, bodyR);
    p.ell(17, 27 - bob, 6, 3, tailC);            // cola hacia el espectador
    p.rect(14, 26 - bob, 1, 3, bodyR.dark); p.rect(17, 26 - bob, 1, 3, bodyR.dark); p.rect(20, 26 - bob, 1, 3, bodyR.dark);
    p.ell(8.5, 22 - bob, 3, 5, wingR); p.ell(25.5, 22 - bob, 3, 5, wingR);
    if (st.ballot) { ballotPaper(p, 25, 18 - bob, 7, 10); }
    const hx = 16.5 + sway, hy = 11 - bob;
    p.ell(hx, hy, 8, 7, bodyR);
    const cr = ramp(st.comb);
    p.ell(hx - 4, hy - 7, 2.3, 2.3, cr); p.ell(hx, hy - 8.5, 2.8, 3, cr); p.ell(hx + 4, hy - 7, 2.3, 2.3, cr);
    if (st.bow) p.ell(hx + 5, hy - 4, 2.6, 2.2, ramp(st.bow));
  } else {
    // lateral (mirando a la izquierda)
    const pl = A, pr = B;
    leg(13, pl, true); leg(20, pr, true);
    // cola
    const tail = ramp(st.wing);
    p.poly([[24, 20 - bob], [32, 8 - bob], [31, 17 - bob], [33, 14 - bob], [29, 24 - bob]], tail.base);
    p.poly([[24, 20 - bob], [31, 10 - bob], [29, 20 - bob]], tail.light);
    p.ell(18, 22 - bob, 9.5, 6.8 + br * 0.4, bodyR);
    if (st.speck) for (const [sx, sy] of [[14, 20], [22, 24], [18, 26], [24, 19]]) p.set(sx, sy - bob, st.speck);
    // papeleta bajo el ala, delante
    const wu = o.wingUp ?? 0;
    if (st.ballot && wu === 0) ballotPaper(p, 7, 17 - bob, 11, 13);
    if (wu === 0) p.ell(18.5, 22 - bob, 5.5, 3.8, wingR);
    else if (wu === 1) { p.poly([[16, 22 - bob], [8, 12 - bob], [11, 10 - bob], [21, 21 - bob]], wingR.base); p.poly([[16, 22 - bob], [8, 12 - bob], [10, 12 - bob], [17, 21 - bob]], wingR.light); if (st.ballot) ballotPaper(p, 1, 3 - bob, 9, 11); }
    else { p.poly([[15, 22 - bob], [2, 17 - bob], [3, 13 - bob], [20, 20 - bob]], wingR.base); p.poly([[15, 22 - bob], [2, 17 - bob], [3, 15 - bob], [16, 20 - bob]], wingR.light); }
    const hx = 10 + sway, hy = 11 - bob - br;
    p.ell(hx, hy, 7, 7, bodyR);
    const cr = ramp(st.comb);
    p.ell(hx + 2, hy - 7.5, 2.4, 2.4, cr); p.ell(hx + 5, hy - 6.5, 2.2, 2.2, cr); p.ell(hx - 1.5, hy - 7, 2, 2, cr);
    if (st.bow) { p.ell(hx + 4, hy - 4, 2.6, 2.2, ramp(st.bow)); p.ell(hx + 6.5, hy - 2.5, 2, 1.8, ramp(st.bow)); }
    // pico
    const open = o.open ?? 0;
    p.poly([[hx - 6, hy + 0.5], [hx - 6 - 4, hy + 2.5], [hx - 6, hy + 4]], st.beak);
    if (open) { p.poly([[hx - 6, hy + 4], [hx - 9, hy + 5 + open], [hx - 5, hy + 6 + open]], st.beak); p.rect(hx - 8, hy + 3, 3, 1 + open, '#7a1e22'); }
    if (st.wattle) { p.ell(hx - 3.5, hy + 7, 2.2, 3, '#e02430'); p.rect(hx - 4, hy + 5, 1, 2, '#ff6a6a'); } else p.ell(hx - 3.5, hy + 6.6, 1.3, 1.8, '#d8242c', false);
    // ojo
    if (o.blink) p.rect(hx - 4, hy - 0.5, 3, 1, '#2a1a30');
    else { p.rect(hx - 4, hy - 3, 4, 5, '#ffffff'); p.rect(hx - 4, hy - 2, 2, 3, '#1b1424'); p.set(hx - 4, hy - 2, '#ffffff'); }
    if (st.bow) p.line(hx - 6, hy - 5, hx - 2, hy - 4, '#7a4a24');
  }
  p.outline(OUT);
  return o.dir === 'right' ? p.mirror() : p;
}

export function drawChick(f: number): Px {
  const p = new Px(14, 14);
  const bob = f % 2;
  p.rect(5, 10 - 0, 1, 2 + (f ? 0 : 1), '#e98a1c'); p.rect(8, 10, 1, 2 + (f ? 1 : 0), '#e98a1c');
  p.ell(7, 7 - bob, 5, 4.5, '#ffe14a');
  p.poly([[2, 7 - bob], [0, 8 - bob], [2, 9 - bob]], '#f2902a');
  p.set(4, 5 - bob, '#1b1424'); p.set(8, 5 - bob, '#1b1424');
  p.set(7, 2 - bob, '#ffe14a');
  p.outline(OUT);
  return p;
}
