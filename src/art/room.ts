import { Px, ramp, hash2, vnoise } from './px';

/** Fondo de la habitación del zorro: ladrillo oscuro, cortinas, trono y alfombra roja. 270×480 */
export function drawFoxRoom(W = 216, H = 384): Px {
  const p = new Px(W, H);
  const wallH = 210;
  const cx = W / 2;
  // pared de ladrillo
  for (let y = 0; y < wallH; y++) for (let x = 0; x < W; x++) {
    const row = Math.floor(y / 10), off = (row & 1) * 12, bx = Math.floor((x + off) / 24);
    const lx = (x + off) % 24, ly = y % 10;
    let c: [number, number, number] = hash2(bx, row) > 0.5 ? [58, 22, 40] : [50, 18, 36];
    if (lx === 0 || ly === 0) c = [30, 10, 24];
    else if (ly === 1) c = [72, 30, 50];
    const v = (vnoise(x / 30, y / 30, 5) - 0.5) * 18;
    p.set(x, y, [c[0] + v, c[1] + v * 0.4, c[2] + v * 0.6]);
  }
  // friso inferior de la pared
  p.rect(0, wallH - 8, W, 8, '#1c0a18'); p.rect(0, wallH - 9, W, 1, '#6a2a3a');
  // suelo de losas
  for (let y = wallH; y < H; y++) for (let x = 0; x < W; x++) {
    const t = ((Math.floor(x / 26) + Math.floor((y - wallH) / 18)) & 1);
    const depth = (y - wallH) / (H - wallH);
    const base = t ? [44, 20, 34] : [34, 14, 28];
    p.set(x, y, [base[0] * (0.7 + depth * 0.5), base[1] * (0.7 + depth * 0.5), base[2] * (0.7 + depth * 0.5)]);
    if ((x % 26 === 0) || ((y - wallH) % 18 === 0)) p.set(x, y, [20, 8, 18]);
  }
  // alfombra roja
  for (let y = wallH + 4; y < H; y++) {
    const t = (y - wallH) / (H - wallH), half = 30 + t * 46;
    for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) {
      const edge = Math.abs(x - cx) > half - 4;
      p.set(x, y, edge ? [200, 150, 50] : (Math.floor((y + x) / 6) & 1) ? [116, 18, 38] : [104, 14, 34]);
    }
  }
  // tarima
  p.box(cx - 100, 192, 200, 20, ramp('#4a2030'), true); p.rect(cx - 100, 212, 200, 4, '#1c0a18');
  p.box(cx - 78, 184, 156, 12, ramp('#5a2838'), true);
  // trono (respaldo alto)
  const red = ramp('#7a1428'), gold = ramp('#d4a43a');
  p.ell(cx, 70, 70, 62, red);
  p.rect(cx - 70, 70, 140, 100, red.base);
  p.rect(cx - 70, 70, 6, 100, red.dark); p.rect(cx + 64, 70, 6, 100, red.dark);
  for (let yy = 40; yy < 168; yy += 14) for (let xx = cx - 60 + ((yy / 14) & 1) * 9; xx < cx + 64; xx += 18) { p.rect(xx, yy, 2, 2, gold.base); p.set(xx, yy, gold.light); p.rect(xx - 1, yy + 1, 4, 1, red.dark); }
  for (let a = Math.PI; a <= Math.PI * 2; a += 0.012) { const x = cx + Math.cos(a) * 72, y = 70 + Math.sin(a) * 64; p.rect(Math.round(x), Math.round(y), 3, 3, gold.base); }
  p.rect(cx - 72, 70, 3, 100, gold.base); p.rect(cx + 69, 70, 3, 100, gold.base);
  p.box(cx - 92, 126, 24, 66, red, true); p.box(cx + 68, 126, 24, 66, red, true); p.rect(cx - 94, 122, 28, 6, gold.base); p.rect(cx + 66, 122, 28, 6, gold.base);
  // cortinas
  for (const left of [true, false]) {
    for (let x = 0; x < 26; x++) {
      const xx = left ? x : W - 1 - x;
      const fold = Math.sin(x * 0.7) * 0.5 + 0.5;
      for (let y = 0; y < wallH + 6; y++) {
        const lim = 40 + Math.sin(y * 0.05 + (left ? 0 : 2)) * 3;
        if (x > lim - 14) continue;
        p.set(xx, y, [70 + fold * 50, 10 + fold * 8, 26 + fold * 10]);
      }
    }
    p.rect(left ? 0 : W - 28, 0, 28, 8, '#c8982e');
  }
  // cuadros / trofeos en la pared
  const frame = (x: number, y: number, w: number, h: number) => {
    p.rect(x, y, w, h, '#c8982e'); p.rect(x + 2, y + 2, w - 4, h - 4, '#1c0a18');
    p.ell(x + w / 2, y + h / 2 + 2, w / 4, h / 5, '#f0f0f0'); p.rect(x + w / 2 - 3, y + h / 2 - 7, 6, 4, '#e03040');      // gallina
  };
  frame(10, 70, 24, 30); frame(W - 34, 70, 24, 30);
  // soportes de antorcha
  p.rect(50, 120, 4, 14, '#2a1a14'); p.rect(W - 54, 120, 4, 14, '#2a1a14');
  // plumas y platos en el suelo
  for (const [x, y] of [[30, 320], [168, 350], [60, 360], [180, 300], [100, 372]]) { p.rect(x, y, 6, 1, '#ffffff'); p.rect(x + 1, y - 1, 3, 1, '#e8e8f0'); p.rect(x + 2, y + 1, 4, 1, '#cfcfe0'); }
  return p;
}
