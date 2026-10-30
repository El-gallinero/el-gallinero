import { snd } from './sound';

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const hz = (n: string) => { const m = n.match(/^([A-G][#b]?)(\d)$/)!; return 440 * Math.pow(2, (NOTE[m[1]] + (parseInt(m[2]) + 1) * 12 - 69) / 12); };
interface Ev { s: number; n: string; d: number }
function parse(bars: string[]): Ev[] {
  const out: Ev[] = [];
  bars.forEach((bar, b) => { let s = b * 16; for (const tok of bar.trim().split(/\s+/)) { const [n, d] = tok.split(':'); const len = parseInt(d); if (n !== 'R') out.push({ s, n, d: len }); s += len; } });
  return out;
}

// ── Melodía del gallinero: polka rural, alegre y un pelín absurda ──
const FARM_MEL = parse([
  'C5:2 E5:2 G5:2 E5:2 C6:4 G5:4', 'A5:2 F5:2 A5:2 F5:2 C6:4 A5:4', 'G5:2 B5:2 D6:2 B5:2 G5:4 D5:4', 'E5:2 G5:2 E5:2 C5:2 G4:4 R:4',
  'E6:2 D6:2 C6:2 B5:2 C6:4 E6:4', 'F6:2 E6:2 D6:2 C6:2 D6:4 B5:4', 'C6:2 A5:2 F5:2 A5:2 G5:4 E5:4', 'D5:2 F5:2 G5:2 B5:2 C6:8',
]);
const FARM_ROOT = ['C3', 'F2', 'G2', 'C3', 'C3', 'F2', 'G2', 'C3'];
const FARM_CHORD: string[][] = [['E4', 'G4'], ['A4', 'C5'], ['B4', 'D5'], ['E4', 'G4'], ['E4', 'G4'], ['A4', 'C5'], ['B4', 'D5'], ['E4', 'G4']];
// ── Melodía del zorro: lenta, sigilosa, cómicamente siniestra ──
const FOX_MEL = parse([
  'A4:6 R:2 C5:4 B4:4', 'Ab4:6 R:2 E4:8', 'A4:6 R:2 C5:4 Eb5:4', 'E5:8 R:4 Eb5:2 D5:2',
  'F4:6 R:2 A4:4 G#4:4', 'E4:6 R:2 B4:8', 'A4:4 C5:4 E5:4 Eb5:4', 'A4:12 R:4',
]);
const FOX_BASS = [['A2', 0, 3], ['A2', 4, 2], ['Eb3', 8, 2], ['E3', 10, 2], ['A2', 12, 3]] as [string, number, number][];

class Music {
  private track: 'farm' | 'fox' | null = null;
  private step = 0; private next = 0; private timer: number | null = null;
  private drone: { o: OscillatorNode[]; g: GainNode } | null = null;

  play(t: 'farm' | 'fox' | null) {
    if (t === this.track) return;
    this.stop();
    this.track = t;
    if (!t || !snd.ctx) return;
    this.step = 0; this.next = snd.ctx.currentTime + 0.08;
    if (t === 'fox') this.startDrone();
    this.timer = window.setInterval(() => this.pump(), 50);
  }
  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.drone && snd.ctx) { const d = this.drone; d.g.gain.setTargetAtTime(0, snd.ctx.currentTime, 0.2); d.o.forEach(o => { try { o.stop(snd.ctx!.currentTime + 1); } catch { /* */ } }); this.drone = null; }
    this.track = null;
  }
  /** Reintenta tras desbloquear audio. */
  resume() { if (this.track && !this.timer && snd.ctx) { const t = this.track; this.track = null; this.play(t); } }

  private pump() {
    const c = snd.ctx; if (!c || !this.track) return;
    const dur = this.track === 'farm' ? 60 / 126 / 4 : 60 / 78 / 4;
    if (this.next < c.currentTime - 0.5) this.next = c.currentTime + 0.05;
    while (this.next < c.currentTime + 0.25) { this.sched(this.step, this.next - c.currentTime); this.step = (this.step + 1) % 128; this.next += dur; }
  }
  private v(f: number, d: number, type: OscillatorType, vol: number, delay: number, lp?: number, vib?: number) {
    if (!snd.ctx || snd.muted) return;
    const c = snd.ctx, t = c.currentTime + Math.max(0, delay);
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.setTargetAtTime(0.0001, t + d * 0.7, d * 0.18 + 0.01);
    let n: AudioNode = o;
    if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); n = fl; }
    n.connect(g); g.connect(snd.musBus);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + d + 0.3); }
    o.start(t); o.stop(t + d + 0.3);
  }
  private perc(delay: number, kind: 'kick' | 'snare' | 'hat') {
    if (!snd.ctx || snd.muted) return;
    const c = snd.ctx, t = c.currentTime + Math.max(0, delay);
    if (kind === 'kick') {
      const o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
      g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); o.connect(g); g.connect(snd.musBus); o.start(t); o.stop(t + 0.15);
    } else {
      const len = Math.floor(c.sampleRate * 0.1), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b;
      f.type = kind === 'snare' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 'snare' ? 1800 : 7000;
      g.gain.setValueAtTime(kind === 'snare' ? 0.3 : 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'snare' ? 0.09 : 0.04));
      s.connect(f); f.connect(g); g.connect(snd.musBus); s.start(t); s.stop(t + 0.12);
    }
  }
  private sched(step: number, delay: number) {
    const bar = Math.floor(step / 16), s = step % 16;
    const sd = this.track === 'farm' ? 60 / 126 / 4 : 60 / 78 / 4;
    if (this.track === 'farm') {
      for (const e of FARM_MEL) if (e.s === step) this.v(hz(e.n), e.d * sd, 'square', 0.12, delay, 2600);
      if (s === 0 || s === 8) { this.v(hz(FARM_ROOT[bar]), sd * 3, 'triangle', 0.5, delay); this.perc(delay, 'kick'); }
      if (s === 4 || s === 12) { for (const n of FARM_CHORD[bar]) this.v(hz(n), sd * 2, 'square', 0.05, delay, 1800); this.perc(delay, 'snare'); }
      if (s % 2 === 0) this.perc(delay, 'hat');
      // pequeños gags absurdos: un cacareo y un silbato resbaladizo
      if (bar === 3 && s === 12) { this.v(900, sd * 1, 'square', 0.1, delay); this.v(1300, sd * 1, 'square', 0.1, delay + sd); this.v(800, sd * 1.5, 'square', 0.1, delay + sd * 2); }
      if (bar === 7 && s === 12) for (let i = 0; i < 4; i++) this.v(1500 - i * 260, sd, 'sine', 0.1, delay + i * sd, undefined, 1);
    } else if (this.track === 'fox') {
      for (const e of FOX_MEL) if (e.s === step) this.v(hz(e.n), e.d * sd, 'triangle', 0.22, delay, 1800, 1);
      for (const [n, st, d] of FOX_BASS) if (s === st) this.v(hz(n), d * sd, 'sawtooth', 0.22, delay, 320);
      if (s === 0 && bar % 2 === 0) this.perc(delay, 'kick');
      if (s % 8 === 6) this.v(1760 + (bar % 3) * 220, sd * 0.6, 'square', 0.035, delay, 3200);      // pizzicato
      if (bar === 5 && s === 10) { this.v(110, sd * 2, 'sawtooth', 0.2, delay, 400); this.v(116.5, sd * 2, 'sawtooth', 0.2, delay, 400); }
    }
  }
  private startDrone() {
    const c = snd.ctx!; const g = c.createGain(); g.gain.value = 0; g.gain.setTargetAtTime(0.1, c.currentTime, 0.8); g.connect(snd.musBus);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.connect(g);
    const o = [55, 82.4, 58.3].map(fr => { const x = c.createOscillator(); x.type = 'sawtooth'; x.frequency.value = fr; x.connect(f); x.start(); return x; });
    this.drone = { o, g };
  }
}
export const music = new Music();
