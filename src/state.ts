// Estado de la sesión: políticos entregados al zorro, dónde reaparece la gallina y finales vistos.
export const fed = new Set<string>();
export const run: { last: [number, number] | null } = { last: null };
export const seenEndings = new Set<string>();
export const TOTAL_ENDINGS = 4;
export function resetRun() { fed.clear(); run.last = null; }
