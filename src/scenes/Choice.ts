import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/game';
import { TEXT } from '../config/dialogs';
import { arcadeText, txt, pixelButton, GREEN, RED, GOLD, BLUE, BtnColors } from '../ui/widgets';
import { snd } from '../audio/sound';
import { music } from '../audio/music';
import { seenEndings, TOTAL_ENDINGS, resetRun } from '../state';
import { stat } from '../stats';

const CX = GAME_W / 2;

/** "¿Y AHORA QUÉ?": tres caminos. */
export class ChoiceScene extends Phaser.Scene {
  constructor() { super('Choice'); }
  create() {
    const cam = this.cameras.main; cam.setBackgroundColor(0x14101c); cam.fadeIn(400, 0, 0, 0);
    music.play('farm');
    arcadeText(this, CX, 44, TEXT.choiceTitle, 14, '#ffe14a', '#3a1020');
    let locked = false;
    const go = (fn: () => void) => () => { if (locked) return; locked = true; snd.click(); cam.fadeOut(350, 0, 0, 0); cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn); };
    const top = Math.round(GAME_H / 2) - 96;
    const opts: [string, BtnColors, () => void][] = [
      [TEXT.optRebel, RED, () => this.scene.start('Ending', { kind: 'rebel' })],
      [TEXT.optSelf, GREEN, () => this.scene.start('Ending', { kind: 'self' })],
      [TEXT.optHome, GOLD, () => this.scene.start('Ending', { kind: 'home' })],
      [TEXT.optKeep, BLUE, () => this.scene.start('Game')],
    ];
    opts.forEach(([l, c, f], i) => {
      const b = pixelButton(this, CX, top + i * 54 + 40, Math.min(220, GAME_W - 40), 44, l.replace(' EN EL ', '\nEN EL ').replace('GALLINERO ', 'GALLINERO\n'), c, go(f));
      b.c.setAlpha(0); this.tweens.add({ targets: b.c, alpha: 1, y: top + i * 54, duration: 280, delay: 200 + i * 120, ease: 'Back.easeOut' });
    });
  }
}

