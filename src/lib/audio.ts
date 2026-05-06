// 乱数ループはメインスレッドを詰まらせてスケジューラ遅延を招くため、初回生成後はキャッシュを使う
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
) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.frequency.setValueAtTime(f0, startSec);

  if (f1)
    osc.frequency.exponentialRampToValueAtTime(f1, startSec + durSec * 0.6);

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

export type SoundFn = (ctx: AudioContext, startSec: number) => void;

export const SOUNDS: Partial<Record<string, SoundFn>> = {
  BD: (ctx, startSec) => {
    tone(ctx, startSec, 0.35, 160, 42, 1.0);
    noise(ctx, startSec, 0.04, 200, 0.5, 0.3);
  },
  SNARE: (ctx, startSec) => {
    noise(ctx, startSec, 0.17, 3200, 0.7, 0.9);
    tone(ctx, startSec, 0.1, 210, null, 0.5);
  },
  HH: (ctx, startSec) => {
    noise(ctx, startSec, 0.052, 10000, 1.6, 0.65);
  },
  HH_OPEN: (ctx, startSec) => {
    noise(ctx, startSec, 0.32, 8000, 0.8, 0.55);
  },
  CRASH: (ctx, startSec) => {
    noise(ctx, startSec, 0.65, 5000, 0.4, 0.7);
    noise(ctx, startSec, 0.65, 11000, 0.6, 0.4);
  },
  RIDE: (ctx, startSec) => {
    noise(ctx, startSec, 0.22, 8000, 1.2, 0.45);
    tone(ctx, startSec, 0.16, 580, null, 0.22);
  },
  HI_TOM: (ctx, startSec) => {
    tone(ctx, startSec, 0.28, 280, 130, 0.85, 0.01);
    noise(ctx, startSec, 0.05, 600, 0.4, 0.12);
  },
  MID_TOM: (ctx, startSec) => {
    tone(ctx, startSec, 0.33, 210, 100, 0.85, 0.01);
    noise(ctx, startSec, 0.05, 450, 0.4, 0.12);
  },
  LO_TOM: (ctx, startSec) => {
    tone(ctx, startSec, 0.28, 140, 58, 1.0);
    noise(ctx, startSec, 0.05, 400, 0.5, 0.2);
  },
};
