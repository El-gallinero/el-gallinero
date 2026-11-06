import Phaser from 'phaser';
import { Px } from './px';
import { drawChicken, drawChick, ballotSprite, HERO, HERO_NB, NPC, HEN_W, HEN_C, HEN_G, ChickenStyle, Dir } from './chicken';
import { drawPol, drawUrn, POL_W, POL_H, PolPose } from './politicians';
import { LOOKS } from './looks';
import { drawFox, FOX_W, FOX_H, FoxPose } from './fox';
import * as props from './props';
import { generateGround } from './tiles';
import { drawFoxRoom } from './room';
import { POLITICIANS, PRISONERS } from '../config/politicians';
import { GAME_W, GAME_H } from '../config/game';

const tick = () => new Promise<void>(r => setTimeout(r, 0));
export const DIRS: Dir[] = ['down', 'up', 'left', 'right'];
export const CHICKEN_FEET = { x: 17, y: 30, w: 34, h: 34 };
export const POL_ORIGIN = { x: 0.5, y: 57 / POL_H };
export const GAL_ORIGIN = { x: 0.5, y: 31 / 34 };
export const FOX_SIZE = { w: FOX_W, h: FOX_H };

export interface PropMeta { ox: number; oy: number; fw: number; fh: number; w: number; h: number }
export const PROP_META: Record<string, PropMeta> = {};
let groundField: Float32Array | null = null;
export const getGroundField = () => groundField;

function reg(scene: Phaser.Scene, key: string, p: Px) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, p.canvas());
}
function shadow(w: number, h: number, a = 95): Px {
  const p = new Px(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + 0.5 - w / 2) / (w / 2), dy = (y + 0.5 - h / 2) / (h / 2);
    const d = dx * dx + dy * dy;
    if (d <= 1) p.set(x, y, [10, 6, 24], d > 0.6 ? Math.round(a * 0.6) : a);
  }
  return p;
}
function glow(size: number, rgb: string, a = 1): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, `rgba(${rgb},${a})`); grd.addColorStop(0.4, `rgba(${rgb},${a * 0.4})`); grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  return c;
}

