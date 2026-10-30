import Phaser from 'phaser';
import { GAL_ORIGIN } from '../art';
import type { Dir } from '../art/chicken';

/** La gallina protagonista. */
export class Hero {
  x: number; y: number; vx = 0; vy = 0; dir: Dir = 'down'; hasBallot = true;
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image;
  private frozenTex = false;
  constructor(public scene: Phaser.Scene, x: number, y: number) {
    this.x = x; this.y = y;
    this.shadow = scene.add.image(x, y, 'shadow_s').setDepth(2);
    this.sprite = scene.add.sprite(x, y, 'gal_b_idle_down_0').setOrigin(GAL_ORIGIN.x, GAL_ORIGIN.y);
    this.play('idle');
    this.sync();
  }
  get v() { return this.hasBallot ? 'b' : 'n'; }
  play(kind: 'walk' | 'idle' | 'talk') {
    this.frozenTex = false;
    const key = kind === 'talk' ? `gal_${this.v}_talk` : `gal_${this.v}_${kind}_${this.dir}`;
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
  }
  setTex(key: string) { this.sprite.anims.stop(); this.sprite.setTexture(key); this.frozenTex = true; }
  get frozen() { return this.frozenTex; }
  sync() {
    const rx = Math.round(this.x), ry = Math.round(this.y);
    this.sprite.setPosition(rx, ry).setDepth(ry);
    this.shadow.setPosition(rx, ry - 1);
  }
  destroy() { this.sprite.destroy(); this.shadow.destroy(); }
}
