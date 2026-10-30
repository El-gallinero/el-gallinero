import Phaser from 'phaser';
import type { Grid } from '../systems/grid';
import type { Dir } from '../art/chicken';
import { GAL_ORIGIN } from '../art';

/** Gallina decorativa que deambula (sin papeleta). v = variante de color: hw blanca, hc crema, hg gris. */
export class Hen {
  x: number; y: number; tx: number; ty: number; wait = Math.random() * 3; dir: Dir = 'down';
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene, private hx: number, private hy: number, private v: string, private grid: Grid, private r = 46) {
    this.x = this.tx = hx; this.y = this.ty = hy;
    this.shadow = scene.add.image(hx, hy, 'shadow_s').setDepth(2);
    this.sprite = scene.add.sprite(hx, hy, `gal_${v}_idle_down_0`).setOrigin(GAL_ORIGIN.x, GAL_ORIGIN.y);
    this.sprite.play(`gal_${v}_idle_down`);
  }
  update(dt: number) {
    if (this.wait > 0) {
      this.wait -= dt;
      const k = `gal_${this.v}_idle_${this.dir}`;
      if (this.sprite.anims.currentAnim?.key !== k) this.sprite.play(k);
    } else {
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { this.wait = 1.5 + Math.random() * 4; this.pick(); }
      else {
        if (Math.abs(dx) > Math.abs(dy) * 1.25) this.dir = dx < 0 ? 'left' : 'right';
        else this.dir = dy < 0 ? 'up' : 'down';
        const nx = this.x + (dx / d) * 18 * dt, ny = this.y + (dy / d) * 18 * dt;
        if (this.grid.boxFree(nx, ny, 5, 3)) {
          this.x = nx; this.y = ny;
          const k = `gal_${this.v}_walk_${this.dir}`;
          if (this.sprite.anims.currentAnim?.key !== k) this.sprite.play(k);
          this.sprite.anims.timeScale = 0.5;
        } else { this.wait = 0.6; this.pick(); }
      }
    }
    const rx = Math.round(this.x), ry = Math.round(this.y);
    this.sprite.setPosition(rx, ry).setDepth(ry); this.shadow.setPosition(rx, ry - 1);
  }
  private pick() { const a = Math.random() * 6.283, r = Math.random() * this.r; this.tx = this.hx + Math.cos(a) * r; this.ty = this.hy + Math.sin(a) * r * 0.7; }
}
