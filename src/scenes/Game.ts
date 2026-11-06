import Phaser from 'phaser';
import { CFG, GAME_W, GAME_H, DEBUG } from '../config/game';
import { TEXT } from '../config/dialogs';
import { POLITICIANS, PRISONERS, PoliticianDef } from '../config/politicians';
import { PROPS, FENCES, DOOR, START, WORLD, SCATTER, sc, PropDef, PropKind } from '../config/world';
import { PROP_META, GAL_ORIGIN, POL_ORIGIN, getGroundField } from '../art';
import type { Dir } from '../art/chicken';
import { Grid, Pt } from '../systems/grid';
import { Joystick } from '../systems/joystick';
import { Hero } from '../entities/Hero';
import { Politician } from '../entities/Politician';
import { Walker } from '../entities/Walker';
import { Chick } from '../entities/Chick';
import { Hen } from '../entities/Hen';
import { Bubble } from '../ui/Bubble';
import { QuestionPanel } from '../ui/QuestionPanel';
import { arcadeText, txt } from '../ui/widgets';
import { snd } from '../audio/sound';
import { music } from '../audio/music';
import { fed, run } from '../state';

type State = 'explore' | 'dialog' | 'giving' | 'cinematic';
const SHADOWED = new Set(['tree', 'tree2', 'deadtree', 'coop', 'coopBig', 'coopOld', 'horreo', 'haystack', 'hay', 'barrel', 'crate', 'bush', 'bush2', 'trough', 'feeder', 'scarecrow', 'rock']);

export class GameScene extends Phaser.Scene {
  state: State = 'explore';
  grid!: Grid; hero!: Hero; pols: Politician[] = []; chicks: Chick[] = []; hens: Hen[] = [];
  joy!: Joystick; panel!: QuestionPanel;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  camZone!: Phaser.GameObjects.Zone; camGoal: Pt | null = null;
  door!: Phaser.GameObjects.Image; doorGlow?: Phaser.GameObjects.Image; doorSpill?: Phaser.GameObjects.Image; dim?: Phaser.GameObjects.Rectangle;
  bubble?: Bubble; activePol?: Politician;
  voted = false; exploreTime = 0; stepAcc = 0; cluckT = 6; dustAcc = 0;
  npc?: Walker; npcState: 'none' | 'in' | 'talk' | 'out' | 'done' = 'none'; npcBubble?: Bubble; npcT = 0; npcPathT = 0; npcSpawn: Pt = [0, 0];
  flies: { s: Phaser.GameObjects.Sprite; hx: number; hy: number; ph: number; r: number }[] = [];
  enterFade?: Politician; enterFrom = 0; hint?: Phaser.GameObjects.Text;
  private heroMoveTween?: Phaser.Tweens.Tween;
  jailBubble?: Bubble; jailId = '';

  constructor() { super('Game'); }

  // ───────────────────────────── creación ─────────────────────────────
  create() {
    this.jailBubble = undefined; this.jailId = '';
    this.state = 'explore'; this.voted = false; this.exploreTime = 0; this.npc = undefined; this.npcState = 'none'; this.bubble = undefined; this.npcBubble = undefined;
    this.pols = []; this.chicks = []; this.hens = []; this.flies = []; this.activePol = undefined; this.enterFade = undefined; this.camGoal = null; this.cluckT = 5;
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.w, WORLD.h); cam.setBackgroundColor(0x2f6a2f); cam.fadeIn(CFG.fadeMs, 0, 0, 0);
    this.add.image(0, 0, 'ground').setOrigin(0, 0).setDepth(-10);
    this.buildWorld();

    const sp = run.last ? { x: run.last[0], y: run.last[1] } : START;   // al continuar, se reanuda junto al último político votado
    this.hero = new Hero(this, sp.x, sp.y);
    this.camZone = this.add.zone(sp.x, sp.y, 1, 1);
    cam.startFollow(this.camZone, true, CFG.camLerp, CFG.camLerp);
    cam.centerOn(sp.x, sp.y);

