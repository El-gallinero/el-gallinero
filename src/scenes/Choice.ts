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
    const top = Math.round(GAME_H / 2) - 60;
    const opts: [string, BtnColors, () => void][] = [
      [TEXT.optRebel, RED, () => this.scene.start('Ending', { kind: 'rebel' })],
      [TEXT.optSelf, GREEN, () => this.scene.start('Ending', { kind: 'self' })],
      [TEXT.optKeep, BLUE, () => this.scene.start('Game')],
    ];
    opts.forEach(([l, c, f], i) => {
      const b = pixelButton(this, CX, top + i * 58 + 40, Math.min(220, GAME_W - 40), 44, l.replace(' EN EL ', '\nEN EL ').replace('GALLINERO ', 'GALLINERO\n'), c, go(f));
      b.c.setAlpha(0); this.tweens.add({ targets: b.c, alpha: 1, y: top + i * 58, duration: 280, delay: 200 + i * 120, ease: 'Back.easeOut' });
    });
  }
}

/** Finales cerrados cortos: rebelión / gallinero autosuficiente. */
export class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }
  create(data: { kind: 'rebel' | 'self' }) {
    const rebel = data?.kind !== 'self';
    const cam = this.cameras.main; cam.fadeIn(500, 0, 0, 0);
    seenEndings.add(rebel ? 'rebel' : 'self'); stat(rebel ? 'final-rebel' : 'final-self');
    this.add.rectangle(0, 0, GAME_W, GAME_H, rebel ? 0x4a2a3a : 0x6ab0e0).setOrigin(0, 0);
    const gy = Math.round(GAME_H * 0.5);
    const ground = this.add.image(0, 0, 'ground').setOrigin(0, 0);
    ground.setCrop(110, 1300, GAME_W, GAME_H - gy); ground.setPosition(-110, gy - 1300);
    this.add.image(46, gy + 30, 'prop_coop').setOrigin(0.5, 1).setScale(1.4);
    this.add.image(GAME_W - 40, gy + 28, 'prop_tree').setOrigin(0.5, 1).setScale(1.4);
    const hens: Phaser.GameObjects.Sprite[] = [];
    const cols = [0xffffff, 0xffd9a0, 0xc9b6a0, 0xffe9e9];
    for (let i = 0; i < 7; i++) {
      const x = 40 + i * ((GAME_W - 80) / 6), y = gy + 56 + (i % 3) * 18;
      const h = this.add.sprite(x, y, 'gal_b_idle_down_0').setOrigin(0.5, 31 / 34).setScale(1.6).setDepth(y); h.play('gal_b_idle_down');
      if (i % 2) h.setTint(cols[i % cols.length]);
      hens.push(h);
      this.tweens.add({ targets: h, y: y - 5, duration: 260 + i * 30, yoyo: true, repeat: -1, delay: i * 60 });
    }
    let sub: string[];
    if (rebel) {
      const fox = this.add.image(GAME_W + 40, gy + 50, 'fox_idle0').setOrigin(0.5, 1).setScale(0.32).setFlipX(true).setDepth(2000);
      this.tweens.add({ targets: fox, x: -60, duration: 3600, ease: 'Quad.easeIn' });
      this.tweens.add({ targets: fox, y: '-=6', duration: 120, yoyo: true, repeat: 14 });
      sub = [TEXT.rebelHint, TEXT.rebelEnd];
      snd.cluck();
    } else {
      for (let i = 0; i < 6; i++) this.add.image(30 + i * 52, gy + 108 + (i % 2) * 10, 'prop_hay').setOrigin(0.5, 1).setScale(0.7).setDepth(1500);
      sub = TEXT.selfCaps;
      snd.sparkle();
    }
    const cap = arcadeText(this, CX, 60, sub[0], 11, '#ffffff', '#3a1020').setDepth(3000);
    let i = 0;
    if (sub.length > 1) this.time.addEvent({ delay: 2200, repeat: sub.length - 2, callback: () => { i++; cap.setText(sub[i]); snd.blip(); } });
    const end = sub.length * 2200 + 600;
    this.time.delayedCall(end, () => {
      cap.setText(rebel ? TEXT.rebelEnd : TEXT.selfEnd);
      const fin = arcadeText(this, CX, gy - 20, TEXT.fin, 26, '#ffe14a', '#3a1020').setDepth(3000).setAlpha(0);
      this.tweens.add({ targets: fin, alpha: 1, duration: 500 });
      txt(this, CX, 104, TEXT.endings(seenEndings.size, TOTAL_ENDINGS), 8, '#ffffff').setDepth(3000).setShadow(0, 2, '#1b1424', 0, false, true);
      let locked = false;
      const go = (fn: () => void) => () => { if (locked) return; locked = true; cam.fadeOut(350, 0, 0, 0); cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, fn); };
      const a = pixelButton(this, CX, GAME_H - 104, 184, 34, TEXT.restart, GREEN, go(() => { resetRun(); this.scene.start('Game'); }));
      const b = pixelButton(this, CX, GAME_H - 62, 184, 34, TEXT.end, RED, go(() => this.scene.start('Title', { bye: true })));
      [a.c, b.c].forEach(c => c.setDepth(3000));
    });
  }
}
