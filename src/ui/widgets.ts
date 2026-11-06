import Phaser from 'phaser';
import { snd } from '../audio/sound';

export const FONT = '"Press Start 2P", monospace';
export const hexs = (n: number) => '#' + n.toString(16).padStart(6, '0');

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, size = 8, color = '#f4e3b1', align: 'center' | 'left' = 'center'): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, align, lineSpacing: Math.round(size * 0.6) });
  t.setOrigin(align === 'center' ? 0.5 : 0, 0);
  return t;
}
/** Texto estilo arcade con contorno y sombra. */
export function arcadeText(scene: Phaser.Scene, x: number, y: number, s: string, size: number, color = '#ffe14a', stroke = '#2b0a14'): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, stroke, strokeThickness: Math.max(3, Math.round(size / 3)), align: 'center' });
  t.setOrigin(0.5, 0.5);
  t.setShadow(0, Math.max(2, Math.round(size / 5)), '#000000', 0, true, true);
  return t;
}

/** Panel de madera con borde de píxel. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = 0x5b3a1e): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0x1b1424, 1); g.fillRect(0, 2, w, h - 4); g.fillRect(2, 0, w - 4, h);
  g.fillStyle(0xf4e3b1, 1); g.fillRect(2, 4, w - 4, h - 8); g.fillRect(4, 2, w - 8, h - 4);
  g.fillStyle(fill, 1); g.fillRect(4, 6, w - 8, h - 12); g.fillRect(6, 4, w - 12, h - 8);
  g.fillStyle(0xffffff, 0.12); g.fillRect(6, 6, w - 12, 3);
  g.fillStyle(0x000000, 0.18); g.fillRect(6, h - 9, w - 12, 3);
  return g;
}

export interface BtnColors { base: number; light: number; dark: number; text?: string }
export const GREEN: BtnColors = { base: 0x3f9a3a, light: 0x7edc62, dark: 0x1f5a22 };
export const RED: BtnColors = { base: 0xb8402f, light: 0xee7a62, dark: 0x6a1e1a };
export const GOLD: BtnColors = { base: 0xe0a82e, light: 0xffe27a, dark: 0x8a5a10, text: '#2b1a10' };
export const BLUE: BtnColors = { base: 0x3a6ec0, light: 0x7ab0f0, dark: 0x1c3a78 };

export interface PixelButton { c: Phaser.GameObjects.Container; setEnabled(b: boolean): void; destroy(): void }
/** Botón táctil grande con estética pixel art. onPress se dispara una sola vez (anti doble toque). */
export function pixelButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, col: BtnColors, onPress: () => void): PixelButton {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (down: boolean) => {
    g.clear();
    const o = down ? 2 : 0;
    g.fillStyle(0x1b1424, 1); g.fillRect(-w / 2, -h / 2 + 3, w, h - 3 + (down ? 0 : 3)); g.fillRect(-w / 2 + 2, -h / 2 + 1, w - 4, h + (down ? 0 : 4));
    g.fillStyle(col.dark, 1); g.fillRect(-w / 2 + 2, -h / 2 + 4 + o, w - 4, h - 6); g.fillRect(-w / 2 + 4, -h / 2 + 2 + o, w - 8, h - 2);
    g.fillStyle(col.base, 1); g.fillRect(-w / 2 + 4, -h / 2 + 4 + o, w - 8, h - 10); g.fillRect(-w / 2 + 6, -h / 2 + 2 + o, w - 12, h - 6);
    g.fillStyle(col.light, 1); g.fillRect(-w / 2 + 6, -h / 2 + 4 + o, w - 12, 2);
  };
  draw(false);
  const off = (label.split('\n').length - 1) * 7;      // etiquetas de 2 líneas: se centran
  const t = txt(scene, 0, -4 - off, label, 8, col.text ?? '#ffffff'); t.setShadow(0, 1, col.text ? '#fff3b0' : '#000000', 0, false, true);
  c.add([g, t]);
  const hit = scene.add.rectangle(0, 0, w + 4, h + 6, 0xffffff, 0.001).setScrollFactor(0).setInteractive({ useHandCursor: true });
  c.add(hit);
  let used = false, enabled = true;
  hit.on('pointerdown', () => { if (used || !enabled) return; draw(true); t.y = -2 - off; });
  hit.on('pointerout', () => { if (used) return; draw(false); t.y = -4 - off; });
  hit.on('pointerup', () => { if (used || !enabled) return; used = true; draw(true); t.y = -2 - off; snd.unlock(); snd.click(); onPress(); });
  return { c, setEnabled(b: boolean) { enabled = b; c.setAlpha(b ? 1 : 0.5); }, destroy() { c.destroy(); } };
}
