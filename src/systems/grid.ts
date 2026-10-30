import { CFG } from '../config/game';
import { FENCES, PROPS, DOOR, WORLD, FenceDef, PropDef, PATHS } from '../config/world';
import { PROP_META } from '../art';

export type Pt = [number, number];

/** Rejilla de colisiones (celdas de 8px) y pathfinding A* para los políticos y la gallina secundaria. */
export class Grid {
  cell = CFG.world.cell;
  cols = Math.ceil(WORLD.w / this.cell);
  rows = Math.ceil(WORLD.h / this.cell);
  blocked = new Uint8Array(this.cols * this.rows);
  inflated = new Uint8Array(this.cols * this.rows);

  blockRect(x0: number, y0: number, x1: number, y1: number) {
    const c = this.cell;
    for (let cy = Math.max(0, Math.floor(y0 / c)); cy <= Math.min(this.rows - 1, Math.floor((y1 - 0.01) / c)); cy++)
      for (let cx = Math.max(0, Math.floor(x0 / c)); cx <= Math.min(this.cols - 1, Math.floor((x1 - 0.01) / c)); cx++) this.blocked[cy * this.cols + cx] = 1;
  }
  blockFoot(x: number, y: number, fw: number, fh: number) { this.blockRect(x - fw / 2, y - fh, x + fw / 2, y); }

