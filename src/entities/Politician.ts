import Phaser from 'phaser';
import { Walker } from './Walker';
import { POL_ORIGIN } from '../art';
import type { PoliticianDef } from '../config/politicians';
import { FONT } from '../ui/widgets';

export class Politician extends Walker {
  plate: Phaser.GameObjects.Text;
  ballotIn?: Phaser.GameObjects.Image;
  cooldown = false;          // tras "NO": hay que alejarse para reactivar el diálogo
  constructor(scene: Phaser.Scene, public def: PoliticianDef) {
    super(scene, def.x, def.y, `pol_${def.id}_stand_down`, POL_ORIGIN, 'shadow_m',
      d => `pol_${def.id}_walk_${d}`, d => `pol_${def.id}_stand_${d}`, 62);
    this.stepEvery = 15;
    this.plate = scene.add.text(def.x, def.y + 7, def.name.toUpperCase(), {
      fontFamily: FONT, fontSize: '8px', color: '#2b1a10', backgroundColor: '#f4e3b1', padding: { x: 4, y: 3 },
    }).setOrigin(0.5, 0).setDepth(9000);
    this.plate.setPosition(Math.round(def.x), Math.round(def.y + 6));
    this.idle();
  }
  idle() { this.sprite.play(`pol_${this.def.id}_${this.def.idleAnim}`, true); this.sprite.anims.timeScale = 1; }
  talk() { this.sprite.play(`pol_${this.def.id}_talk`, true); }
  stand(d = this.dir) { this.dir = d; this.playStand(); }
  receiveBallot() {
    this.ballotIn = this.scene.add.image(this.x, this.y - 18, 'ballot').setOrigin(0.5, 1).setScale(0.55).setDepth(this.y + 1);
  }
  sync() {
    super.sync();
    if (this.plate) this.plate.setPosition(Math.round(this.x), Math.round(this.y + 6));
    this.ballotIn?.setPosition(Math.round(this.x), Math.round(this.y - 17)).setDepth(this.y + 1);
  }
  destroy() { super.destroy(); this.plate.destroy(); this.ballotIn?.destroy(); }
}
