import Phaser from 'phaser';
import { generateAllArt, createAnims } from '../art';
import { GAME_W, GAME_H } from '../config/game';
import { TEXT } from '../config/dialogs';
import { txt } from '../ui/widgets';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    this.cameras.main.setBackgroundColor(0x14101c);
    const t = txt(this, GAME_W / 2, GAME_H / 2 - 20, TEXT.loading, 8, '#f4e3b1');
    const bar = this.add.graphics();
    const draw = (p: number) => { bar.clear(); bar.fillStyle(0xf4e3b1, 1); bar.fillRect(28, GAME_H / 2, 160, 10); bar.fillStyle(0x14101c, 1); bar.fillRect(30, GAME_H / 2 + 2, 156, 6); bar.fillStyle(0xe0262d, 1); bar.fillRect(30, GAME_H / 2 + 2, Math.round(156 * p), 6); };
    draw(0);
    generateAllArt(this, p => draw(p)).then(() => {
      createAnims(this);
      t.destroy(); bar.destroy();
      document.getElementById('boot')?.remove();
      document.getElementById('mute')?.classList.add('on');
      this.scene.start('Title');
    });
  }
}
