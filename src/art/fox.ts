import { Px, ramp } from './px';

export interface FoxPose { mouth: 0 | 1 | 2 | 3; eyes?: 'open' | 'squint' | 'wide'; look?: number; arms?: 'rest' | 'belly'; cheeks?: boolean; tongue?: 'out' | 'lick' | null; sy?: number }
export const FOX_W = 180, FOX_H = 192;
const OUT = '#1a0c14';
const FUR = '#e8731a', CREAM = '#f7e6c4', DARK = '#3a1a14', TEETH = '#fffbea';

export function drawFox(o: FoxPose): Px {
  const p = new Px(FOX_W, FOX_H);
  const fur = ramp(FUR), cream = ramp(CREAM), sy = o.sy ?? 0;
  const mx = (x: number) => 180 - x;           // espejo horizontal
  const dj = [0, 7, 15, 25][o.mouth];

  // cola enroscada
  p.ell(146, 172 + sy, 20, 11, fur); p.ell(163, 160 + sy, 14, 10, fur); p.ell(171, 144 + sy, 9, 11, cream);
  p.ell(171, 142 + sy, 6, 7, ramp('#fffaf0'));
  // cuerpo sentado
  p.ell(90, 152 + sy, 49, 38, fur);
  p.ell(90, 156 + sy, 27, 33, CREAM, false);
  p.ell(90, 160 + sy, 20, 26, ramp('#fbefd6'), false);
  for (const [fx, fy] of [[78, 150], [100, 158], [88, 172], [104, 144], [76, 168]]) p.rect(fx, fy + sy, 3, 1, cream.dark);
  // pies
  p.ell(62, 186, 17, 6, ramp(DARK)); p.ell(118, 186, 17, 6, ramp(DARK));
  // brazos
  const belly = o.arms === 'belly';
  const ax = belly ? 66 : 50;
  p.ell(ax, 146 + sy, 14, 27, fur); p.ell(mx(ax), 146 + sy, 14, 27, fur);
  p.ell(belly ? 76 : 55, belly ? 160 + sy : 172, 12, 8, ramp(DARK)); p.ell(belly ? 104 : 125, belly ? 160 + sy : 172, 12, 8, ramp(DARK));
  // garras
  for (const gx of belly ? [70, 74, 78, 102, 106, 110] : [49, 53, 57, 123, 127, 131]) p.rect(gx, (belly ? 165 + sy : 177), 2, 3, TEETH);

  // ── cabeza ──
  const hy = sy;
  // orejas
  p.poly([[40, 56 + hy], [44, 2 + hy], [78, 40 + hy]], FUR); p.poly([[mx(40), 56 + hy], [mx(44), 2 + hy], [mx(78), 40 + hy]], FUR);
  p.poly([[50, 48 + hy], [52, 16 + hy], [70, 40 + hy]], '#3a1224'); p.poly([[mx(50), 48 + hy], [mx(52), 16 + hy], [mx(70), 40 + hy]], '#3a1224');
  p.poly([[44, 2 + hy], [48, 6 + hy], [46, 24 + hy]], '#2a1018'); p.poly([[mx(44), 2 + hy], [mx(48), 6 + hy], [mx(46), 24 + hy]], '#2a1018');
  p.ell(90, 74 + hy, 46, 33, fur);
  // mofletes de pelo
  p.poly([[44, 78 + hy], [24, 100 + hy], [60, 100 + hy]], CREAM); p.poly([[mx(44), 78 + hy], [mx(24), 100 + hy], [mx(60), 100 + hy]], CREAM);
  p.poly([[48, 90 + hy], [34, 108 + hy], [64, 104 + hy]], ramp(CREAM).light); p.poly([[mx(48), 90 + hy], [mx(34), 108 + hy], [mx(64), 104 + hy]], ramp(CREAM).light);
  if (o.cheeks) { p.ell(60, 100 + hy, 13, 11, fur); p.ell(120, 100 + hy, 13, 11, fur); }
  // mandíbula
  p.ell(90, 100 + hy + dj, 30, 15, cream);
  p.rect(74, 108 + hy + dj, 32, 1, cream.dark);
  // interior de la boca
  const inner = '#4a0a16';
  p.ell(90, 100 + hy + dj / 2, 27, 3 + dj / 2, inner);
  if (dj > 0) p.ell(90, 100 + hy + dj / 2 + 2, 24, 1 + dj / 2, '#2a0610');
  // hocico
  p.ell(90, 88 + hy, 24, 14, cream);
  p.ell(90, 82 + hy, 14, 8, ramp('#fbeed3'));
  // nariz
  p.ell(90, 78 + hy, 7, 5, ramp('#241018')); p.set(88, 76 + hy, '#8a7a8a'); p.set(89, 76 + hy, '#8a7a8a');
  // boca sonriente (comisuras hacia arriba)
  if (dj === 0) { p.line(64, 97 + hy, 76, 102 + hy, OUT, 2); p.line(76, 102 + hy, 104, 102 + hy, OUT, 2); p.line(104, 102 + hy, 116, 97 + hy, OUT, 2); }
  else { p.line(62, 97 + hy, 66, 100 + hy, OUT, 2); p.line(118, 97 + hy, 114, 100 + hy, OUT, 2); }
  // dientes superiores
  for (let i = 0; i < 7; i++) { const x = 67 + i * 7; p.poly([[x, 102 + hy], [x + 6, 102 + hy], [x + 3, 109 + hy + (i % 2 ? 0 : 2)]], TEETH); p.set(x + 1, 103 + hy, '#cfc8b0'); }
  // dientes inferiores
  if (dj > 4) for (let i = 0; i < 6; i++) { const x = 70 + i * 7; const by = 100 + hy + dj + 8; p.poly([[x, by], [x + 6, by], [x + 3, by - 7]], TEETH); }
  // colmillos grandes
  p.poly([[62, 101 + hy], [68, 101 + hy], [65, 113 + hy]], TEETH); p.poly([[mx(62), 101 + hy], [mx(68), 101 + hy], [mx(65), 113 + hy]], TEETH);
  // lengua
  if (dj > 8) { p.ell(90, 102 + hy + dj * 0.78, 13, 4 + dj * 0.22, '#e0506a'); p.line(90, 100 + hy + dj * 0.6, 90, 104 + hy + dj, '#a82e46'); }
  if (o.tongue === 'lick') { p.ell(110, 106 + hy, 10, 4, '#e0506a'); p.ell(118, 100 + hy, 5, 5, '#e0506a'); }
  if (o.tongue === 'out') { p.ell(90, 112 + hy, 9, 8, '#e0506a'); p.line(90, 106 + hy, 90, 118 + hy, '#a82e46'); }

  // ── ojos rojos ──
  const look = (o.look ?? 0) * 3;
  for (const left of [true, false]) {
    const f = (x: number) => (left ? x : mx(x));
    const ex = f(66), ey = 62 + hy;
    if (o.eyes === 'squint') {
      p.line(f(52), ey + 3, f(66), ey - 2, OUT, 3); p.line(f(66), ey - 2, f(82), ey + 6, OUT, 3);
      p.line(f(54), ey + 6, f(66), ey + 2, '#ff3030', 1);
      continue;
    }
    const wide = o.eyes === 'wide';
    p.poly([[f(50), ey - 3], [f(64), ey - (wide ? 8 : 5)], [f(82), ey + 7], [f(64), ey + (wide ? 11 : 9)]].map(a => a as [number, number]), OUT);
    p.poly([[f(53), ey - 1], [f(64), ey - (wide ? 6 : 3)], [f(79), ey + 6], [f(64), ey + (wide ? 9 : 7)]].map(a => a as [number, number]), '#ffe0a0');
    p.ell(ex + (left ? look : -look), ey + 3, 7, wide ? 7 : 5, '#ff1e1e', false);
    p.ell(ex + (left ? look : -look), ey + 3, 4, wide ? 5 : 3.5, '#ff6a3a', false);
    p.rect(ex + (left ? look : -look) - 1, ey - 1, 2, wide ? 11 : 8, '#14040a');
    p.set(ex + look - 4 * (left ? 1 : -1), ey, '#ffffff');
    // ceja enfadada
    p.line(f(48), ey - 12, f(80), ey - 2, '#7a2a10', 3);
    p.line(f(52), ey - 15, f(82), ey - 6, '#5a1a0c', 2);
  }
  p.outline(OUT);
  return p;
}
