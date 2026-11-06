import { sc } from './world';
// ─────────────────────────────────────────────────────────────────────────────
// Configuración de los políticos. TODO lo editable de cada personaje está aquí:
// nombre, frase, sprite, posición en el mapa, velocidad y reacción del zorro.
// Textos humorísticos y PROVISIONALES. Es una fábula satírica de ficción.
//
// reaction (zorro):  'A' = carcajada · 'B' = devora la papeleta · 'C' = devora papeleta y político
// ─────────────────────────────────────────────────────────────────────────────
export type FoxReaction = 'A' | 'B' | 'C';

export interface PoliticianDef {
  id: string;
  name: string;            // nombre visible en el juego
  line: string;            // frase electoral
  spriteId: string;        // clave de sprite (ver src/art/looks.ts)
  x: number; y: number;    // posición (pies) en el mapa
  speed: number;           // px/s al caminar hacia la puerta
  idleAnim: string;        // animación de espera
  reaction: FoxReaction;   // reacción asignada del zorro (nunca aleatoria)
  urnColor: number;        // color de la etiqueta de la urna
  urnMark: string;         // marca de la etiqueta (letras/símbolo)
}

export const POLITICIANS: PoliticianDef[] = [
  { id: 'rufion', name: 'Gallo Rufian', line: '¡Tengo la solución para este fachinero!',
    spriteId: 'rufion', x: sc(1010), y: sc(750), speed: 126, idleAnim: 'idle', reaction: 'A', urnColor: 0xe8e8ee, urnMark: '' },
  { id: 'irene', name: 'Irene Monclueca', line: '¡Gallineros y libertad para todas!',
    spriteId: 'irene', x: sc(240), y: sc(1440), speed: 126, idleAnim: 'idle', reaction: 'B', urnColor: 0x7d3fa8, urnMark: 'F' },
  { id: 'feijoo', name: 'Alberto Frijol', line: '¡Huevos, tierra e liberdade!',
    spriteId: 'feijoo', x: sc(1010), y: sc(1690), speed: 126, idleAnim: 'idle', reaction: 'A', urnColor: 0x2d6cc0, urnMark: 'PP' },
  { id: 'sanxe', name: 'Huevo Sanchez', line: '¡No podemos dejar gallinar a la ultraderecha!',
    spriteId: 'sanxe', x: sc(1020), y: sc(1250), speed: 126, idleAnim: 'idle', reaction: 'C', urnColor: 0xd8242c, urnMark: 'PS' },
  { id: 'abascal', name: 'Pollascal', line: '¡Este gallinero se defiende con dos huevos!',
    spriteId: 'abascal', x: sc(260), y: sc(900), speed: 126, idleAnim: 'idle', reaction: 'B', urnColor: 0x5fa83a, urnMark: 'VX' },
];

// Presos de la parodia: personajes INVENTADOS (no se parecen a nadie concreto), en jaulas junto al camino.
export interface PrisonerDef { id: string; name: string; x: number; y: number }
export const PRISONERS: PrisonerDef[] = [
  { id: 'pris_a', name: 'Tesorero Cacareo', x: sc(570), y: sc(1870) },
  { id: 'pris_b', name: 'Concejal Huevos', x: sc(810), y: sc(1450) },
  { id: 'pris_c', name: 'Alcalde Sobres', x: sc(560), y: sc(780) },
];
