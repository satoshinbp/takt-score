type AC = AudioContext;

const noise = (ctx: AC, t: number, dur: number, freq: number, q: number, g: number) => {
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const flt = ctx.createBiquadFilter();
  flt.type = "bandpass";
  flt.frequency.value = freq;
  flt.Q.value = q;
  const gn = ctx.createGain();
  src.connect(flt);
  flt.connect(gn);
  gn.connect(ctx.destination);
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.start(t);
  src.stop(t + dur);
}

const tone = (ctx: AC, t: number, dur: number, f0: number, f1: number | null, g: number) => {
  const osc = ctx.createOscillator();
  const gn = ctx.createGain();
  osc.connect(gn);
  gn.connect(ctx.destination);
  osc.frequency.setValueAtTime(f0, t);
  if (f1) osc.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
  gn.gain.setValueAtTime(g, t);
  gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}

export type SoundFn = (ctx: AC, t: number) => void;

export const SOUNDS: Partial<Record<string, SoundFn>> = {
  BD:      (c, t) => { tone(c, t, 0.35, 160, 42, 1.0); noise(c, t, 0.04, 200, 0.5, 0.3); },
  SNARE:   (c, t) => { noise(c, t, 0.17, 3200, 0.7, 0.9); tone(c, t, 0.1, 210, null, 0.5); },
  HH:      (c, t) => { noise(c, t, 0.052, 10000, 1.6, 0.65); },
  HH_OPEN: (c, t) => { noise(c, t, 0.32, 8000, 0.8, 0.55); },
  CRASH:   (c, t) => { noise(c, t, 0.65, 5000, 0.4, 0.7); noise(c, t, 0.65, 11000, 0.6, 0.4); },
  RIDE:    (c, t) => { noise(c, t, 0.22, 8000, 1.2, 0.45); tone(c, t, 0.16, 580, null, 0.22); },
  HI_TOM:  (c, t) => { tone(c, t, 0.18, 310, 95, 0.9); noise(c, t, 0.04, 800, 0.5, 0.2); },
  MID_TOM: (c, t) => { tone(c, t, 0.22, 230, 75, 0.9); noise(c, t, 0.04, 600, 0.5, 0.2); },
  LO_TOM:  (c, t) => { tone(c, t, 0.28, 140, 58, 1.0); noise(c, t, 0.05, 400, 0.5, 0.2); },
};
