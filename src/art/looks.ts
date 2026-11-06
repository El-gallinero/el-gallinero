// Aspecto (caricatura) de cada político. Clave = spriteId de config/politicians.ts
export interface Look {
  skin: string; hair: string; hairStyle: 'rufion' | 'irene' | 'feijoo' | 'sanxe' | 'abascal';
  hair2?: string;            // canas / mechas
  beard?: string; beardStyle?: 'short' | 'full';
  glasses?: boolean; jacket: string; shirt: string; tie?: string; pants: string; shoes: string;
  eye?: string; female?: boolean; earrings?: boolean; brow: string;
  noFace?: boolean;          // no usar el retrato de la hoja de referencia (personajes inventados)
}
export const LOOKS: Record<string, Look> = {
  rufion:  { skin: '#e3a97f', hair: '#5b3a2a', hair2: '#6d4632', hairStyle: 'rufion', beard: '#2b1d19', beardStyle: 'short', jacket: '#2b3048', shirt: '#f1f1f1', pants: '#1f2236', shoes: '#3a2418', brow: '#2b1d19' },
  irene:   { skin: '#ebbb9c', hair: '#4a2a2a', hair2: '#6a3a38', hairStyle: 'irene', eye: '#3a2214', jacket: '#8f43ad', shirt: '#f4f0ff', pants: '#2a2640', shoes: '#2a1a24', female: true, earrings: true, brow: '#3a2020' },
  feijoo:  { skin: '#e9b997', hair: '#a0703f', hair2: '#d0cbc0', hairStyle: 'feijoo', glasses: true, eye: '#5c7a96', jacket: '#2c52a0', shirt: '#f6f6f6', tie: '#3a78d0', pants: '#22345e', shoes: '#33241c', brow: '#6a5030' },
  sanxe:   { skin: '#d9a07a', hair: '#1f1a1f', hair2: '#7d7d88', hairStyle: 'sanxe', eye: '#2a1c14', jacket: '#22397a', shirt: '#f6f6f6', tie: '#d4202c', pants: '#1c2850', shoes: '#241812', brow: '#14101a' },
  abascal: { skin: '#dba27c', hair: '#3a3032', hairStyle: 'abascal', hair2: '#6a6666', beard: '#1c1616', beardStyle: 'full', jacket: '#5e6832', shirt: '#26242a', pants: '#3b3f26', shoes: '#2a1c14', brow: '#1c1616' },
  // presos inventados (no se parecen a nadie concreto): mono naranja
  pris_a:  { skin: '#e8b48c', hair: '#8a8a92', hair2: '#b8b8c0', hairStyle: 'sanxe', glasses: true, jacket: '#e07a1e', shirt: '#f08a2c', pants: '#c8651a', shoes: '#2a1a12', brow: '#6a6a72', noFace: true },
  pris_b:  { skin: '#d9a07a', hair: '#b8742e', hair2: '#d89a4e', hairStyle: 'rufion', beard: '#8a4a1e', beardStyle: 'short', jacket: '#e07a1e', shirt: '#f08a2c', pants: '#c8651a', shoes: '#2a1a12', brow: '#8a4a1e', noFace: true },
  pris_c:  { skin: '#efc3a3', hair: '#2a2024', hair2: '#6a6068', hairStyle: 'feijoo', jacket: '#e07a1e', shirt: '#f08a2c', pants: '#c8651a', shoes: '#2a1a12', brow: '#2a2024', noFace: true },
};
