import Phaser from 'phaser';
import { CFG, GAME_W, GAME_H } from '../config/game';
import { TEXT } from '../config/dialogs';
import { POLITICIANS, PoliticianDef } from '../config/politicians';
import { POL_ORIGIN } from '../art';
import { Walker } from '../entities/Walker';
import { arcadeText, pixelButton, GREEN, RED } from '../ui/widgets';
import { snd } from '../audio/sound';
import { music } from '../audio/music';
import { fed } from '../state';
import { stat } from '../stats';

const CX = GAME_W / 2;
const FOX = { x: CX, y: 198 };            // pies del zorro
const MOUTH = { x: CX, y: 112 };          // boca (aprox.)
const STAND = { x: CX, y: 296 };          // donde se detiene el político

export class FoxScene extends Phaser.Scene {
  fox!: Phaser.GameObjects.Sprite; pol!: Walker; def!: PoliticianDef;
  glows: Phaser.GameObjects.Image[] = []; ballot?: Phaser.GameObjects.Image; alive = true;
  constructor() { super('Fox'); }

  create(data: { id: string }) {
    this.alive = true;
    this.def = POLITICIANS.find(p => p.id === data?.id) ?? POLITICIANS[0];
    const cam = this.cameras.main;
    cam.setBackgroundColor(0x0a0408); cam.fadeIn(CFG.fadeMs, 0, 0, 0);
    this.add.image(0, 0, 'fox_room').setOrigin(0, 0);
    this.add.image(FOX.x, FOX.y + 2, 'shadow_xl').setScale(1.2, 1).setAlpha(0.6).setDepth(1);
    // antorchas
    for (const x of [48, GAME_W - 48]) {
      this.add.particles(x, 118, 'pt_dot', { lifespan: 520, speedY: { min: -26, max: -44 }, speedX: { min: -6, max: 6 }, scale: { start: 1.7, end: 0 }, tint: [0xffe14a, 0xff9a2a, 0xff4a1a], blendMode: 'ADD', frequency: 55, quantity: 1 }).setDepth(5);
      const w = this.add.image(x, 112, 'glow_warm').setBlendMode(Phaser.BlendModes.ADD).setDepth(4).setScale(1.3).setAlpha(0.45);
      this.tweens.add({ targets: w, alpha: { from: 0.3, to: 0.6 }, scale: { from: 1.15, to: 1.4 }, duration: 170, yoyo: true, repeat: -1 });
    }
    this.fox = this.add.sprite(FOX.x, FOX.y, 'fox_idle0').setOrigin(0.5, 1).setDepth(10);
    this.fox.play('fox_idle');
    // ojos rojos brillantes
    for (const dx of [-24, 24]) {
      const g = this.add.image(FOX.x + dx, 72, 'glow_red').setBlendMode(Phaser.BlendModes.ADD).setDepth(11).setScale(0.55).setAlpha(0.8);
      this.tweens.add({ targets: g, alpha: { from: 0.55, to: 1 }, scale: { from: 0.45, to: 0.7 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.glows.push(g);
    }
    const spill = this.add.image(CX, 150, 'glow_red').setBlendMode(Phaser.BlendModes.ADD).setDepth(2).setScale(3.4, 2.4).setAlpha(0.28);
    this.tweens.add({ targets: spill, alpha: { from: 0.2, to: 0.36 }, duration: 1400, yoyo: true, repeat: -1 });
    const vg = this.add.image(0, 0, 'vignette').setOrigin(0, 0).setDepth(1000).setBlendMode(Phaser.BlendModes.NORMAL);
    void vg;

    // político
    this.pol = new Walker(this, STAND.x, GAME_H + 40, `pol_${this.def.id}_stand_up`, POL_ORIGIN, 'shadow_m', d => `pol_${this.def.id}_walk_${d}`, d => `pol_${this.def.id}_stand_${d}`, 62);
    this.pol.onStep = () => snd.polStep();
    this.pol.sprite.setDepth(20);
    music.play('fox');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.alive = false; this.tweens.killAll(); this.time.removeAllEvents(); });
    this.script();
  }

  update(_t: number, delta: number) { this.pol?.update(Math.min(delta, 50) / 1000); if (this.pol) { this.pol.shadow.setDepth(1); } }

  private wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }
  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig) { return new Promise<void>(r => this.tweens.add({ ...cfg, onComplete: () => r() })); }
  private pop(s: string, y: number, size: number, color = '#ffe14a', ms = 1200) {
    const t = arcadeText(this, CX, y, s, size, color).setDepth(900).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, duration: 300, delay: ms, onComplete: () => t.destroy() });
    return t;
  }
  private puffs(x: number, y: number, n: number, key = 'pt_smoke') {
    for (let i = 0; i < n; i++) {
      const s = this.add.image(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 10, key).setDepth(500).setAlpha(0.9).setScale(0.6);
      this.tweens.add({ targets: s, y: s.y - 26 - Math.random() * 20, x: s.x + (Math.random() - 0.5) * 40, scale: 1.6 + Math.random(), alpha: 0, duration: 800 + Math.random() * 400, delay: i * 40, onComplete: () => s.destroy() });
    }
  }
  private crumbs(x: number, y: number) {
    for (let i = 0; i < 7; i++) {
      const s = this.add.image(x, y, 'pt_dot').setDepth(500);
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, d = 12 + Math.random() * 20;
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 14, alpha: 0, duration: 420, onComplete: () => s.destroy() });
    }
  }

  // ───────────────────────────── guion ─────────────────────────────
  private async script() {
    snd.sting();
    await this.wait(900);
    const def = this.def, pol = this.pol, cam = this.cameras.main;
    // entra caminando hacia el zorro
    await pol.walkPath([[STAND.x, GAME_H + 40], [STAND.x, STAND.y]], 52);
    pol.face('up'); pol.playStand(); pol.sync();
    await this.wait(900);
    // entrega la papeleta: sale de la urna y flota ante el zorro
    snd.paper();
    this.ballot = this.add.image(pol.x, pol.y - 22, 'ballot').setDepth(300).setScale(1.2);
    const b = this.ballot, sx = b.x, sy = b.y, ex = CX, ey = 172, prog = { t: 0 };
    await this.tw({ targets: prog, t: 1, duration: 900, ease: 'Sine.easeInOut', onUpdate: () => {
      const t = prog.t, u = 1 - t; const cx = (sx + ex) / 2 + 26, cy = Math.min(sy, ey) - 30;
      b.setPosition(u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey); b.setRotation(Math.sin(t * Math.PI) * 0.5); b.setScale(1.2 + t * 0.7);
    } });
    this.tweens.add({ targets: b, y: ey - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    cam.pan(CX, 160, 700, 'Sine.easeInOut'); cam.zoomTo(1.18, 700, 'Sine.easeInOut');
    await this.wait(900);
    if (def.reaction === 'A') await this.laugh();
    else if (def.reaction === 'B') await this.eatBallot();
    else await this.eatAll();
    await this.wait(900);
    cam.zoomTo(1, 450); cam.pan(CX, GAME_H / 2, 450);
    await this.wait(500);
    this.showEnd();
  }

  /** A: carcajada exagerada. */
  private async laugh() {
    const fox = this.fox, cam = this.cameras.main;
    this.fox.anims.stop(); fox.setTexture('fox_idle0');
    await this.wait(1100);                       // se queda callado un instante
    fox.play('fox_laugh');
    snd.laugh();
    cam.shake(1700, 0.006);
    const t = this.pop(TEXT.laugh, 236, 12, '#ffe14a', 1700);
    const col = this.time.addEvent({ delay: 120, loop: true, callback: () => t.setColor(t.style.color === '#ffe14a' ? '#ff5a3a' : '#ffe14a') });
    this.tweens.add({ targets: t, scale: { from: 1, to: 1.12 }, duration: 160, yoyo: true, repeat: 9 });
    this.tweens.add({ targets: fox, y: FOX.y + 3, duration: 90, yoyo: true, repeat: 17 });
    this.glows.forEach(g => this.tweens.add({ targets: g, scale: 1.1, duration: 120, yoyo: true, repeat: 6 }));
    // el político, intimidado, se vuelve hacia nosotros
    this.pol.sprite.anims.stop(); this.pol.sprite.play(`pol_${this.def.id}_scared`);
    await this.wait(2000);
    col.remove();
    fox.anims.stop(); fox.setTexture('fox_smile');
    this.tweens.add({ targets: this.ballot, y: 262, x: CX + 30, rotation: 3.4, alpha: 0.9, duration: 700, ease: 'Sine.easeIn' });
    await this.wait(900);
  }

  /** B: se traga la papeleta. */
  private async eatBallot(thenEatPol = false) {
    const fox = this.fox, b = this.ballot!;
    fox.anims.stop(); fox.setTexture('fox_open'); snd.whoosh(0.5);
    this.tweens.killTweensOf(b);
    await this.wait(550);
    await this.tw({ targets: b, x: MOUTH.x, y: MOUTH.y + 6, scale: 0.5, rotation: 1.4, duration: 380, ease: 'Quad.easeIn' });
    b.destroy(); this.ballot = undefined;
    snd.bite(); this.cameras.main.shake(120, 0.005);
    fox.setTexture('fox_chew0');
    for (let i = 0; i < 6; i++) {
      fox.setTexture(i % 2 ? 'fox_chew1' : 'fox_chew0'); snd.chew(); this.crumbs(MOUTH.x + (i % 2 ? 14 : -14), MOUTH.y + 6);
      await this.wait(300);
    }
    snd.gulp();
    fox.setTexture('fox_lick'); snd.sparkle();
    await this.wait(800);
    if (!thenEatPol) { fox.setTexture('fox_smile'); await this.wait(500); }
  }

  /** C: se traga la papeleta y también al político. */
  private async eatAll() {
    await this.eatBallot(true);
    const fox = this.fox, pol = this.pol, def = this.def;
    await this.wait(500);
    // pausa cómica: el político se vuelve, pálido de miedo
    pol.sprite.anims.stop(); pol.sprite.play(`pol_${def.id}_scared`);
    snd.scream();
    fox.setTexture('fox_smile');
    this.tweens.add({ targets: pol.sprite, x: pol.x + 1.5, duration: 40, yoyo: true, repeat: 20 });
    await this.wait(1100);
    // abre la boca enorme
    fox.setTexture('fox_open'); snd.whoosh(0.9);
    await this.wait(500);
    // la urna cae al suelo
    const urn = this.add.image(pol.x, pol.y - 16, `urn_${def.id}`).setOrigin(0.5, 1).setDepth(19);
    this.tweens.add({ targets: urn, y: pol.y + 10, duration: 500, ease: 'Bounce.easeOut' });
    // el político es succionado hacia la boca
    pol.sprite.anims.stop(); pol.sprite.setTexture(`pol_${def.id}_scared_1`);
    this.tweens.add({ targets: pol.shadow, alpha: 0, duration: 500 });
    this.tweens.add({ targets: pol.sprite, angle: { from: -12, to: 12 }, duration: 120, yoyo: true, repeat: 8 });
    await this.tw({ targets: pol.sprite, x: MOUTH.x, y: MOUTH.y + 30, scale: 0.22, duration: 1100, ease: 'Cubic.easeIn' });
    pol.sprite.setVisible(false);
    snd.bite(); this.cameras.main.shake(260, 0.01); snd.gulp();
    fox.setTexture('fox_chew0');
    this.puffs(MOUTH.x, MOUTH.y + 10, 5);
    for (let i = 0; i < 3; i++) { fox.setTexture(i % 2 ? 'fox_chew1' : 'fox_chew0'); await this.wait(260); }
    this.pop(TEXT.gulp, 236, 12, '#ffe14a', 1000);
    await this.wait(900);
    fox.setTexture('fox_burp'); snd.burp(); snd.boing();
    this.puffs(MOUTH.x, MOUTH.y + 14, 7);
    this.cameras.main.shake(300, 0.006);
    this.pop(TEXT.burp, 236, 11, '#ff9a4a', 1000);
    await this.wait(1000);
    fox.setTexture('fox_lick'); snd.sparkle();
    await this.wait(700);
    fox.setTexture('fox_smile');
  }

  // ───────────────────────────── final ─────────────────────────────
  private showEnd() {
    const cam = this.cameras.main;
    const y1 = GAME_H - 66, y2 = GAME_H - 26;
    const fresh = !fed.has(this.def.id);
    stat('zorro-' + this.def.id);
    fed.add(this.def.id);
    const all = fresh && fed.size === 2;   // segundo político DISTINTO: remate del chiste
    let locked = false;
    const go = (fn: () => void) => () => { if (locked) return; locked = true; cam.fadeOut(350, 0, 0, 0); cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn); };
    const again = pixelButton(this, CX, y1 + 60, 184, 34, all ? TEXT.again2 : TEXT.again, GREEN, go(() => this.scene.start('Game')));
    const end = pixelButton(this, CX, y2 + 60, 184, 34, TEXT.end, RED, go(() => this.scene.start('Title', { bye: true })));
    const msg = arcadeText(this, CX, y1 - 66, all ? TEXT.allFox : TEXT.foxWorker, 10, '#ffffff', '#3a1020').setDepth(1100).setAlpha(0);
    this.tweens.add({ targets: msg, alpha: 1, duration: 300 });
    [again.c, end.c].forEach(c => c.setDepth(1100));
    this.tweens.add({ targets: again.c, y: y1, duration: 260, ease: 'Back.easeOut' });
    this.tweens.add({ targets: end.c, y: y2, duration: 260, delay: 90, ease: 'Back.easeOut' });
    snd.blip();
  }
}
