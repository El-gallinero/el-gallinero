import Phaser from 'phaser';
import { panel, txt, pixelButton, GREEN, RED, PixelButton } from './widgets';
import { TEXT } from '../config/dialogs';
import { GAME_H, GAME_W } from '../config/game';
import { snd } from '../audio/sound';

/** Panel inferior con la pregunta y los dos botones grandes (SÍ, VOTAR / NO, SEGUIR). */
export class QuestionPanel {
  private c?: Phaser.GameObjects.Container;
  private btns: PixelButton[] = [];
  visible = false;
  constructor(private scene: Phaser.Scene) {}

  show(name: string, onYes: () => void, onNo: () => void) {
    this.hide(true);
    const H = 104, y0 = GAME_H - H;
    const c = this.scene.add.container(0, GAME_H + 4).setScrollFactor(0).setDepth(10000);
    c.add(panel(this.scene, 3, y0 + 3 - GAME_H, GAME_W - 6, H - 6));
    c.add(txt(this.scene, GAME_W / 2, y0 + 13 - GAME_H, TEXT.question(name), 8, '#f4e3b1').setWordWrapWidth(196, true).setAlign('center'));
    let locked = false;
    const once = (fn: () => void) => () => { if (locked) return; locked = true; this.btns.forEach(b => b.setEnabled(false)); fn(); };
    const yes = pixelButton(this.scene, GAME_W / 2 - 51, y0 + 62 - GAME_H, 98, 44, TEXT.yes, GREEN, once(onYes));
    const no = pixelButton(this.scene, GAME_W / 2 + 51, y0 + 62 - GAME_H, 98, 44, TEXT.no, RED, once(onNo));
    this.btns = [yes, no];
    c.add([yes.c, no.c]);
    this.c = c; this.visible = true;
    snd.blip();
    this.scene.tweens.add({ targets: c, y: GAME_H, duration: 180, ease: 'Back.easeOut' });
  }
  hide(instant = false) {
    this.visible = false;
    const c = this.c; this.c = undefined; this.btns = [];
    if (!c) return;
    if (instant) { c.destroy(); return; }
    this.scene.tweens.add({ targets: c, y: GAME_H + 130, duration: 140, onComplete: () => c.destroy() });
  }
  destroy() { this.c?.destroy(); this.c = undefined; }
}
