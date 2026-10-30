// Diseño del mapa del gallinero (un único mundo continuo). Coordenadas en px del mundo (1280×2240).
export type Pt = [number, number];
/** El mapa se diseñó a 1280×2240; WORLD_SCALE lo reduce sin tocar las coordenadas de diseño. */
export const WORLD_SCALE = 0.72;
export const sc = (n: number) => Math.round(n * WORLD_SCALE);
const sf = (n: number) => Math.round((n * WORLD_SCALE) / 16) * 16;
export const WORLD = { w: sc(1280), h: sc(2240) };
const START_RAW = { x: 250, y: 2090 };
/** Base (suelo) de la caseta de la puerta y punto donde el político se detiene a llamar. */
const DOOR_RAW = { x: 640, y: 168, knockX: 640, knockY: 192 };

export interface PathDef { pts: Pt[]; r: number }
const PATHS_RAW: PathDef[] = [
  { r: 22, pts: [[250, 2090], [420, 2100], [560, 2040], [640, 1940], [660, 1800], [610, 1690], [600, 1560], [680, 1440], [740, 1320], [690, 1190], [650, 1060], [610, 930], [650, 800], [700, 670], [650, 540], [640, 420], [640, 300], [640, 190]] },
  // ramas hacia cada político
  { r: 19, pts: [[660, 1800], [800, 1785], [920, 1735], [1010, 1700]] },     // Rufión
  { r: 19, pts: [[600, 1560], [460, 1545], [330, 1500], [245, 1450]] },       // Irene
  { r: 19, pts: [[740, 1320], [880, 1330], [1000, 1280], [1020, 1262]] },     // Feijóo
  { r: 19, pts: [[650, 1060], [500, 985], [380, 935], [265, 910]] },          // Perro Sanxe
  { r: 19, pts: [[700, 670], [850, 720], [1000, 760]] },                      // Abascal
  // rincones con personalidad
  { r: 17, pts: [[690, 1190], [560, 1205], [440, 1225]] },                    // barrizal
  { r: 17, pts: [[610, 930], [760, 955], [900, 1000], [975, 1060]] },         // pajar
  { r: 17, pts: [[640, 420], [500, 390], [370, 350], [290, 320]] },           // gallinero viejo
  { r: 17, pts: [[650, 540], [800, 470], [950, 400], [1030, 350]] },          // huerto
  { r: 17, pts: [[640, 1940], [820, 1960], [1000, 1900], [1100, 1840]] },     // abrevadero
  { r: 17, pts: [[560, 2040], [560, 2150], [700, 2190]] },                    // rincón sur
];

/** Vallas (segmentos horizontales o verticales alineados a 16px). */
export interface FenceDef { x1: number; y1: number; x2: number; y2: number; dark?: boolean }
const FENCES_RAW: FenceDef[] = [
  // corral de inicio (con salida al este)
  { x1: 96, y1: 1968, x2: 464, y2: 1968 }, { x1: 96, y1: 2224, x2: 464, y2: 2224 }, { x1: 96, y1: 1968, x2: 96, y2: 2224 },
  { x1: 464, y1: 1968, x2: 464, y2: 2048 }, { x1: 464, y1: 2128, x2: 464, y2: 2224 },
  // verja ante la puerta misteriosa (hueco en el centro)
  { x1: 416, y1: 336, x2: 592, y2: 336, dark: true }, { x1: 688, y1: 336, x2: 864, y2: 336, dark: true },
  // corral de Rufión
  { x1: 880, y1: 1624, x2: 1200, y2: 1624 }, { x1: 1200, y1: 1624, x2: 1200, y2: 1800 },
  // huerto de Irene
  { x1: 64, y1: 1520, x2: 176, y2: 1520 }, { x1: 64, y1: 1360, x2: 64, y2: 1520 },
  // pajar
  { x1: 880, y1: 1100, x2: 1040, y2: 1100 }, { x1: 1040, y1: 940, x2: 1040, y2: 1100 },
  // corral de Perro Sanxe
  { x1: 144, y1: 960, x2: 336, y2: 960 },
  // lindes de Abascal
  { x1: 960, y1: 800, x2: 1136, y2: 800 },
  // cercados sueltos
  { x1: 800, y1: 1530, x2: 800, y2: 1650 }, { x1: 336, y1: 1100, x2: 496, y2: 1100 },
];

export type PropKind = 'tree' | 'tree2' | 'deadtree' | 'bush' | 'bush2' | 'rock' | 'hay' | 'haystack' | 'trough' | 'feeder' | 'barrel' | 'crate' | 'scarecrow'
  | 'coop' | 'coopBig' | 'coopOld' | 'horreo' | 'sign';
