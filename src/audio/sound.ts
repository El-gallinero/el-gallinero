// Motor de audio 100% sintetizado con Web Audio (sin archivos, sin derechos).
// El contexto se crea/activa tras el primer gesto del usuario (requisito de iOS/Android).
type OscType = OscillatorType;
interface ToneOpts { f: number; f2?: number; dur: number; type?: OscType; vol?: number; delay?: number; attack?: number; lp?: number; vib?: number }
interface NoiseOpts { dur: number; vol?: number; type?: BiquadFilterType; f?: number; f2?: number; q?: number; delay?: number; attack?: number }

class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode; sfxBus!: GainNode; musBus!: GainNode;
  muted = false;
  private noiseBuf: AudioBuffer | null = null;
  private lastStep = 0;
  constructor() {
    try { this.muted = localStorage.getItem('gallinero_muted') === '1'; } catch { /* */ }
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else if (!this.muted) this.ctx.resume();
    });
  }
  /** Llamar dentro de un gesto del usuario. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = 0.9; this.sfxBus.connect(this.master);
      this.musBus = this.ctx.createGain(); this.musBus.gain.value = 0.42; this.musBus.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended' && !document.hidden) this.ctx.resume();
  }
  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem('gallinero_muted', m ? '1' : '0'); } catch { /* */ }
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }
  get ok() { return !!this.ctx && this.ctx.state === 'running' && !this.muted; }

  tone(o: ToneOpts) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type ?? 'square';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + o.dur);
    const v = o.vol ?? 0.15, a = o.attack ?? 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let node: AudioNode = osc;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(this.sfxBus);
    if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 6; lg.gain.value = o.f * 0.03 * o.vib; l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + o.dur + 0.05); }
    osc.start(t); osc.stop(t + o.dur + 0.05);
  }
  noise(o: NoiseOpts) {
    if (!this.ctx || this.muted || !this.noiseBuf) return;
    const c = this.ctx, t = c.currentTime + (o.delay ?? 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = o.type ?? 'bandpass'; f.frequency.setValueAtTime(o.f ?? 1000, t); f.Q.value = o.q ?? 1;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + o.dur);
    const g = c.createGain(), v = o.vol ?? 0.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack ?? 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t, Math.random() * 0.5); src.stop(t + o.dur + 0.05);
  }

  // ── efectos ────────────────────────────────────────────
  step() { const now = performance.now(); if (now - this.lastStep < 40) return; this.lastStep = now; this.tone({ f: 760 + Math.random() * 140, f2: 420, dur: 0.045, type: 'triangle', vol: 0.07 }); }
  polStep() { this.noise({ dur: 0.07, vol: 0.16, type: 'lowpass', f: 500, f2: 200 }); this.tone({ f: 110, f2: 55, dur: 0.07, type: 'sine', vol: 0.18 }); }
  cluck() { const b = 480 + Math.random() * 120; this.tone({ f: b, f2: b * 1.5, dur: 0.07, vol: 0.09 }); this.tone({ f: b * 1.4, f2: b * 0.8, dur: 0.11, vol: 0.09, delay: 0.07 }); this.tone({ f: b * 1.2, f2: b * 1.6, dur: 0.06, vol: 0.07, delay: 0.19 }); }
  blip() { this.tone({ f: 660, dur: 0.05, vol: 0.1 }); this.tone({ f: 990, dur: 0.07, vol: 0.1, delay: 0.05 }); }
  typeBlip(hi = 0) { this.tone({ f: 380 + hi * 60 + Math.random() * 90, dur: 0.025, vol: 0.045 }); }
  click() { this.tone({ f: 880, dur: 0.035, vol: 0.12 }); this.tone({ f: 1320, dur: 0.05, vol: 0.1, delay: 0.035 }); }
  back() { this.tone({ f: 520, f2: 330, dur: 0.08, vol: 0.12 }); }
  paper() { this.noise({ dur: 0.14, vol: 0.22, type: 'bandpass', f: 3400, f2: 1800, q: 0.8 }); this.noise({ dur: 0.1, vol: 0.12, type: 'highpass', f: 6000, delay: 0.03 }); }
  drop() { this.noise({ dur: 0.18, vol: 0.18, type: 'bandpass', f: 2600, f2: 900, q: 1.2 }); this.tone({ f: 200, f2: 90, dur: 0.1, type: 'sine', vol: 0.2, delay: 0.12 }); }
  vote() { [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, dur: 0.09, vol: 0.12, delay: i * 0.075 })); this.tone({ f: 1047, dur: 0.3, vol: 0.1, delay: 0.3, type: 'triangle' }); }
  knock() { this.tone({ f: 170, f2: 80, dur: 0.16, type: 'sine', vol: 0.55 }); this.tone({ f: 340, f2: 120, dur: 0.07, type: 'triangle', vol: 0.3 }); this.noise({ dur: 0.07, vol: 0.45, type: 'bandpass', f: 1100, f2: 500, q: 2 }); }
  creak(dur = 2) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), l = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(150, t + dur * 0.55); o.frequency.linearRampToValueAtTime(95, t + dur);
    l.frequency.value = 11; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1400, t + dur * 0.6); f.Q.value = 6;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.25); g.gain.setValueAtTime(0.22, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.sfxBus); o.start(t); l.start(t); o.stop(t + dur + 0.1); l.stop(t + dur + 0.1);
    this.tone({ f: 900, f2: 1500, dur: 0.5, type: 'sine', vol: 0.05, delay: 0.3, vib: 1 });
    this.tone({ f: 1300, f2: 800, dur: 0.6, type: 'sine', vol: 0.04, delay: 1.0, vib: 1 });
  }
  whoosh(dur = 0.7) { this.noise({ dur, vol: 0.3, type: 'bandpass', f: 250, f2: 2600, q: 0.7, attack: dur * 0.4 }); }
  sting() { [55, 58.3, 82].forEach(f => this.tone({ f, dur: 1.6, type: 'sawtooth', vol: 0.13, lp: 380, attack: 0.05 })); this.tone({ f: 110, f2: 70, dur: 0.9, type: 'sine', vol: 0.3 }); this.noise({ dur: 0.6, vol: 0.2, type: 'lowpass', f: 600, f2: 120 }); }
  laugh() {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const base = 200 - i * 5 + (i % 2) * 14;
      this.tone({ f: base * 1.25, f2: base * 0.86, dur: 0.12, type: 'sawtooth', vol: 0.2, delay: i * 0.17, lp: 1100, vib: 1 });
      this.tone({ f: base * 2.4, f2: base * 1.7, dur: 0.09, type: 'square', vol: 0.05, delay: i * 0.17 + 0.01, lp: 2400 });
      this.noise({ dur: 0.05, vol: 0.07, type: 'highpass', f: 3000, delay: i * 0.17 });
    }
  }
  bite() { this.noise({ dur: 0.09, vol: 0.4, type: 'highpass', f: 1800 }); this.tone({ f: 260, f2: 60, dur: 0.11, type: 'square', vol: 0.3 }); this.tone({ f: 90, dur: 0.14, type: 'sine', vol: 0.3, delay: 0.04 }); }
  chew() { this.noise({ dur: 0.12, vol: 0.28, type: 'lowpass', f: 900, f2: 300, q: 2 }); this.tone({ f: 150 + Math.random() * 40, f2: 70, dur: 0.1, type: 'sine', vol: 0.22 }); }
  gulp() { this.tone({ f: 320, f2: 70, dur: 0.28, type: 'sine', vol: 0.4 }); this.tone({ f: 200, f2: 120, dur: 0.1, type: 'triangle', vol: 0.2, delay: 0.3 }); }
  burp() { this.tone({ f: 95, f2: 55, dur: 0.55, type: 'sawtooth', vol: 0.28, lp: 450, vib: 2 }); this.noise({ dur: 0.5, vol: 0.12, type: 'lowpass', f: 500, f2: 150 }); }
  boing() { this.tone({ f: 180, f2: 700, dur: 0.12, type: 'sine', vol: 0.3 }); this.tone({ f: 700, f2: 220, dur: 0.3, type: 'sine', vol: 0.3, delay: 0.12, vib: 2 }); }
  scream() { this.tone({ f: 700, f2: 1300, dur: 0.25, type: 'sawtooth', vol: 0.12, lp: 2200, vib: 3 }); this.tone({ f: 1300, f2: 400, dur: 0.4, type: 'sawtooth', vol: 0.12, lp: 2200, vib: 3, delay: 0.25 }); }
  sparkle() { [1175, 1568, 1976, 2349].forEach((f, i) => this.tone({ f, dur: 0.1, type: 'triangle', vol: 0.07, delay: i * 0.05 })); }
  pop() { this.tone({ f: 700, f2: 180, dur: 0.09, type: 'sine', vol: 0.25 }); }
  slideWhistle() { this.tone({ f: 1500, f2: 300, dur: 0.45, type: 'sine', vol: 0.1, vib: 1 }); }
  jingleEnd() { [392, 330, 262, 196].forEach((f, i) => this.tone({ f, dur: 0.2, vol: 0.12, delay: i * 0.18, type: 'square', lp: 1800 })); }
}
export const snd = new Sound();
