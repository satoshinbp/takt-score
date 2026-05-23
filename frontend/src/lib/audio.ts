// Random-fill loops stall the main thread and cause scheduler delays, so reuse a cached buffer after the first build.
const noiseBufferCache = new Map<string, AudioBuffer>();

const getNoiseBuffer = (ctx: AudioContext, durSec: number): AudioBuffer => {
  const key = `${ctx.sampleRate}-${durSec}`;
  let buf = noiseBufferCache.get(key);
  if (!buf) {
    const len = Math.ceil(ctx.sampleRate * durSec);
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBufferCache.set(key, buf);
  }
  return buf;
};

const noise = (
  ctx: AudioContext,
  startSec: number,
  durSec: number,
  freq: number,
  q: number,
  gain: number,
) => {
  const source = ctx.createBufferSource();
  source.buffer = getNoiseBuffer(ctx, durSec);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gainNode = ctx.createGain();
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.gain.setValueAtTime(gain, startSec);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startSec + durSec);
  source.start(startSec);
  source.stop(startSec + durSec);
};

const tone = (
  ctx: AudioContext,
  startSec: number,
  durSec: number,
  f0: number,
  f1: number | null,
  gain: number,
  atk = 0,
  type: OscillatorType = "sine",
  // Relative position (fraction of durSec) at which the pitch drop completes. Smaller = quicker drop.
  rampRatio = 0.6,
) => {
  const osc = ctx.createOscillator();
  osc.type = type;
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.frequency.setValueAtTime(f0, startSec);

  if (f1)
    osc.frequency.exponentialRampToValueAtTime(
      f1,
      startSec + durSec * rampRatio,
    );

  if (atk > 0) {
    gainNode.gain.setValueAtTime(0.0001, startSec);
    gainNode.gain.linearRampToValueAtTime(gain, startSec + atk);
  } else {
    gainNode.gain.setValueAtTime(gain, startSec);
  }
  gainNode.gain.exponentialRampToValueAtTime(0.001, startSec + durSec);
  osc.start(startSec);
  osc.stop(startSec + durSec);
};

// gain is the velocity multiplier. NORMAL=1.0, ACCENT=1.4, GHOST=0.35; grace notes get an additional 0.4× on top.
export type SoundFn = (
  ctx: AudioContext,
  startSec: number,
  gain: number,
) => void;

export const SOUNDS: Partial<Record<string, SoundFn>> = {
  // Tight, punchy kick: fast pitch drop + beater click.
  BD: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.18, 120, 38, 1.0 * gain);
    tone(ctx, startSec, 0.025, 1800, 90, 0.35 * gain);
    noise(ctx, startSec, 0.012, 3500, 1.0, 0.22 * gain);
  },
  SNARE: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.17, 3200, 0.7, 0.9 * gain);
    tone(ctx, startSec, 0.1, 210, null, 0.5 * gain);
  },
  HH: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.052, 10000, 1.6, 0.65 * gain);
  },
  HH_OPEN: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.32, 8000, 0.8, 0.55 * gain);
  },
  CRASH: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.65, 5000, 0.4, 0.7 * gain);
    noise(ctx, startSec, 0.65, 11000, 0.6, 0.4 * gain);
  },
  // Ride: inharmonic metallic partials give the ping, with a long shimmer for sustain.
  RIDE: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.22, 2400, null, 0.18 * gain, 0.001);
    tone(ctx, startSec, 0.18, 3170, null, 0.13 * gain, 0.001);
    tone(ctx, startSec, 0.15, 4280, null, 0.09 * gain, 0.001);
    noise(ctx, startSec, 0.45, 7500, 1.4, 0.28 * gain);
    noise(ctx, startSec, 0.35, 11500, 1.8, 0.16 * gain);
  },
  // High tom: high-Q noise models the head's main mode, triangle wave adds subtle pitch, immediate pitch drop kills the sweep feel.
  HI_TOM: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.22, 380, 6, 0.45 * gain);
    noise(ctx, startSec, 0.14, 600, 2.5, 0.18 * gain);
    tone(ctx, startSec, 0.16, 380, 200, 0.35 * gain, 0.001, "triangle", 0.08);
    noise(ctx, startSec, 0.025, 1500, 0.4, 0.4 * gain);
    noise(ctx, startSec, 0.008, 4500, 0.5, 0.3 * gain);
  },
  // Mid tom: same structure as HI_TOM but in a lower frequency band.
  MID_TOM: (ctx, startSec, gain) => {
    noise(ctx, startSec, 0.26, 260, 6, 0.45 * gain);
    noise(ctx, startSec, 0.18, 420, 2.5, 0.18 * gain);
    tone(ctx, startSec, 0.2, 260, 140, 0.35 * gain, 0.001, "triangle", 0.08);
    noise(ctx, startSec, 0.025, 1200, 0.4, 0.4 * gain);
    noise(ctx, startSec, 0.008, 4200, 0.5, 0.28 * gain);
  },
  // Floor tom: distinct pitch and long sustain to differentiate it from the BD.
  LO_TOM: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.6, 88, 70, 1.0 * gain, 0.004);
    tone(ctx, startSec, 0.45, 132, 105, 0.35 * gain, 0.004);
    noise(ctx, startSec, 0.025, 1500, 0.7, 0.18 * gain);
    noise(ctx, startSec, 0.05, 350, 0.5, 0.1 * gain);
  },
};