export interface PropDef { k: PropKind; x: number; y: number; flip?: boolean }
const PROPS_RAW: PropDef[] = [
  // inicio (zona tranquila)
  { k: 'coop', x: 170, y: 2060 }, { k: 'hay', x: 330, y: 2000 }, { k: 'barrel', x: 150, y: 2180 }, { k: 'bush2', x: 400, y: 2180 }, { k: 'feeder', x: 300, y: 2190 },
  { k: 'sign', x: 420, y: 2040 }, { k: 'hay', x: 130, y: 1990 }, { k: 'bush', x: 250, y: 1990 },
  // Rufión (comederos)
  { k: 'feeder', x: 1110, y: 1700 }, { k: 'feeder', x: 1100, y: 1760 }, { k: 'hay', x: 930, y: 1668 }, { k: 'barrel', x: 1160, y: 1665 }, { k: 'crate', x: 1170, y: 1790 }, { k: 'tree2', x: 1160, y: 1860 },
  // Irene (gallineritos y huerto)
  { k: 'coop', x: 120, y: 1440 }, { k: 'coop', x: 150, y: 1560 }, { k: 'bush2', x: 300, y: 1400 }, { k: 'bush2', x: 330, y: 1560 }, { k: 'hay', x: 110, y: 1330 }, { k: 'trough', x: 420, y: 1480, },
  // Feijóo (hórreo y bebedero)
  { k: 'horreo', x: 1150, y: 1230 }, { k: 'trough', x: 1060, y: 1340 }, { k: 'barrel', x: 930, y: 1250 }, { k: 'bush', x: 950, y: 1395 }, { k: 'tree', x: 1210, y: 1340 },
  // Perro Sanxe (gran gallinero presidencial)
  { k: 'coopBig', x: 120, y: 870 }, { k: 'bush2', x: 360, y: 880 }, { k: 'barrel', x: 330, y: 960 }, { k: 'crate', x: 200, y: 990 }, { k: 'sign', x: 400, y: 890 },
  // Abascal (balas de paja y barricada)
  { k: 'haystack', x: 1130, y: 730 }, { k: 'hay', x: 1090, y: 790 }, { k: 'hay', x: 1160, y: 790 }, { k: 'crate', x: 945, y: 815 }, { k: 'barrel', x: 880, y: 690 }, { k: 'tree', x: 1200, y: 640 },
  // rincón del barro
  { k: 'rock', x: 380, y: 1180 }, { k: 'bush', x: 350, y: 1260 }, { k: 'trough', x: 470, y: 1180 },
  // pajar
  { k: 'haystack', x: 1020, y: 1090 }, { k: 'haystack', x: 1050, y: 1030 }, { k: 'hay', x: 900, y: 940 }, { k: 'hay', x: 1000, y: 960 },
  // gallinero viejo
  { k: 'coopOld', x: 215, y: 330 }, { k: 'barrel', x: 350, y: 400 }, { k: 'bush', x: 200, y: 400 },
  // huerto y espantapájaros
  { k: 'hay', x: 900, y: 330 }, { k: 'bush2', x: 1100, y: 400 }, { k: 'bush2', x: 1040, y: 300 },
  // abrevadero
  { k: 'trough', x: 1050, y: 1960 }, { k: 'tree2', x: 920, y: 1870 }, { k: 'bush', x: 760, y: 2020 }, { k: 'rock', x: 1100, y: 1920 },
  // rincón sur
  { k: 'tree', x: 760, y: 2150 }, { k: 'bush2', x: 480, y: 2170 }, { k: 'hay', x: 610, y: 2110 },
  // carteles en cruces
  { k: 'sign', x: 700, y: 1830 }, { k: 'sign', x: 560, y: 1590 }, { k: 'sign', x: 710, y: 1100 },
  // zona de la puerta (siniestra)
  { k: 'deadtree', x: 500, y: 250 }, { k: 'deadtree', x: 790, y: 240 }, { k: 'deadtree', x: 430, y: 330 }, { k: 'deadtree', x: 850, y: 330 },
  { k: 'rock', x: 560, y: 300 }, { k: 'rock', x: 720, y: 295 },
];

/** Zonas de barro y charcos (decorativo, no bloquea). */
const MUD_RAW: { x: number; y: number; rx: number; ry: number }[] = [
  { x: 405, y: 1235, rx: 70, ry: 46 }, { x: 150, y: 905, rx: 50, ry: 30 }, { x: 910, y: 1700, rx: 34, ry: 22 }, { x: 330, y: 1560, rx: 36, ry: 20 }, { x: 760, y: 2110, rx: 44, ry: 24 },
];
/** Zonas de paja en el suelo. */
const STRAW_RAW: { x: number; y: number; rx: number; ry: number }[] = [
  { x: 170, y: 2090, rx: 70, ry: 40 }, { x: 125, y: 1470, rx: 60, ry: 56 }, { x: 125, y: 890, rx: 80, ry: 42 }, { x: 1110, y: 740, rx: 64, ry: 40 }, { x: 980, y: 1040, rx: 60, ry: 40 },
];

/** Decorado extra generado con semilla fija (rellena los huecos entre caminos y zonas). Se calcula en el cliente. */
export const SCATTER = { seed: 424242, count: 120, minPathDist: 34, minOther: 46 };

export const START = { x: sc(START_RAW.x), y: sc(START_RAW.y) };
export const DOOR = { x: sc(DOOR_RAW.x), y: sc(DOOR_RAW.y), knockX: sc(DOOR_RAW.knockX), knockY: sc(DOOR_RAW.knockY) };
export const PATHS: PathDef[] = PATHS_RAW.map(p => ({ r: p.r, pts: p.pts.map(([x, y]) => [sc(x), sc(y)] as Pt) }));
export const FENCES: FenceDef[] = FENCES_RAW.map(f => ({ ...f, x1: sf(f.x1), y1: sf(f.y1), x2: sf(f.x2), y2: sf(f.y2) }));
export const PROPS: PropDef[] = PROPS_RAW.map(p => ({ ...p, x: sc(p.x), y: sc(p.y) }));
export const MUD = MUD_RAW.map(m => ({ x: sc(m.x), y: sc(m.y), rx: m.rx, ry: m.ry }));
export const STRAW = STRAW_RAW.map(m => ({ x: sc(m.x), y: sc(m.y), rx: m.rx, ry: m.ry }));
