import { drawChicken, HERO, HERO_NB, NPC, drawChick, ballotSprite } from '../src/art/chicken';
import { drawPol } from '../src/art/politicians';
import { LOOKS } from '../src/art/looks';
import { POLITICIANS } from '../src/config/politicians';
const S = 4;
const c = document.getElementById('c') as HTMLCanvasElement;
c.width = 1500; c.height = 1500;
const g = c.getContext('2d')!; g.imageSmoothingEnabled = false;
let y = 0;
const put = (p: any, x: number, yy: number) => g.drawImage(p.canvas(), x, yy, p.w * S, p.h * S);
// políticos
POLITICIANS.forEach((pl, i) => {
  const look = LOOKS[pl.spriteId]; const urn = { color: pl.urnColor, mark: pl.urnMark, ballot: true };
  let x = 0;
  const frames: any[] = [
    { dir: 'down' }, { dir: 'down', mouth: 2, arm: 'point', point: 1 }, { dir: 'down', arm: 'cheer', eyes: 'happy', mouth: 2 }, { dir: 'down', arm: 'scared', eyes: 'wide', mouth: 2 },
    { dir: 'left', legs: -1 }, { dir: 'right', legs: 1 }, { dir: 'up', legs: -1 }, { dir: 'up', arm: 'knock', legs: 0 },
  ];
  frames.forEach(f => { put(drawPol(look, urn, f), x, y); x += 48 * S / 1.0 + 0; });
  y += 60 * S;
});
// gallinas
let x = 0;
for (const st of [HERO, HERO_NB, NPC]) {
  for (const d of ['down', 'up', 'left', 'right'] as const) { put(drawChicken(st, { dir: d, legA: 1 }), x, y); x += 34 * S; }
  put(drawChicken(st, { dir: 'left', wingUp: 1 }), x, y); x += 34 * S;
  put(drawChicken(st, { dir: 'left', wingUp: 2 }), x, y); x += 34 * S;
  put(drawChicken(st, { dir: 'down', open: 2, blink: true }), x, y); x += 34 * S;
}
y += 34 * S; x = 0;
put(drawChick(0), 0, y); put(drawChick(1), 60, y); put(ballotSprite(), 130, y);
(window as any).done = true;
import { drawFox } from '../src/art/fox';
{
  const c2 = document.createElement('canvas'); c2.width = 1500; c2.height = 420; c2.style.display='block';
  document.body.appendChild(c2); const g2 = c2.getContext('2d')!; g2.imageSmoothingEnabled = false;
  const poses: any[] = [{ mouth: 0 }, { mouth: 1, eyes: 'squint', arms: 'belly' }, { mouth: 2 }, { mouth: 3, eyes: 'wide' }, { mouth: 0, cheeks: true, look: 1 }, { mouth: 0, tongue: 'lick' }];
  poses.forEach((po, i) => g2.drawImage(drawFox(po).canvas(), i * 250, 0, 180 * 1.35, 192 * 1.35));
}