    this.joy = new Joystick(); this.joy.setEnabled(true);
    this.panel = new QuestionPanel(this);
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,ENTER,Y,N,ESC,M') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keys.M.on('down', () => { snd.setMuted(!snd.muted); document.getElementById('mute')?.dispatchEvent(new Event('mutechanged')); });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    music.play('farm');
    this.showHint();
    (window as any).__gallinero = this;
  }

  private buildWorld() {
    this.grid = new Grid();
    // vallas
    for (const f of FENCES) {
      this.grid.forFence(f, (x, y, v) => {
        const k = (v ? 'fenceV' : 'fenceH') + (f.dark ? 'd' : '');
        const m = PROP_META[k];
        this.add.image(x, y, 'prop_' + k).setOrigin(m.ox / m.w, m.oy / m.h).setDepth(y);
      });
    }
    // escenografía (fija + relleno procedural determinista)
    const extra = this.scatter();
    for (const p of [...PROPS, ...extra]) {
      const m = PROP_META[p.k];
      this.add.image(p.x, p.y, 'prop_' + p.k).setOrigin(m.ox / m.w, m.oy / m.h).setDepth(p.y);
      if (SHADOWED.has(p.k)) this.add.image(p.x, p.y - 2, 'shadow_l').setScale(Math.max(0.5, m.fw / 40), Math.max(0.5, m.fw / 70)).setDepth(2).setAlpha(0.75);
    }
    // perímetro de árboles y matorrales
    const rnd = new Phaser.Math.RandomDataGenerator(['gallinero']);
    const tree = (x: number, y: number, k: string) => { const m = PROP_META[k]; this.add.image(x, y, 'prop_' + k).setOrigin(m.ox / m.w, m.oy / m.h).setDepth(y); this.add.image(x, y - 2, 'shadow_l').setScale(0.6, 0.5).setDepth(2).setAlpha(0.7); };
    for (let x = 22; x < WORLD.w; x += 44) { const dk = x > 380 && x < 900; tree(x + rnd.between(-8, 8), 46 + rnd.between(-6, 14), dk ? 'deadtree' : rnd.pick(['tree', 'tree2'])); }
    for (let y = 120; y < WORLD.h - 30; y += 52) { tree(14 + rnd.between(-4, 6), y, y < 420 ? 'deadtree' : rnd.pick(['tree', 'tree2'])); tree(WORLD.w - 16 + rnd.between(-6, 4), y + 20, y < 420 ? 'deadtree' : rnd.pick(['tree', 'tree2'])); }
    for (let x = 22; x < WORLD.w; x += 38) { const k = rnd.pick(['bush', 'bush2']); const m = PROP_META[k]; this.add.image(x, WORLD.h - 6 + rnd.between(-4, 2), 'prop_' + k).setOrigin(m.ox / m.w, m.oy / m.h).setDepth(WORLD.h); }
    this.grid.build(extra);

    // puerta misteriosa
    const dm = PROP_META['door_0'];
    this.door = this.add.image(DOOR.x, DOOR.y, 'prop_door_0').setOrigin(dm.ox / dm.w, dm.oy / dm.h).setDepth(DOOR.y);
    this.add.image(DOOR.x, DOOR.y - 2, 'shadow_xl').setScale(1, 0.8).setDepth(2).setAlpha(0.8);

    // políticos
    for (const def of POLITICIANS) {
      if (fed.has(def.id)) continue;          // los ya entregados al zorro desaparecen
      const p = new Politician(this, def);
      p.onStep = w => this.footstep(w.x, w.y, 'pol');
      this.pols.push(p);
    }
    // presos (inventados) dentro de sus jaulas
    for (const pr of PRISONERS) {
      this.add.sprite(pr.x, pr.y - 4, `${pr.id}_0`).setOrigin(POL_ORIGIN.x, POL_ORIGIN.y).setDepth(pr.y - 1).play(`${pr.id}_anim`);
    }
    // pollitos y mariposas
    const homes: Pt[] = [[300, 2050], [200, 2120], [380, 2150], [150, 1500], [230, 1500], [1090, 1730], [1050, 1790], [140, 920], [1060, 1290], [700, 1000]];
    for (const [x, y] of homes) this.chicks.push(new Chick(this, sc(x), sc(y), this.grid, 40));
    const hh: [number, number, string][] = [[330, 2060, 'hw'], [200, 2150, 'hc'], [380, 2000, 'hg'], [520, 1850, 'hw'], [780, 1760, 'hc'], [360, 1480, 'hg'], [170, 1380, 'hw'],
      [900, 1290, 'hc'], [820, 1100, 'hg'], [450, 960, 'hw'], [1010, 840, 'hc'], [980, 1680, 'hg'], [560, 700, 'hw'], [860, 470, 'hc'], [380, 1230, 'hg'], [1040, 1960, 'hw']];
    for (const [x, y, v] of hh) this.hens.push(new Hen(this, sc(x), sc(y), v, this.grid));
    const fl: Pt[] = [[260, 2020], [330, 2120], [200, 2060], [1000, 1300], [250, 1380], [900, 1700], [500, 1560]];
    fl.forEach(([x0, y0], i) => {
      const x = sc(x0), y = sc(y0);
      const s = this.add.sprite(x, y, i % 2 ? 'bfly_a0' : 'bfly_b0').setDepth(8000); s.play(i % 2 ? 'bfly_a' : 'bfly_b');
      this.flies.push({ s, hx: x, hy: y, ph: i * 1.7, r: 40 + (i % 3) * 14 });
    });
  }

  /** Relleno de decorado en los huecos: matorrales, rocas, balas, árboles sueltos y alguna caseta. */
  private scatter(): PropDef[] {
    const field = getGroundField(); const out: PropDef[] = [];
    if (!field) return out;
    const rnd = new Phaser.Math.RandomDataGenerator([String(SCATTER.seed)]);
    const keep: [number, number, number][] = [[START.x, START.y, 150], [DOOR.x, DOOR.y, 140], ...POLITICIANS.map(p => [p.x, p.y, 90] as [number, number, number])];
    const kinds: [PropKind, number][] = [['bush', 26], ['bush2', 20], ['rock', 14], ['hay', 9], ['tree', 7], ['tree2', 7], ['barrel', 3], ['crate', 3], ['haystack', 3], ['trough', 2], ['feeder', 2]];
    const total = kinds.reduce((a, k) => a + k[1], 0);
    const pick = () => { let r = rnd.frac() * total; for (const [k, w] of kinds) { r -= w; if (r <= 0) return k; } return 'bush' as PropKind; };
    let tries = 0;
    while (out.length < SCATTER.count && tries++ < 6000) {
      const x = Math.round(70 + rnd.frac() * (WORLD.w - 140)), y = Math.round(90 + rnd.frac() * (WORLD.h - 170));
      const d = field[y * WORLD.w + x];
      if (d < SCATTER.minPathDist) continue;
      if (keep.some(([kx, ky, r]) => Math.hypot(x - kx, (y - ky) * 1.2) < r)) continue;
      if (y < 400 && Math.abs(x - DOOR.x) < 300) continue;                       // la verja de la puerta queda despejada
      if (FENCES.some(f => x > Math.min(f.x1, f.x2) - 26 && x < Math.max(f.x1, f.x2) + 26 && y > Math.min(f.y1, f.y2) - 16 && y < Math.max(f.y1, f.y2) + 30)) continue;
      if (PROPS.some(q => Math.hypot(x - q.x, (y - q.y) * 1.4) < 48) || out.some(q => Math.hypot(x - q.x, (y - q.y) * 1.4) < SCATTER.minOther)) continue;
      const k = pick();
      if ((k === 'tree' || k === 'tree2') && d < 60) continue;
      out.push({ k, x, y });
    }
    return out;
  }

  private showHint() {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const h = txt(this, GAME_W / 2, GAME_H - 44, touch ? TEXT.controlsHint : TEXT.controlsHintPc, 8, '#ffffff');
    h.setScrollFactor(0).setDepth(9800).setShadow(0, 2, '#1b1424', 0, false, true).setAlpha(0);
    this.tweens.add({ targets: h, alpha: 1, duration: 500, delay: 600 });
    this.tweens.add({ targets: h, alpha: 0, duration: 600, delay: 4200, onComplete: () => h.destroy() });
    this.hint = h;
  }

  // ───────────────────────────── bucle ─────────────────────────────
  update(_t: number, delta: number) {
    const dt = Math.min(delta, 50) / 1000;
    for (const c of this.chicks) c.update(dt);
    for (const c of this.hens) c.update(dt);
    for (const f of this.flies) { f.ph += dt * 1.3; f.s.setPosition(Math.round(f.hx + Math.cos(f.ph) * f.r), Math.round(f.hy + Math.sin(f.ph * 1.7) * f.r * 0.5 - 14 + Math.sin(f.ph * 6) * 2)); }
    for (const p of this.pols) { p.update(dt); }
    if (this.state === 'explore') this.updateExplore(dt);
    this.updateNpc(dt);
    this.updateEnter();
    this.hero.sync();
    // cámara: objetivo suavizado
    let gx: number, gy: number;
    if (this.camGoal) { gx = this.camGoal[0]; gy = this.camGoal[1]; } else { gx = this.hero.x + this.hero.vx * 0.22; gy = this.hero.y - 8 + this.hero.vy * 0.14; }
    const k = 1 - Math.exp(-5 * dt);
    this.camZone.x += (gx - this.camZone.x) * k; this.camZone.y += (gy - this.camZone.y) * k;
    this.bubble?.place(this.cameras.main);
    this.jailBubble?.place(this.cameras.main);
    this.npcBubble?.place(this.cameras.main);
    if (this.state === 'dialog' && this.panel.visible) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.Y) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.pendingChoice?.(true);
      else if (Phaser.Input.Keyboard.JustDown(this.keys.N) || Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.pendingChoice?.(false);
    }
  }
  private pendingChoice?: (yes: boolean) => void;

  private readInput(): { x: number; y: number } {
    if (this.joy.active && (this.joy.vec.x || this.joy.vec.y)) return { x: this.joy.vec.x, y: this.joy.vec.y };
    const k = this.keys;
    let x = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let y = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    return { x, y };
  }

  private updateExplore(dt: number) {
    const h = this.hero, inp = this.readInput(), P = CFG.player;
    const tvx = inp.x * P.speed, tvy = inp.y * P.speed;
    const a = Math.min(1, 14 * dt);
    h.vx += (tvx - h.vx) * a; h.vy += (tvy - h.vy) * a;
    if (Math.hypot(h.vx, h.vy) < 1.5 && !inp.x && !inp.y) { h.vx = 0; h.vy = 0; }
    const ox = h.x, oy = h.y;
    const nx = h.x + h.vx * dt;
    if (this.grid.boxFree(nx, h.y, P.footHW, P.footHH)) h.x = nx; else h.vx = 0;
    const ny = h.y + h.vy * dt;
    if (this.grid.boxFree(h.x, ny, P.footHW, P.footHH)) h.y = ny; else h.vy = 0;
    const moved = Math.hypot(h.x - ox, h.y - oy);
    const moving = Math.hypot(inp.x, inp.y) > 0.12 && moved > 0.01;
    if (moving) {
      // dirección con histéresis
      const horiz = h.dir === 'left' || h.dir === 'right';
      const ax = Math.abs(inp.x), ay = Math.abs(inp.y);
      if (horiz ? ay > ax * 1.2 : ax > ay * 1.2) h.dir = ax > ay ? (inp.x < 0 ? 'left' : 'right') : (inp.y < 0 ? 'up' : 'down');
      else if (!horiz && ay >= ax * 0.8 && (h.dir === 'up' ? inp.y > 0 : h.dir === 'down' ? inp.y < 0 : false)) h.dir = inp.y < 0 ? 'up' : 'down';
      h.play('walk'); h.sprite.anims.timeScale = Math.max(0.7, Math.hypot(h.vx, h.vy) / P.speed * 1.1);
      this.stepAcc += moved; this.dustAcc += moved;
      if (this.stepAcc >= P.stepEvery) { this.stepAcc = 0; snd.step(); }
      if (this.dustAcc >= 22) { this.dustAcc = 0; this.puff(h.x, h.y); }
    } else { h.play('idle'); h.sprite.anims.timeScale = 1; }

    // cacareos ocasionales
    this.cluckT -= dt; if (this.cluckT <= 0) { this.cluckT = 7 + Math.random() * 9; snd.cluck(); }

    // gallina secundaria
    if (!this.voted) this.exploreTime += dt;
    if (!this.voted && fed.size === 0 && this.npcState === 'none' && this.exploreTime >= CFG.npcDelaySec) this.spawnNpc();

    // presos: aviso al acercarse
    let near = '';
    for (const pr of PRISONERS) if (Math.hypot(h.x - pr.x, (h.y - pr.y) * 1.15) < 56) { near = pr.id; break; }
    if (near !== this.jailId) {
      this.jailBubble?.close(120); this.jailBubble = undefined; this.jailId = near;
      if (near) {
        const pr = PRISONERS.find(q => q.id === near)!;
        this.jailBubble = new Bubble(this, pr.x, pr.y - 56, TEXT.jailed, 140, 2);
        this.jailBubble.place(this.cameras.main); this.jailBubble.typeOut(); snd.blip();
      }
    }

    // proximidad con los políticos
    for (const p of this.pols) {
      const d = Math.hypot(h.x - p.x, (h.y - p.y) * 1.15);
      if (p.cooldown && d > CFG.proximityReset) p.cooldown = false;
      if (!p.cooldown && !this.voted && d < CFG.proximity) { this.startDialog(p); break; }
    }
  }

  // ───────────────────────────── diálogo ─────────────────────────────
  private async startDialog(p: Politician) {
    if (this.state !== 'explore') return;
    this.state = 'dialog'; this.activePol = p;
    const h = this.hero; h.vx = h.vy = 0; this.joy.setEnabled(false);
    const dx = p.x - h.x, dy = p.y - h.y;
    h.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    h.play('idle'); h.sprite.anims.timeScale = 1;
    p.talk(); p.plate.setVisible(false);
    this.camGoal = [(h.x + p.x) / 2, (h.y + p.y) / 2 + 44];
    snd.blip();
    const idx = POLITICIANS.indexOf(p.def);
    this.bubble = new Bubble(this, p.x, p.y - 54, p.def.line, 140, idx);
    this.bubble.place(this.cameras.main);
    const bub = this.bubble;
    await bub.typeOut();
    if (this.state !== 'dialog' || this.bubble !== bub) return;
    p.idle();
    let decided = false;
    const choose = (yes: boolean) => { if (decided) return; decided = true; this.pendingChoice = undefined; yes ? this.chooseYes(p) : this.chooseNo(p); };
    this.pendingChoice = choose;
    await new Promise<void>(r => this.time.delayedCall(250, r));
    if (this.state !== 'dialog') return;
    this.panel.show(p.def.name, () => choose(true), () => choose(false));
  }

  private chooseNo(p: Politician) {
    this.panel.hide(); this.bubble?.close(); this.bubble = undefined;
    p.cooldown = true; p.idle(); p.plate.setVisible(true);
    this.camGoal = null; this.state = 'explore'; this.activePol = undefined;
    this.joy.setEnabled(true);
    snd.back();
  }

  // ───────────────────────────── voto ─────────────────────────────
  private wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }
  private tw(cfg: Phaser.Types.Tweens.TweenBuilderConfig) { return new Promise<void>(r => this.tweens.add({ ...cfg, onComplete: () => r() })); }

  private async chooseYes(p: Politician) {
    this.state = 'giving'; this.voted = true;
    this.panel.hide(); this.bubble?.close(); this.bubble = undefined;
    const h = this.hero;
    // se acerca a la urna
    const tx = p.x + 27, ty = p.y + 7;
    run.last = [tx, ty];
    await this.heroWalk(tx, ty);
    h.dir = 'left'; h.play('idle'); p.idle();
    this.camGoal = [(h.x + p.x) / 2, (h.y + p.y) / 2 + 20];
    await this.wait(180);
    // extiende el ala con la papeleta
    h.setTex('gal_b_give0_left'); snd.paper();
    await this.wait(300);
    h.hasBallot = false; h.setTex('gal_n_give1_left');
    const b = this.add.image(h.x - 12, h.y - 26, 'ballot').setDepth(9100).setScale(1.3);
    const sx = b.x, sy = b.y, ex = p.x, ey = p.y - 20, cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 22;
    const prog = { t: 0 };
    await this.tw({ targets: prog, t: 1, duration: 520, ease: 'Sine.easeInOut', onUpdate: () => {
      const t = prog.t, u = 1 - t;
      b.setPosition(u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey);
      b.setRotation(t * 1.2); b.setScale(1.3 - 0.7 * t);
    } });
    snd.drop();
    await this.tw({ targets: b, scaleY: 0.1, y: ey + 6, duration: 160 });
    b.destroy(); p.receiveBallot();
    h.play('idle');
    await this.wait(160);
    // el político celebra
    p.sprite.anims.stop(); p.sprite.setTexture(`pol_${p.def.id}_cheer`);
    snd.vote(); snd.sparkle();
    this.burst(p.x, p.y - 44, 'pt_star', 9);
    for (let i = 0; i < 2; i++) { await this.tw({ targets: p.sprite, y: p.y - 7, duration: 130, yoyo: true, ease: 'Quad.easeOut' }); }
    await this.wait(500);
    this.runCinematic(p);
  }

  private heroWalk(x: number, y: number): Promise<void> {
    const h = this.hero, d = Math.hypot(x - h.x, y - h.y);
    if (d < 2) return Promise.resolve();
    const dx = x - h.x, dy = y - h.y;
    h.dir = Math.abs(dx) > Math.abs(dy) * 1.2 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    h.play('walk'); h.sprite.anims.timeScale = 1;
    let acc = 0, last = [h.x, h.y];
    return this.tw({ targets: h, x, y, duration: (d / 70) * 1000, ease: 'Linear', onUpdate: () => {
      acc += Math.hypot(h.x - last[0], h.y - last[1]); last = [h.x, h.y];
      if (acc > CFG.player.stepEvery) { acc = 0; snd.step(); }
    } }).then(() => { h.play('idle'); });
  }

  // ───────────────────────────── cinemática de la puerta ─────────────────────────────
  private async runCinematic(p: Politician) {
    this.state = 'cinematic';
    this.joy.setEnabled(false);
    this.leaveNpc(true);
    const cam = this.cameras.main;
    // ruta transitable (A*) hasta la puerta
    let path = this.grid.roadPath(p.x, p.y, DOOR.knockX, DOOR.knockY);
    if (!path) path = [[p.x, p.y], [DOOR.knockX, DOOR.knockY]];
    p.sprite.setTexture(`pol_${p.def.id}_stand_down`);
    // la cámara abandona a la gallina y sigue al político
    this.camGoal = [p.x, p.y];
    const follow = this.time.addEvent({
      delay: 16, loop: true, callback: () => {
        const dd = Math.hypot(p.x - DOOR.knockX, p.y - DOOR.knockY);
        if (dd < 300) { const t = 1 - dd / 300; this.camGoal = [p.x + (DOOR.x - p.x) * t * 0.5, p.y + (DOOR.y + 34 - p.y) * t * 0.55 - 6 * t]; }
        else this.camGoal = [p.x, p.y - 6];
      },
    });
    await this.wait(450);
    await p.walkPath(path, p.def.speed);
    follow.remove();
    // frente a la puerta
    this.camGoal = [DOOR.x, DOOR.y + 52];
    p.stand('up'); p.x = DOOR.knockX; p.y = DOOR.knockY; p.sync();
    await this.wait(650);
    // TOC, TOC, TOC
    for (let i = 0; i < 3; i++) {
      p.sprite.anims.stop(); p.sprite.setTexture(`pol_${p.def.id}_knock_0`);
      await this.wait(180);
      p.sprite.setTexture(`pol_${p.def.id}_knock_1`);
      snd.knock(); cam.shake(110, 0.004);
      const t = arcadeText(this, DOOR.x + 40, DOOR.y - 58 - i * 6, TEXT.knock, 14 + i * 3, i === 2 ? '#ff5a3a' : '#ffe14a').setDepth(9800).setScale(0.4);
      this.tweens.add({ targets: t, scale: 1.1, y: t.y - 14, duration: 280, ease: 'Back.easeOut' });
      this.tweens.add({ targets: t, alpha: 0, duration: 360, delay: 420, onComplete: () => t.destroy() });
      this.burst(DOOR.x + 6, DOOR.y - 30, 'pt_dust', 3);
      await this.wait(CFG.door.knockGapMs);
    }
    p.sprite.setTexture(`pol_${p.def.id}_stand_up`);
    await this.wait(CFG.door.pauseAfterKnockMs);
    // se abre la puerta
    snd.creak(CFG.door.openMs / 1000);
    this.dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x18000a, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(9700);
    this.tweens.add({ targets: this.dim, alpha: 0.42, duration: CFG.door.openMs });
    this.doorGlow = this.add.image(DOOR.x, DOOR.y - 36, 'glow_red').setBlendMode(Phaser.BlendModes.ADD).setDepth(8800).setAlpha(0).setScale(1.2);
    this.doorSpill = this.add.image(DOOR.x, DOOR.y + 22, 'glow_red').setBlendMode(Phaser.BlendModes.ADD).setDepth(3).setAlpha(0).setScale(3.2, 1.3);
    this.tweens.add({ targets: [this.doorGlow, this.doorSpill], alpha: { from: 0, to: 0.85 }, duration: CFG.door.openMs });
    this.tweens.add({ targets: this.doorGlow, scale: 2.4, duration: CFG.door.openMs });
    cam.zoomTo(1.12, CFG.door.openMs, 'Sine.easeInOut');
    const frames = 4;
    for (let k = 1; k < frames; k++) { this.time.delayedCall((CFG.door.openMs / (frames - 1)) * (k - 0.5), () => this.door.setTexture(`prop_door_${k}`)); }
    await this.wait(CFG.door.openMs + 150);
    this.tweens.add({ targets: this.doorGlow, alpha: { from: 0.85, to: 0.6 }, duration: 160, yoyo: true, repeat: -1 });
    // el político entra
    this.enterFade = p; this.enterFrom = p.y;
    p.sprite.setDepth(9000);
    await p.walkPath([[p.x, p.y], [DOOR.x, DOOR.y - 8]], 34);
    p.sprite.setVisible(false); p.shadow.setVisible(false); p.plate.setVisible(false); p.ballotIn?.setVisible(false);
    this.enterFade = undefined;
    await this.wait(700);
    // transición a negro y escena del zorro
    snd.whoosh(0.9);
    cam.fadeOut(CFG.fadeMs + 200, 0, 0, 0);
    await new Promise<void>(r => cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => r()));
    this.scene.start('Fox', { id: p.def.id });
  }

  private updateEnter() {
    const p = this.enterFade; if (!p) return;
    const total = this.enterFrom - (DOOR.y - 8);
    const t = Phaser.Math.Clamp((this.enterFrom - p.y) / Math.max(1, total), 0, 1);
    const k = Math.round(255 * (1 - 0.75 * t));
    p.sprite.setTint((k << 16) | (Math.round(k * 0.8) << 8) | Math.round(k * 0.8));
    p.sprite.setAlpha(1 - Math.max(0, (t - 0.45) / 0.55));
    p.sprite.setDepth(9000);
  }

  // ───────────────────────────── gallina que presiona ─────────────────────────────
  private spawnNpc() {
    const h = this.hero;
    const base = Math.random() * 6.283;
    for (let i = 0; i < 28; i++) {
      const a = base + (i / 28) * 6.283;
      const sx = Phaser.Math.Clamp(h.x + Math.cos(a) * 160, 50, WORLD.w - 50), sy = Phaser.Math.Clamp(h.y + Math.sin(a) * 250, 50, WORLD.h - 50);
      const v = this.cameras.main.worldView;
      if (sx > v.x - 6 && sx < v.right + 6 && sy > v.y - 6 && sy < v.bottom + 6) continue;      // debe nacer fuera de la vista
      if (!this.grid.boxFree(sx, sy, 6, 3)) continue;
      const path = this.grid.findPath(sx, sy, h.x, h.y);
      if (!path || path.length < 2) continue;
      const w = new Walker(this, sx, sy, 'gal_npc_idle_down_0', GAL_ORIGIN, 'shadow_s', d => `gal_npc_walk_${d}`, d => `gal_npc_idle_${d}_0`, 66);
      w.stepEvery = 16; w.onStep = () => snd.step();
      this.npc = w; this.npcState = 'in'; this.npcSpawn = [sx, sy]; this.npcPathT = 0;
      return;
    }
    this.npcState = 'done';
  }
  private updateNpc(dt: number) {
    const w = this.npc; if (!w || this.npcState === 'none' || this.npcState === 'done') return;
    w.update(dt);
    if (this.npcState !== 'out' && this.state !== 'explore') this.leaveNpc(true);
    const h = this.hero;
    if (this.npcState === 'in') {
      const d = Math.hypot(h.x - w.x, h.y - w.y);
      if (d < 58) {
        w.stop(); w.sprite.play('gal_npc_talk');
        this.npcState = 'talk'; this.npcT = 5.2;
        snd.cluck();
        this.npcBubble = new Bubble(this, w.x, w.y - 32, TEXT.npc, 150, 3);
        this.npcBubble.typeOut();
      } else {
        this.npcPathT -= dt;
        if (this.npcPathT <= 0) {
          this.npcPathT = 0.6;
          const ang = Math.atan2(w.y - h.y, w.x - h.x), tx = h.x + Math.cos(ang) * 46, ty = h.y + Math.sin(ang) * 46;
          const path = this.grid.findPath(w.x, w.y, tx, ty);
          if (path) w.walkPath(path, 84);
        }
      }
    } else if (this.npcState === 'talk') {
      this.npcBubble?.setAnchor(w.x, w.y - 32);
      this.npcT -= dt;
      if (this.npcT <= 0) this.leaveNpc(false);
    } else if (this.npcState === 'out') {
      const v = this.cameras.main.worldView;
      const outside = w.x < v.x - 30 || w.x > v.right + 30 || w.y < v.y - 40 || w.y > v.bottom + 50;
      if (outside || !w.moving) { this.killNpc(); }
    }
  }
  /** La gallina se marcha (solo aparece una vez por partida). */
  private leaveNpc(instant: boolean) {
    const w = this.npc; if (!w || this.npcState === 'out' || this.npcState === 'done' || this.npcState === 'none') return;
    this.npcBubble?.close(instant ? 60 : 200); this.npcBubble = undefined;
    if (instant) { this.killNpc(); return; }
    this.npcState = 'out';
    const path = this.grid.findPath(w.x, w.y, this.npcSpawn[0], this.npcSpawn[1]);
    if (path) w.walkPath(path, 90); else this.killNpc();
  }
  private killNpc() { this.npc?.destroy(); this.npc = undefined; this.npcBubble?.close(0); this.npcBubble = undefined; this.npcState = 'done'; }

  // ───────────────────────────── efectos ─────────────────────────────
  footstep(x: number, y: number, kind: 'pol' | 'hero') { if (kind === 'pol') snd.polStep(); this.puff(x, y); }
  puff(x: number, y: number) {
    const s = this.add.image(x + (Math.random() - 0.5) * 6, y - 1, 'pt_dust').setDepth(y + 1).setAlpha(0.85).setScale(0.8);
    this.tweens.add({ targets: s, y: s.y - 6, alpha: 0, scale: 0.3, duration: 360, onComplete: () => s.destroy() });
  }
  burst(x: number, y: number, key: string, n: number) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283 + Math.random() * 0.5, d = 14 + Math.random() * 16;
      const s = this.add.image(x, y, key).setDepth(9400);
      this.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d - 4, alpha: 0, scale: 0.3, duration: 520 + Math.random() * 200, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
    }
  }

  // ───────────────────────────── depuración / limpieza ─────────────────────────────
  debugTp(id: string) { const p = this.pols.find(q => q.def.id === id); if (p) { this.hero.x = p.x - 70; this.hero.y = p.y + 30; this.camZone.setPosition(this.hero.x, this.hero.y); this.cameras.main.centerOn(this.hero.x, this.hero.y); } }
  private cleanup() {
    this.joy?.destroy(); this.panel?.destroy();
    this.bubble?.destroy(); this.jailBubble?.destroy(); this.npcBubble?.destroy(); this.dim?.destroy();
    this.npc?.destroy(); this.pols.forEach(p => p.destroy());
    try { this.tweens.killAll(); this.time.removeAllEvents(); this.input.keyboard?.removeAllListeners(); } catch { /* escena ya apagada */ }
  }
}
