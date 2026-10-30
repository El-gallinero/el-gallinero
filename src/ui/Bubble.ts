import Phaser from 'phaser';
import { FONT } from './widgets';
import { snd } from '../audio/sound';
import { CFG } from '../config/game';

/** Bocadillo de diálogo retro con texto "máquina de escribir". Se ancla sobre un personaje. */
export class Bubble extends Phaser.GameObjects.Container {
  private t: Phaser.GameObjects.Text;
  private lines: string[];
  private tailX = 0;
  bw = 0; bh = 0;
  private timer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, private anchorX: number, private anchorY: number, full: string, maxW = 150, private voice = 0) {
    super(scene, anchorX, anchorY);
    const style = { fontFamily: FONT, fontSize: '8px', color: '#1b1424', lineSpacing: 5, wordWrap: { width: maxW - 14, useAdvancedWrap: true } } as Phaser.Types.GameObjects.Text.TextStyle;
    this.t = scene.add.text(0, 0, full, style);
    this.lines = this.t.getWrappedText(full);
    const joined = this.lines.join('\n');
    this.t.setText(joined);
    const w = Math.ceil(this.t.width) + 14, h = Math.ceil(this.t.height) + 12;
    this.bw = w; this.bh = h;
    const g = scene.add.graphics();
    const x = -w / 2, y = -h - 9;
    g.fillStyle(0x1b1424, 1); g.fillRect(x + 2, y, w - 4, h); g.fillRect(x, y + 2, w, h - 4);
    g.fillStyle(0xffffff, 1); g.fillRect(x + 4, y + 2, w - 8, h - 4); g.fillRect(x + 2, y + 4, w - 4, h - 8);
    g.fillStyle(0xdfe2f0, 1); g.fillRect(x + 4, y + h - 5, w - 8, 3);
    // cola
    g.fillStyle(0x1b1424, 1); g.fillTriangle(-6, y + h - 2, 6, y + h - 2, 0, y + h + 8);
    g.fillStyle(0xffffff, 1); g.fillTriangle(-4, y + h - 3, 4, y + h - 3, 0, y + h + 4);
    this.t.setPosition(x + 7, y + 6); this.t.setText('');
    this.add([g, this.t]);
    this.setDepth(9500); scene.add.existing(this);
    this.setAlpha(0).setScale(1, 0.6);
    scene.tweens.add({ targets: [this], alpha: 1, scaleY: 1, duration: 120, ease: "Back.easeOut" });
  }
  /** Escribe el texto; resuelve al terminar. */
  typeOut(): Promise<void> {
    const full = this.lines.join('\n');
    return new Promise(res => {
      let i = 0;
      this.timer = this.scene.time.addEvent({
        delay: CFG.typeMsPerChar, loop: true,
        callback: () => {
          i++; this.t.setText(full.slice(0, i));
          if (i % 2 === 0 && full[i - 1] !== ' ' && full[i - 1] !== '\n') snd.typeBlip(this.voice);
          if (i >= full.length) { this.timer?.remove(); res(); }
        },
      });
    });
  }
  showAll() { this.timer?.remove(); this.t.setText(this.lines.join('\n')); }
  setAnchor(x: number, y: number) { this.anchorX = x; this.anchorY = y; }
  /** Mantiene el bocadillo dentro de la cámara. */
  place(cam: Phaser.Cameras.Scene2D.Camera) {
    const v = cam.worldView, half = this.bw / 2;
    const x = Phaser.Math.Clamp(this.anchorX, v.x + half + 3, v.right - half - 3);
    const y = Math.max(this.anchorY, v.y + this.bh + 14);
    this.setPosition(Math.round(x), Math.round(y));
    // desplaza la cola para que siga apuntando al personaje: se simplifica manteniéndola centrada
  }
  close(fade = 150) {
    this.timer?.remove();
    this.scene?.tweens.add({ targets: this as Phaser.GameObjects.GameObject, alpha: 0, duration: fade, onComplete: () => this.destroy() });
  }
}
