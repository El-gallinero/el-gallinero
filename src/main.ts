import Phaser from 'phaser';
import '@fontsource/press-start-2p/latin-400.css';
import { GAME_W, GAME_H } from './config/game';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { GameScene } from './scenes/Game';
import { FoxScene } from './scenes/Fox';
import { ChoiceScene, EndingScene } from './scenes/Choice';
import { snd } from './audio/sound';
import { music } from './audio/music';

// Sin zoom ni gestos del navegador
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => { if ((e as TouchEvent).touches.length > 1) e.preventDefault(); }, { passive: false });

// Botón de sonido (pixel art en SVG)
const mute = document.getElementById('mute') as HTMLButtonElement;
const ICON_ON = `<svg viewBox="0 0 16 16"><path fill="#f4e3b1" d="M2 6h3l3-3h1v10H8l-3-3H2z"/><path fill="#f4e3b1" d="M11 5h1v1h-1zM12 6h1v4h-1zM11 10h1v1h-1zM13 4h1v1h-1zM14 5h1v6h-1zM13 11h1v1h-1z"/></svg>`;
const ICON_OFF = `<svg viewBox="0 0 16 16"><path fill="#f4e3b1" d="M2 6h3l3-3h1v10H8l-3-3H2z"/><path fill="#e0262d" d="M11 5h1v1h-1zM12 6h1v1h-1zM13 7h1v1h-1zM14 8h1v1h-1zM14 5h1v1h-1zM13 6h1v1h-1zM12 7h1v1h-1zM11 8h1v1h-1zM12 9h1v1h-1zM13 10h1v1h-1zM14 11h1v1h-1z"/></svg>`;
const paint = () => { mute.innerHTML = snd.muted ? ICON_OFF : ICON_ON; };
paint();
mute.addEventListener('pointerdown', e => { e.stopPropagation(); });
mute.addEventListener('click', e => { e.stopPropagation(); snd.unlock(); snd.setMuted(!snd.muted); music.resume(); paint(); });

// Desbloqueo de audio con el primer gesto (iOS / Android)
// iOS solo lo acepta en touchend/click; se mantiene escuchando por si el sistema interrumpe el audio (llamadas, bloqueo…)
const unlock = () => { snd.unlock(); music.resume(); };
for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true });

async function boot() {
  try { await Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 2500))]); } catch { /* */ }
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: GAME_W, height: GAME_H, backgroundColor: '#14101c',
    pixelArt: true, roundPixels: true, antialias: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3, touch: { capture: true } },
    disableContextMenu: true,
    audio: { noAudio: true },       // el audio va por nuestro propio Web Audio (src/audio)
    scene: [BootScene, TitleScene, GameScene, FoxScene, ChoiceScene, EndingScene],
  });
  (window as any).__game = game;
}
(window as any).__snd = snd;
boot();