  build(extra: PropDef[] = []) {
    const m = 30;
    this.blockRect(0, 0, WORLD.w, m); this.blockRect(0, WORLD.h - 6, WORLD.w, WORLD.h); this.blockRect(0, 0, m, WORLD.h); this.blockRect(WORLD.w - m, 0, WORLD.w, WORLD.h);
    for (const p of [...PROPS, ...extra]) {
      const meta = PROP_META[p.k === 'feeder' ? 'feeder' : p.k];
      if (meta && meta.fw) this.blockFoot(p.x, p.y, meta.fw, meta.fh);
    }
    for (const f of FENCES) this.forFence(f, (x, y, v) => (v ? this.blockFoot(x, y, 8, 8) : this.blockFoot(x, y, 16, 6)));
    const door = PROP_META['door_0'];
    this.blockFoot(DOOR.x, DOOR.y, door.fw, door.fh);
    // inflado de 1 celda para que los caminantes no rocen los obstáculos
    const { cols, rows, blocked, inflated } = this;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      if (!blocked[y * cols + x]) continue;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < cols && yy < rows) inflated[yy * cols + xx] = 1; }
    }
  }
  forFence(f: FenceDef, cb: (x: number, y: number, vertical: boolean) => void) {
    if (f.y1 === f.y2) { for (let x = f.x1; x <= f.x2; x += 16) cb(x + 8, f.y1, false); }
    else for (let y = f.y1; y <= f.y2; y += 16) cb(f.x1, y, true);
  }

  isBlocked(x: number, y: number) {
    const cx = Math.floor(x / this.cell), cy = Math.floor(y / this.cell);
    if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) return true;
    return this.blocked[cy * this.cols + cx] === 1;
  }
  /** ¿La caja de pies (centro x,y; medias hw,hh) está libre? */
  boxFree(x: number, y: number, hw: number, hh: number) {
    return !this.isBlocked(x - hw, y - hh) && !this.isBlocked(x + hw, y - hh) && !this.isBlocked(x - hw, y + hh) && !this.isBlocked(x + hw, y + hh) && !this.isBlocked(x, y);
  }
  private freeI(cx: number, cy: number) { return cx >= 0 && cy >= 0 && cx < this.cols && cy < this.rows && !this.inflated[cy * this.cols + cx]; }

  private nearestFree(cx: number, cy: number): [number, number] | null {
    for (let r = 0; r < 14; r++)
      for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        if (this.freeI(cx + i, cy + j)) return [cx + i, cy + j];
      }
    return null;
  }

  findPath(sx: number, sy: number, gx: number, gy: number): Pt[] | null {
    const c = this.cell, cols = this.cols;
    const s = this.nearestFree(Math.floor(sx / c), Math.floor(sy / c));
    const g = this.nearestFree(Math.floor(gx / c), Math.floor(gy / c));
    if (!s || !g) return null;
    const N = cols * this.rows;
    const gScore = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const heap: [number, number][] = [];
    const push = (f: number, i: number) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
    const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
    const si = s[1] * cols + s[0], gi = g[1] * cols + g[0];
    gScore[si] = 0; push(0, si);
    const h = (i: number) => { const x = i % cols, y = (i / cols) | 0; const dx = Math.abs(x - g[0]), dy = Math.abs(y - g[1]); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
    let found = false;
    while (heap.length) {
      const [, cur] = pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (cur === gi) { found = true; break; }
      const cx = cur % cols, cy = (cur / cols) | 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        if (!i && !j) continue;
        const nx = cx + i, ny = cy + j;
        if (!this.freeI(nx, ny)) continue;
        if (i && j && (!this.freeI(cx + i, cy) || !this.freeI(cx, cy + j))) continue;
        const ni = ny * cols + nx;
        if (closed[ni]) continue;
        const t = gScore[cur] + (i && j ? 1.414 : 1);
        if (t < gScore[ni]) { gScore[ni] = t; came[ni] = cur; push(t + h(ni), ni); }
      }
    }
    if (!found) return null;
    const cells: Pt[] = [];
    for (let i = gi; i !== -1; i = came[i]) cells.push([(i % cols) * c + c / 2, ((i / cols) | 0) * c + c / 2]);
    cells.reverse();
    // suavizado por línea de visión
    const out: Pt[] = [cells[0]];
    let a = 0;
    while (a < cells.length - 1) {
      let b = cells.length - 1;
      while (b > a + 1 && !this.los(cells[a], cells[b])) b--;
      out.push(cells[b]); a = b;
    }
    // el destino exacto (si es alcanzable en línea recta desde el último punto libre)
    out[0] = [sx, sy];
    return out;
  }
  private los(a: Pt, b: Pt) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
    for (let k = 1; k < n; k++) {
      const x = a[0] + ((b[0] - a[0]) * k) / n, y = a[1] + ((b[1] - a[1]) * k) / n;
      const cx = Math.floor(x / this.cell), cy = Math.floor(y / this.cell);
      if (!this.freeI(cx, cy)) return false;
    }
    return true;
  }

  // ── red de caminos: los políticos caminan por los senderos de tierra ──
  private road?: { pts: Pt[]; adj: { to: number; w: number }[][] };
  private buildRoad() {
    const idx = new Map<string, number>(), pts: Pt[] = [], adj: { to: number; w: number }[][] = [];
    const node = (p: Pt) => { const k = p[0] + ',' + p[1]; let i = idx.get(k); if (i === undefined) { i = pts.length; idx.set(k, i); pts.push(p); adj.push([]); } return i; };
    for (const path of PATHS) for (let i = 0; i + 1 < path.pts.length; i++) {
      const a = node(path.pts[i]), b = node(path.pts[i + 1]), w = Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
      adj[a].push({ to: b, w }); adj[b].push({ to: a, w });
    }
    this.road = { pts, adj };
  }
  /** Ruta hacia (gx,gy): A* hasta el sendero más conveniente y después siguiendo los senderos. */
  roadPath(sx: number, sy: number, gx: number, gy: number): Pt[] | null {
    if (!this.road) this.buildRoad();
    const { pts, adj } = this.road!;
    let goal = 0, best = 1e9;
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - gx, p[1] - gy); if (d < best) { best = d; goal = i; } });
    const dist = new Float32Array(pts.length).fill(1e9), prev = new Int32Array(pts.length).fill(-1), done = new Uint8Array(pts.length);
    dist[goal] = 0;
    for (;;) {
      let u = -1, bd = 1e9;
      for (let i = 0; i < pts.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
      if (u < 0) break;
      done[u] = 1;
      for (const e of adj[u]) if (dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
    }
    const order = pts.map((p, i) => ({ i, c: Math.hypot(p[0] - sx, p[1] - sy) * 1.35 + dist[i] })).filter(o => o.c < 1e8).sort((a, b) => a.c - b.c).slice(0, 8);
    for (const { i } of order) {
      const head = this.findPath(sx, sy, pts[i][0], pts[i][1]);
      if (!head) continue;
      const out: Pt[] = [...head];
      for (let k = prev[i]; k !== -1; k = prev[k]) out.push(pts[k]);
      out.push([gx, gy]);
      return out;
    }
    return this.findPath(sx, sy, gx, gy);
  }
  /** Comprobación (depuración): tramos de camino bloqueados por obstáculos. */
  checkRoads(): string[] {
    this.buildRoad(); const bad: string[] = [];
    this.road!.pts.forEach((a, i) => this.road!.adj[i].forEach(e => { if (e.to > i && !this.los(a, this.road!.pts[e.to])) bad.push(`${a} -> ${this.road!.pts[e.to]}`); }));
    return bad;
  }
}