export async function generateAllArt(scene: Phaser.Scene, progress: (p: number, label?: string) => void) {
  // ── terreno ──────────────────────────────────────────────
  const ground = await generateGround(p => progress(0.05 + p * 0.45, 'TERRENO'));
  groundField = ground.field;
  if (scene.textures.exists('ground')) scene.textures.remove('ground');
  scene.textures.addCanvas('ground', ground.canvas);
  await tick();

  // ── gallinas ─────────────────────────────────────────────
  const styles: [string, ChickenStyle][] = [['b', HERO], ['n', HERO_NB], ['npc', NPC], ['hw', HEN_W], ['hc', HEN_C], ['hg', HEN_G]];
  for (const [v, st] of styles) {
    for (const d of DIRS) {
      for (let i = 0; i < 4; i++) {
        const A = [2, 0, 0, 0][i], B = [0, 0, 2, 0][i];
        reg(scene, `gal_${v}_walk_${d}_${i}`, drawChicken(st, { dir: d, legA: A, legB: B, bob: [0, 1, 0, 1][i], sway: [-1, 0, 1, 0][i] }));
      }
      for (let i = 0; i < 4; i++) reg(scene, `gal_${v}_idle_${d}_${i}`, drawChicken(st, { dir: d, breath: [0, 1, 0, 0][i], blink: i === 3, sway: i === 2 ? 1 : 0 }));
    }
    reg(scene, `gal_${v}_talk_0`, drawChicken(st, { dir: 'down', open: 2 }));
    reg(scene, `gal_${v}_talk_1`, drawChicken(st, { dir: 'down', open: 1, bob: 1 }));
  }
  for (const d of ['left', 'right'] as Dir[]) {
    reg(scene, `gal_b_give0_${d}`, drawChicken(HERO, { dir: d, wingUp: 1 }));
    reg(scene, `gal_n_give1_${d}`, drawChicken(HERO_NB, { dir: d, wingUp: 2 }));
  }
  reg(scene, 'ballot', ballotSprite());
  reg(scene, 'chick_0', drawChick(0)); reg(scene, 'chick_1', drawChick(1));
  progress(0.55, 'GALLINAS'); await tick();

  // ── políticos ────────────────────────────────────────────
  let n = 0;
  for (const pl of POLITICIANS) {
    const look = LOOKS[pl.spriteId];
    const urn = { color: pl.urnColor, mark: pl.urnMark, ballot: true };
    const R = (key: string, pose: PolPose) => reg(scene, `pol_${pl.id}_${key}`, drawPol(look, urn, pose));
    for (let i = 0; i < 4; i++) {
      R(`idle_${i}`, { dir: 'down', bob: [0, 1, 0, 1][i], blink: i === 2 });
      R(`talk_${i}`, { dir: 'down', arm: 'point', point: i % 2, mouth: [2, 1, 2, 0][i] as 0 | 1 | 2, bob: i % 2 });
      for (const d of DIRS) R(`walk_${d}_${i}`, { dir: d, legs: [-1, 0, 1, 0][i], bob: [0, 1, 0, 1][i] });
    }
    for (const d of DIRS) R(`stand_${d}`, { dir: d, legs: 0 });
    R('knock_0', { dir: 'up', arm: 'knock', point: 0 }); R('knock_1', { dir: 'up', arm: 'knock', point: 1 });
    R('cheer', { dir: 'down', arm: 'cheer', eyes: 'happy', mouth: 2 });
    R('scared_0', { dir: 'down', arm: 'scared', eyes: 'wide', mouth: 2, shake: 0 }); R('scared_1', { dir: 'down', arm: 'scared', eyes: 'wide', mouth: 2, shake: 1, bob: 1 });
    { const u = new Px(26, 24); drawUrn(u, 4, 8, 18, 12, urn); u.outline('#1b1424'); reg(scene, `urn_${pl.id}`, u); }
    progress(0.55 + 0.25 * (++n / POLITICIANS.length), 'PERSONAJES'); await tick();
  }

  // ── presos (inventados) ──────────────────────────────────
  for (const pr of PRISONERS) {
    const look = LOOKS[pr.id], urn = { color: 0x888888, mark: '', ballot: false, hide: true };
    for (let i = 0; i < 2; i++) reg(scene, `${pr.id}_${i}`, drawPol(look, urn, { dir: 'down', arm: 'cheer', eyes: 'wide', mouth: 2, bob: i, legs: 0 }));
  }

  // ── zorro ────────────────────────────────────────────────
  const F = (k: string, o: FoxPose) => reg(scene, `fox_${k}`, drawFox(o));
  F('idle0', { mouth: 0 }); F('idle1', { mouth: 0, sy: 1 });
  F('laugh0', { mouth: 2, eyes: 'squint', arms: 'belly' }); F('laugh1', { mouth: 3, eyes: 'squint', arms: 'belly', sy: -1 });
  F('open', { mouth: 3, eyes: 'wide' }); F('open2', { mouth: 2, eyes: 'wide' });
  F('chew0', { mouth: 0, cheeks: true }); F('chew1', { mouth: 1, cheeks: true, sy: 1 });
  F('lick', { mouth: 0, tongue: 'lick', eyes: 'squint' }); F('smile', { mouth: 0, eyes: 'squint', arms: 'belly' });
  F('look_l', { mouth: 0, look: -1 }); F('look_r', { mouth: 0, look: 1 });
  F('burp', { mouth: 2, eyes: 'squint', cheeks: true });
  reg(scene, 'fox_room', drawFoxRoom(GAME_W, GAME_H));
  progress(0.85, 'ZORRO'); await tick();

  // ── escenario ────────────────────────────────────────────
  const add = (name: string, a: props.PropArt) => { reg(scene, `prop_${name}`, a.px); PROP_META[name] = { ox: a.ox, oy: a.oy, fw: a.fw, fh: a.fh, w: a.px.w, h: a.px.h }; };
  add('tree', props.tree(0)); add('tree2', props.tree(1)); add('deadtree', props.deadTree());
  add('bush', props.bush(0)); add('bush2', props.bush(1)); add('rock', props.rock());
  add('hay', props.hayBale()); add('haystack', props.haystack());
  add('feeder', props.trough(false)); add('trough', props.trough(true)); add('barrel', props.barrel()); add('crate', props.crate());
  add('scarecrow', props.scarecrow());
  add('coop', props.coop()); add('coopBig', props.coop({ big: true, roof: '#c2242c', wall: '#d8a050' })); add('coopOld', props.coop({ wall: '#8a6a4a', roof: '#6a4a3a' }));
  add('horreo', props.horreo()); add('sign', props.sign()); add('cage', props.cage());
  add('fenceH', props.fenceH(false)); add('fenceV', props.fenceV(false)); add('fenceHd', props.fenceH(true)); add('fenceVd', props.fenceV(true));
  for (let k = 0; k < 4; k++) add(`door_${k}`, props.doorShed(k));
  for (let f = 0; f < 2; f++) { reg(scene, `bfly_a${f}`, props.butterfly(f, '#ffd84a')); reg(scene, `bfly_b${f}`, props.butterfly(f, '#ff7ab0')); }

  // ── utilidades ───────────────────────────────────────────
  reg(scene, 'shadow_s', shadow(24, 8)); reg(scene, 'shadow_m', shadow(38, 12)); reg(scene, 'shadow_l', shadow(60, 16, 110)); reg(scene, 'shadow_xl', shadow(150, 28, 120));
  const dot = new Px(2, 2); dot.rect(0, 0, 2, 2, '#ffffff'); reg(scene, 'pt_dot', dot);
  const dust = new Px(5, 5); dust.ell(2.5, 2.5, 2.4, 2.4, '#e8c898', false); reg(scene, 'pt_dust', dust);
  const smoke = new Px(12, 12); smoke.ell(6, 6, 5.5, 5.5, '#d8d4e0', false); smoke.ell(5, 5, 2.5, 2.5, '#f4f2fa', false); reg(scene, 'pt_smoke', smoke);
  const star = new Px(9, 9); star.rect(4, 0, 1, 9, '#ffe14a'); star.rect(0, 4, 9, 1, '#ffe14a'); star.rect(3, 3, 3, 3, '#fff6b0'); reg(scene, 'pt_star', star);
  const fea = new Px(6, 3); fea.rect(0, 1, 6, 1, '#ffffff'); fea.rect(1, 0, 3, 1, '#e8e8f4'); fea.rect(2, 2, 3, 1, '#d0d0e0'); reg(scene, 'pt_feather', fea);
  scene.textures.addCanvas('glow_red', glow(128, '255,60,40', 1));
  scene.textures.addCanvas('glow_warm', glow(128, '255,220,150', 0.9));
  const vg = document.createElement('canvas'); vg.width = GAME_W; vg.height = GAME_H;
  { const g = vg.getContext('2d')!; const grd = g.createRadialGradient(GAME_W / 2, GAME_H / 2, 90, GAME_W / 2, GAME_H / 2, GAME_H * 0.68); grd.addColorStop(0, 'rgba(10,0,10,0)'); grd.addColorStop(1, 'rgba(10,0,10,0.72)'); g.fillStyle = grd; g.fillRect(0, 0, GAME_W, GAME_H); }
  scene.textures.addCanvas('vignette', vg);
  progress(1, 'LISTO');
}

