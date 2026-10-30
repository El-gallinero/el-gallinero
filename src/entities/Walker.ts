import Phaser from 'phaser';
import type { Dir } from '../art/chicken';
import type { Pt } from '../systems/grid';

/** Personaje que sigue rutas (waypoints/A*) con animación de caminar en 4 direcciones y sombra. */
export class Walker {
  x: number; y: number; dir: Dir = 'down';
  sprite: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image;
  path: Pt[] = []; moving = false; speed = 60;
  private resolve?: () => void; private stepAcc = 0;
  onStep?: (w: Walker) => void; stepEvery = 14;

  constructor(public scene: Phaser.Scene, x: number, y: number, tex: string, origin: { x: number; y: number }, shadowKey: string,
    public walkKey: (d: Dir) => string, public standKey: (d: Dir) => string, public animScaleDiv = 70) {
    this.x = x; this.y = y;
    this.shadow = scene.add.image(x, y, shadowKey).setDepth(2).setOrigin(0.5, 0.5);
    this.sprite = scene.add.sprite(x, y, tex).setOrigin(origin.x, origin.y);
    this.sync();
  }
  sync() {
    const rx = Math.round(this.x), ry = Math.round(this.y);
    this.sprite.setPosition(rx, ry).setDepth(ry);
    this.shadow.setPosition(rx, ry - 1);
  }
  walkPath(path: Pt[], speed: number): Promise<void> {
    this.path = path.slice(1); this.speed = speed; this.moving = this.path.length > 0; this.stepAcc = 0;
    if (!this.moving) return Promise.resolve();
    return new Promise(res => { this.resolve = res; });
  }
  stop() { this.path = []; this.moving = false; const r = this.resolve; this.resolve = undefined; r?.(); }
  face(d: Dir) { this.dir = d; }
  playStand() { this.sprite.anims.stop(); this.sprite.setTexture(this.standKey(this.dir)); }
  update(dt: number) {
    if (!this.moving) return;
    let step = this.speed * dt;
    while (step > 0 && this.path.length) {
      const [tx, ty] = this.path[0];
      const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy) * 1.25) this.dir = dx < 0 ? 'left' : 'right';
      else if (Math.abs(dy) > Math.abs(dx) * 1.25) this.dir = dy < 0 ? 'up' : 'down';
      if (d <= step) { this.x = tx; this.y = ty; this.path.shift(); step -= d; this.stepAcc += d; }
      else { this.x += (dx / d) * step; this.y += (dy / d) * step; this.stepAcc += step; step = 0; }
      if (this.stepAcc >= this.stepEvery) { this.stepAcc -= this.stepEvery; this.onStep?.(this); }
    }
    const key = this.walkKey(this.dir);
    if (this.sprite.anims.currentAnim?.key !== key || !this.sprite.anims.isPlaying) this.sprite.play(key, true);
    this.sprite.anims.timeScale = Math.max(0.6, this.speed / this.animScaleDiv);
    if (!this.path.length) { this.moving = false; const r = this.resolve; this.resolve = undefined; r?.(); }
    this.sync();
  }
  destroy() { this.sprite.destroy(); this.shadow.destroy(); }
}
