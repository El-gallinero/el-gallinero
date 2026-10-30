import Phaser from 'phaser';
import type { Grid } from '../systems/grid';

/** Pollito decorativo que deambula alrededor de un punto. */
export class Chick {
  x: number; y: number; tx: number; ty: number; wait = Math.random() * 2;
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image;
  constructor(scene: Phaser.Scene, private hx: number, private hy: number, private grid: Grid, private r = 60) {
    this.x = this.tx = hx; this.y = this.ty = hy;
    this.shadow = scene.add.image(hx, hy, 'shadow_s').setScale(0.5).setDepth(2);
    this.sprite = scene.add.sprite(hx, hy, 'chick_0').setOrigin(0.5, 12 / 14);
    this.sprite.play('chick_walk'); this.sprite.anims.pause();
  }
  update(dt: number) {
    if (this.wait > 0) { this.wait -= dt; this.sprite.anims.pause(); }
    else {
      const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { this.wait = 1 + Math.random() * 3; this.pick(); }
      else {
        const nx = this.x + (dx / d) * 22 * dt, ny = this.y + (dy / d) * 22 * dt;
        if (this.grid.boxFree(nx, ny, 3, 2)) { this.x = nx; this.y = ny; this.sprite.anims.resume(); this.sprite.setFlipX(dx > 0); } else { this.wait = 0.5; this.pick(); }
      }
    }
    const rx = Math.round(this.x), ry = Math.round(this.y);
    this.sprite.setPosition(rx, ry).setDepth(ry); this.shadow.setPosition(rx, ry - 1);
  }
  private pick() { const a = Math.random() * 6.283, r = Math.random() * this.r; this.tx = this.hx + Math.cos(a) * r; this.ty = this.hy + Math.sin(a) * r * 0.7; }
}