export function createAnims(scene: Phaser.Scene) {
  const A = scene.anims;
  const mk = (key: string, frames: string[], frameRate: number, repeat = -1) => {
    if (A.exists(key)) A.remove(key);
    A.create({ key, frames: frames.map(k => ({ key: k })), frameRate, repeat });
  };
  for (const v of ['b', 'n', 'npc', 'hw', 'hc', 'hg']) {
    for (const d of DIRS) {
      mk(`gal_${v}_walk_${d}`, [0, 1, 2, 3].map(i => `gal_${v}_walk_${d}_${i}`), 14);
      mk(`gal_${v}_idle_${d}`, [0, 0, 0, 1, 1, 0, 0, 2, 0, 0, 3, 0].map(i => `gal_${v}_idle_${d}_${i}`), 4);
    }
    mk(`gal_${v}_talk`, ['gal_' + v + '_talk_0', 'gal_' + v + '_talk_1'], 6);
  }
  mk('chick_walk', ['chick_0', 'chick_1'], 8);
  for (const pl of POLITICIANS) {
    mk(`pol_${pl.id}_idle`, [0, 1, 2, 1].map(i => `pol_${pl.id}_idle_${i}`), 3);
    mk(`pol_${pl.id}_talk`, [0, 1, 2, 3].map(i => `pol_${pl.id}_talk_${i}`), 7);
    for (const d of DIRS) mk(`pol_${pl.id}_walk_${d}`, [0, 1, 2, 3].map(i => `pol_${pl.id}_walk_${d}_${i}`), 8);
    mk(`pol_${pl.id}_knock`, ['knock_0', 'knock_1'].map(k => `pol_${pl.id}_${k}`), 6);
    mk(`pol_${pl.id}_scared`, ['scared_0', 'scared_1'].map(k => `pol_${pl.id}_${k}`), 12);
  }
  for (const pr of PRISONERS) mk(`${pr.id}_anim`, [0, 1].map(i => `${pr.id}_${i}`), 3);
  mk('fox_idle', ['fox_idle0', 'fox_idle1'], 1.6);
  mk('fox_laugh', ['fox_laugh0', 'fox_laugh1'], 7);
  mk('fox_chew', ['fox_chew0', 'fox_chew1'], 7);
  mk('bfly_a', ['bfly_a0', 'bfly_a1'], 8); mk('bfly_b', ['bfly_b0', 'bfly_b1'], 9);
}