/** Finales cerrados cortos: rebelión / gallinero autosuficiente. */
export class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }

  private fire(x: number, y: number, k = 1) {
    this.add.particles(x, y, 'pt_dot', { lifespan: 620, speedY: { min: -30 * k, max: -62 * k }, speedX: { min: -9, max: 9 }, scale: { start: 2.4 * k, end: 0 }, tint: [0xffe14a, 0xff9a2a, 0xff4a1a, 0xd02010], blendMode: 'ADD', frequency: 45, quantity: 1 }).setDepth(2500);
    this.add.particles(x, y - 8, 'pt_smoke', { lifespan: 1700, speedY: { min: -16, max: -30 }, speedX: { min: -6, max: 10 }, scale: { start: 0.5 * k, end: 1.5 * k }, alpha: { start: 0.45, end: 0 }, tint: 0x30283a, frequency: 160, quantity: 1 }).setDepth(2400);
    const g = this.add.image(x, y - 6, 'glow_warm').setBlendMode(Phaser.BlendModes.ADD).setDepth(2300).setScale(1.1 * k).setTint(0xff6a20).setAlpha(0.3);
    this.tweens.add({ targets: g, alpha: { from: 0.18, to: 0.38 }, scale: { from: 0.95 * k, to: 1.25 * k }, duration: 180, yoyo: true, repeat: -1 });
  }

  /** Placa solar sobre un poste (dibujada con rectángulos, estilo píxel). */
  private solar(x: number, y: number) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x6a6a78, 1); g.fillRect(x - 1, y - 14, 3, 14);               // poste
    g.fillStyle(0x16101c, 1); g.fillRect(x - 21, y - 40, 42, 28);              // marco
    g.fillStyle(0x2a52a0, 1); g.fillRect(x - 19, y - 38, 38, 24);
    g.fillStyle(0x5a8ad8, 1); for (let i = 0; i < 4; i++) g.fillRect(x - 19 + i * 10, y - 38, 1, 24);
    for (let j = 0; j < 3; j++) g.fillRect(x - 19, y - 38 + j * 8, 38, 1);
    g.fillStyle(0xbfe0ff, 1); g.fillRect(x - 17, y - 36, 6, 2);                // reflejo
    const sun = this.add.image(x + 30, y - 70, 'glow_warm').setBlendMode(Phaser.BlendModes.ADD).setScale(0.8).setDepth(1);
    this.tweens.add({ targets: sun, alpha: { from: 0.6, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
  }
  private broccoli(x: number, y: number) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0xa8d070, 1); g.fillRect(x - 1, y - 6, 3, 6);
    for (const [dx, dy, r, c] of [[-4, -9, 4, 0x2e8a3a], [4, -9, 4, 0x2e8a3a], [0, -13, 5, 0x3fb04a], [0, -9, 4, 0x4ac05a]] as [number, number, number, number][]) { g.fillStyle(c, 1); g.fillCircle(x + dx, y + dy, r); }
  }
  private fruit(x: number, y: number, c: number) {
    const g = this.add.graphics().setDepth(y);
    g.fillStyle(0x2e8a3a, 1); g.fillRect(x - 3, y - 5, 7, 5); g.fillStyle(0x4ac05a, 1); g.fillRect(x - 3, y - 5, 7, 1);
    g.fillStyle(c, 1); g.fillCircle(x - 2, y - 4, 2.5); g.fillCircle(x + 3, y - 3, 2.5);
    g.fillStyle(0xffffff, 0.6); g.fillRect(x - 3, y - 5, 1, 1);
  }

  create(data: { kind: 'rebel' | 'self' | 'home' }) {
    const kind = data?.kind ?? 'rebel';
    if (kind === 'home') { this.home(); return; }
    const rebel = kind === 'rebel';
    const cam = this.cameras.main; cam.fadeIn(500, 0, 0, 0);
    seenEndings.add(rebel ? 'rebel' : 'self'); stat(rebel ? 'final-rebel' : 'final-self');
    this.add.rectangle(0, 0, GAME_W, GAME_H, rebel ? 0x1a0f1c : 0x6ab0e0).setOrigin(0, 0);
    const gy = Math.round(GAME_H * 0.4);
    const ground = this.add.image(0, 0, 'ground').setOrigin(0, 0);
    ground.setCrop(110, 1300, GAME_W, GAME_H - gy); ground.setPosition(-110, gy - 1300);
    if (rebel) ground.setTint(0x6a5a78);
    const coop = this.add.image(48, gy + 30, 'prop_coop').setOrigin(0.5, 1).setScale(1.4);
    const tree = this.add.image(GAME_W - 40, gy + 30, 'prop_tree').setOrigin(0.5, 1).setScale(1.4);
    let sub: string[];
    if (rebel) {
      // noche, todo ardiendo, ninguna gallina de adorno: un corral en llamas
      coop.setTint(0x7a5a66); tree.setTint(0x4a3a50);
      this.add.rectangle(0, 0, GAME_W, gy + 4, 0x000000, 0.25).setOrigin(0, 0).setDepth(1);
      const moon = this.add.circle(GAME_W - 70, 44, 12, 0xcfc8e0).setDepth(0); moon.setAlpha(0.7);
      this.fire(34, gy - 6, 1.5); this.fire(62, gy - 14, 1.2);                           // gallinero en llamas
      this.fire(GAME_W - 52, gy - 20, 1.3);                                              // árbol ardiendo
      for (const [x, y] of [[100, gy + 52], [170, gy + 84], [GAME_W - 110, gy + 70], [60, gy + 96]] as [number, number][]) {
        this.add.image(x, y, 'prop_hay').setOrigin(0.5, 1).setScale(0.8).setTint(0x7a5a50).setDepth(y);
        this.fire(x, y - 8, 0.9);
      }
      for (let x = 20; x < GAME_W; x += 56) this.fire(x, gy + 112, 0.5);               // valla chamuscada
      const cols = [0xc89a8a, 0xb88a7a, 0xd8a890];
      for (let i = 0; i < 6; i++) {
        const x = 50 + i * ((GAME_W - 100) / 5), y = gy + 58 + (i % 3) * 16;
        const h = this.add.sprite(x, y, 'gal_n_idle_down_0').setOrigin(0.5, 31 / 34).setScale(1.6).setDepth(y).setTint(cols[i % 3]);
        h.play('gal_n_idle_down');
        this.tweens.add({ targets: h, y: y - 7, duration: 220 + i * 25, yoyo: true, repeat: -1, delay: i * 50 });
        const gl = this.add.image(x, y - 20, 'glow_warm').setBlendMode(Phaser.BlendModes.ADD).setTint(0xff7a30).setScale(0.45).setAlpha(0.2).setDepth(y + 1);
        this.tweens.add({ targets: gl, alpha: { from: 0.1, to: 0.28 }, duration: 200 + i * 40, yoyo: true, repeat: -1 });
      }
      this.add.rectangle(0, 0, GAME_W, GAME_H, 0x1a0820, 0.12).setOrigin(0, 0).setDepth(2000);
      sub = [TEXT.rebelHint, TEXT.rebelEnd];
      snd.cluck();
    } else {
      // una gallina, sus dos pollitos, huerto, frutos y una placa solar
      this.solar(GAME_W / 2 + 10, gy + 36);
      for (let i = 0; i < 4; i++) this.broccoli(34 + i * 22, gy + 114);
      for (let i = 0; i < 4; i++) this.broccoli(GAME_W - 34 - i * 22, gy + 114);
      this.fruit(GAME_W / 2 - 60, gy + 112, 0xe0262d); this.fruit(GAME_W / 2 - 30, gy + 114, 0xff8a1e); this.fruit(GAME_W / 2 + 34, gy + 112, 0xe0262d); this.fruit(GAME_W / 2 + 62, gy + 114, 0xd02080);
      const hx = GAME_W / 2 - 14, hy = gy + 82;
      this.add.image(hx, hy - 1, 'shadow_l').setScale(1, 0.8).setDepth(hy - 1);
      const hen = this.add.sprite(hx, hy, 'gal_n_idle_down_0').setOrigin(0.5, 31 / 34).setScale(2).setDepth(hy); hen.play('gal_n_idle_down');
      this.tweens.add({ targets: hen, y: hy - 4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      [[-40, 8], [40, 6]].forEach(([dx, dy], i) => {
        const c = this.add.sprite(hx + dx, hy + dy, 'chick_0').setOrigin(0.5, 12 / 14).setScale(2).setDepth(hy + dy); c.play('chick_walk');
        this.tweens.add({ targets: c, y: c.y - 4, duration: 320 + i * 60, yoyo: true, repeat: -1 });
      });
      sub = TEXT.selfCaps;
      snd.sparkle();
    }
    const cap = arcadeText(this, CX, 60, sub[0], 11, '#ffffff', '#3a1020').setDepth(3000);
    let i = 0;
    if (sub.length > 1) this.time.addEvent({ delay: 2200, repeat: sub.length - 2, callback: () => { i++; cap.setText(sub[i]); snd.blip(); } });
    const end = sub.length * 2200 + 600;
    this.time.delayedCall(end, () => {
      cap.setText(rebel ? TEXT.rebelEnd : TEXT.selfEnd);
      const fin = arcadeText(this, CX, gy - 46, TEXT.fin, 26, '#ffe14a', '#3a1020').setDepth(3000).setAlpha(0);
      this.tweens.add({ targets: fin, alpha: 1, duration: 500 });
      txt(this, CX, 104, TEXT.endings(seenEndings.size, TOTAL_ENDINGS), 8, '#ffffff').setDepth(3000).setShadow(0, 2, '#1b1424', 0, false, true);
      let locked = false;
      const go = (fn: () => void) => () => { if (locked) return; locked = true; cam.fadeOut(350, 0, 0, 0); cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn); };
      const a = pixelButton(this, CX, GAME_H - 104, 184, 34, TEXT.restart, GREEN, go(() => { resetRun(); this.scene.start('Game'); }));
      const b = pixelButton(this, CX, GAME_H - 62, 184, 34, TEXT.end, RED, go(() => this.scene.start('Title', { bye: true })));
      [a.c, b.c].forEach(c => c.setDepth(3000));
    });
  }

  /** Final "irme a casa": una gallina viendo la tele y comiendo pizza. */
  private home() {
    const cam = this.cameras.main; cam.fadeIn(500, 0, 0, 0);
    seenEndings.add('home'); stat('final-home');
    const W = GAME_W, g = this.add.graphics();
    const fy = Math.round(GAME_H * 0.46);
    g.fillStyle(0x2a2440, 1); g.fillRect(0, 0, W, fy);                       // pared
    g.fillStyle(0x362e52, 1); for (let x = 0; x < W; x += 24) g.fillRect(x, 0, 4, fy);
    g.fillStyle(0x6a4a30, 1); g.fillRect(0, fy, W, GAME_H - fy);             // suelo
    g.fillStyle(0x7a5a3a, 1); for (let y = fy + 8; y < GAME_H; y += 16) g.fillRect(0, y, W, 2);
    g.fillStyle(0x1b1424, 1); g.fillRect(0, fy - 4, W, 4);                   // zócalo
    // tele
    const tx = W / 2, ty = fy - 18;
    g.fillStyle(0x6a4a30, 1); g.fillRect(tx - 54, ty + 4, 108, 14);          // mueble
    g.fillStyle(0x16101c, 1); g.fillRect(tx - 48, ty - 62, 96, 66);
    const scr = this.add.rectangle(tx, ty - 29, 88, 58, 0x3a7ad8).setDepth(2);
    const glow = this.add.image(tx, ty - 29, 'glow_warm').setBlendMode(Phaser.BlendModes.ADD).setTint(0x6aa0ff).setScale(3.2).setAlpha(0.45).setDepth(1);
    const cols = [0x3a7ad8, 0xd83a5a, 0x3ad87a, 0xd8c83a, 0x8a3ad8];
    this.time.addEvent({ delay: 650, loop: true, callback: () => { const c = cols[Math.floor(Math.random() * cols.length)]; scr.setFillStyle(c); glow.setTint(c); } });
    // sofá
    const sy = fy + 70, sx = W / 2;
    g.fillStyle(0x8a2a38, 1); g.fillRect(sx - 56, sy - 30, 112, 44); g.fillStyle(0xa83a48, 1); g.fillRect(sx - 56, sy - 30, 112, 6);
    g.fillStyle(0x6a1a2a, 1); g.fillRect(sx - 64, sy - 20, 12, 40); g.fillRect(sx + 52, sy - 20, 12, 40);
    // mesita con pizza
    const my = sy + 52;
    g.fillStyle(0x4a3220, 1); g.fillRect(sx - 40, my, 80, 8); g.fillRect(sx - 36, my + 8, 4, 12); g.fillRect(sx + 32, my + 8, 4, 12);
    g.fillStyle(0xc88a2a, 1); g.fillEllipse(sx, my - 2, 52, 14);
    g.fillStyle(0xf0c040, 1); g.fillEllipse(sx, my - 3, 46, 11);
    g.fillStyle(0xd02a1a, 1); for (const [dx, dy] of [[-14, -4], [-4, -2], [8, -5], [16, -2], [0, -6]]) g.fillCircle(sx + dx, my + dy, 2);
    g.fillStyle(0x6a4a30, 1); g.fillTriangle(sx + 4, my - 3, sx + 26, my - 3, sx + 15, my + 5);   // hueco de una porción
    const hen = this.add.sprite(sx, sy + 6, 'gal_n_idle_up_0').setOrigin(0.5, 31 / 34).setScale(1.8).setDepth(sy + 6);
    hen.play('gal_n_idle_up');
    this.tweens.add({ targets: hen, y: hen.y - 2, duration: 900, yoyo: true, repeat: -1 });
    this.add.image(sx, sy + 8, 'shadow_l').setDepth(sy + 5).setAlpha(0.6);
    // una porción de pizza que sube y baja hacia el pico
    const slice = this.add.graphics().setDepth(sy + 20);
    slice.fillStyle(0xf0c040, 1); slice.fillTriangle(0, 0, 14, 0, 7, 12); slice.fillStyle(0xd02a1a, 1); slice.fillCircle(7, 3, 1.6);
    slice.setPosition(sx + 12, my - 24);
    this.tweens.add({ targets: slice, y: my - 44, x: sx + 8, duration: 700, yoyo: true, repeat: -1, hold: 300 });
    const sub = TEXT.homeCaps;
    const cap = arcadeText(this, W / 2, 60, sub[0], 11, '#ffffff', '#3a1020').setDepth(3000);
    let i = 0;
    this.time.addEvent({ delay: 2200, repeat: sub.length - 2, callback: () => { i++; cap.setText(sub[i]); snd.blip(); } });
    this.time.delayedCall(sub.length * 2200 + 600, () => {
      const fin = arcadeText(this, W / 2, fy - 50, TEXT.fin, 26, '#ffe14a', '#3a1020').setDepth(3000).setAlpha(0);
      this.tweens.add({ targets: fin, alpha: 1, duration: 500 });
      txt(this, W / 2, 104, TEXT.endings(seenEndings.size, TOTAL_ENDINGS), 8, '#ffffff').setDepth(3000).setShadow(0, 2, '#1b1424', 0, false, true);
      let locked = false;
      const go = (fn: () => void) => () => { if (locked) return; locked = true; cam.fadeOut(350, 0, 0, 0); cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn); };
      const a = pixelButton(this, CX, GAME_H - 104, 184, 34, TEXT.restart, GREEN, go(() => { resetRun(); this.scene.start('Game'); }));
      const b = pixelButton(this, CX, GAME_H - 62, 184, 34, TEXT.end, RED, go(() => this.scene.start('Title', { bye: true })));
      [a.c, b.c].forEach(c => c.setDepth(3000));
    });
    snd.sparkle();
  }
}
