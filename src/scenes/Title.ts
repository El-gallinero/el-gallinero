import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/game';
import { TEXT } from '../config/dialogs';
import { arcadeText, txt, pixelButton, GOLD } from '../ui/widgets';
import { snd } from '../audio/sound';
import { music } from '../audio/music';
import { PROP_META } from '../art';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create(data: { bye?: boolean }) {
    const bye = !!data?.bye;
    const cam = this.cameras.main; cam.fadeIn(400);
    const g = this.add.graphics();
    const bands = [0x2a1d4e, 0x3d2a6a, 0x5a3a84, 0x8a4a8a, 0xc4587a, 0xee7a6a, 0xffa468, 0xffc878];
    const bh = 34;
    bands.forEach((c, i) => { g.fillStyle(c, 1); g.fillRect(0, i * bh, GAME_W, bh + 2); });
    for (let i = 1; i < bands.length; i++) for (let x = 0; x < GAME_W; x += 4) { g.fillStyle(bands[i], 1); g.fillRect(x + (i % 2) * 2, i * bh - 2, 2, 2); g.fillRect(x + ((i + 1) % 2) * 2, i * bh - 4, 2, 2); }
    g.fillStyle(0xfff0b0, 1); g.fillCircle(160, 196, 20); g.fillStyle(0xffd878, 1); g.fillCircle(160, 196, 15);
    g.fillStyle(0x3a2a62, 1); g.fillEllipse(40, 250, 220, 80); g.fillEllipse(190, 256, 200, 70);
    g.fillStyle(0x2c6a3a, 1); g.fillEllipse(20, 272, 220, 70); g.fillEllipse(200, 280, 240, 70);
    const gy = 262;
    const ground = this.add.image(0, 0, 'ground').setOrigin(0, 0);
    ground.setCrop(110, 1900, GAME_W, GAME_H - gy); ground.setPosition(-110, gy - 1900);
    const fm = PROP_META['fenceH'];
    for (let x = 0; x < GAME_W + 16; x += 16) this.add.image(x + 8, gy + 24, 'prop_fenceH').setOrigin(fm.ox / fm.w, fm.oy / fm.h);
    this.add.image(46, gy + 30, 'prop_coop').setOrigin(0.5, 1).setScale(1.4);
    this.add.image(178, gy + 28, 'prop_tree').setOrigin(0.5, 1).setScale(1.4);
    this.add.image(108, 346, 'shadow_l').setScale(1.5, 1.2);
    const hen = this.add.sprite(108, 348, 'gal_b_idle_down_0').setOrigin(0.5, 31 / 34).setScale(3);
    hen.play('gal_b_idle_down');
    this.tweens.add({ targets: hen, y: 344, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const t1 = arcadeText(this, GAME_W / 2, 36, 'EL', 18, '#ffffff', '#3a1020');
    const t2 = arcadeText(this, GAME_W / 2, 68, 'GALLINERO', 20, '#ffe14a', '#3a1020');
    this.tweens.add({ targets: [t1, t2], y: '+=3', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const small = txt(this, GAME_W / 2, 100, TEXT.disclaimer, 12, '#ffe9c8'); small.setShadow(0, 1, '#2a1020', 0, false, true);

    if (!bye) {
      const tap = txt(this, GAME_W / 2, 176, TEXT.tapToStart, 8, '#ffffff'); tap.setShadow(0, 2, '#2a1020', 0, false, true);
      this.tweens.add({ targets: tap, alpha: 0.2, duration: 500, yoyo: true, repeat: -1 });
      let go = false;
      const start = () => {
        if (go) return; go = true;
        snd.unlock(); snd.click(); snd.cluck(); music.play('farm');
        cam.fadeOut(350, 0, 0, 0);
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Game'));
      };
      this.input.once('pointerdown', start);
      this.input.keyboard?.once('keydown', start);
    } else {
      arcadeText(this, GAME_W / 2, 168, '¡GRACIAS\nPOR JUGAR!', 14, '#ffffff', '#3a1020');
      pixelButton(this, GAME_W / 2, 224, 180, 38, TEXT.byeAgain, GOLD, () => {
        cam.fadeOut(300, 0, 0, 0);
        cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Game'));
      });
      music.play('farm');
    }
  }
}
