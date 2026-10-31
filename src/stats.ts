// Contador de visitas privado (GoatCounter). Solo cuenta eventos, sin cookies ni datos personales.
export function stat(name: string) {
  try { (window as any).goatcounter?.count?.({ path: name, title: name, event: true }); } catch { /* sin contador: no pasa nada */ }
}
