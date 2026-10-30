// Constantes generales del juego. Todo lo "tocable" vive aquí o en politicians.ts / dialogs.ts.
const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

export const GAME_W = 216;          // ancho lógico fijo
const ASPECT = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerHeight / window.innerWidth : 384 / 216;
/** Alto lógico: se adapta a la pantalla del móvil (entre 9:16 y ~9:21) para que llene todo el ancho y alto. */
export const GAME_H = Math.min(480, Math.max(384, Math.round(GAME_W * ASPECT)));
export const DEBUG = q.has('debug');

export const CFG = {
  world: { w: 922, h: 1613, cell: 8 },
  player: { speed: 74, accel: 900, footHW: 6, footHH: 3, stepEvery: 15 },
  proximity: 46,                    // radio de interacción con un político (px)
  proximityReset: 74,               // hay que alejarse esto para reactivar un diálogo tras "NO"
  npcDelaySec: Number(q.get('npc') ?? 18),   // gallina que presiona a votar
  typeMsPerChar: 26,
  camLerp: 0.1,
  fadeMs: 700,
  // cinemática
  door: { knockGapMs: 620, pauseAfterKnockMs: 1100, openMs: 2000 },
};

export const COLORS = {
  ink: 0x1b1424, cream: 0xf4e3b1, wood: 0x7a4a24, woodDark: 0x4a2a14, red: 0xd8242c,
};
