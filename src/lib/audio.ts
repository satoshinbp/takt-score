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

// gain は強弱倍率。NORMAL=1.0、ACCENT=1.4、GHOST=0.35、grace note は更に 0.4 倍。
export type SoundFn = (
  ctx: AudioContext,
  startSec: number,
  gain: number,
) => void;

export const SOUNDS: Partial<Record<string, SoundFn>> = {
  // 短く締まったキック：高速ピッチドロップ + ビーターのクリック
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
  // ライド：インハーモニックな金属倍音でピン感、長いシマーで持続感
  RIDE: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.22, 2400, null, 0.18 * gain, 0.001);
    tone(ctx, startSec, 0.18, 3170, null, 0.13 * gain, 0.001);
    tone(ctx, startSec, 0.15, 4280, null, 0.09 * gain, 0.001);
    noise(ctx, startSec, 0.45, 7500, 1.4, 0.28 * gain);
    noise(ctx, startSec, 0.35, 11500, 1.8, 0.16 * gain);
  },
  // ハイタム：スティックのアタック + 基音と微デチューン倍音で胴鳴り
  HI_TOM: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.35, 320, 175, 0.9 * gain, 0.003);
    tone(ctx, startSec, 0.28, 478, 268, 0.28 * gain, 0.003);
    noise(ctx, startSec, 0.02, 2200, 0.8, 0.22 * gain);
    noise(ctx, startSec, 0.04, 700, 0.5, 0.1 * gain);
  },
  // ミッドタム：ハイタムより低く、胴鳴りをさらに長めに
  MID_TOM: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.42, 230, 125, 0.9 * gain, 0.003);
    tone(ctx, startSec, 0.34, 345, 190, 0.28 * gain, 0.003);
    noise(ctx, startSec, 0.02, 1800, 0.8, 0.2 * gain);
    noise(ctx, startSec, 0.04, 520, 0.5, 0.1 * gain);
  },
  // フロアタム：BDと差別化するため明確な音程感と長いサステイン
  LO_TOM: (ctx, startSec, gain) => {
    tone(ctx, startSec, 0.6, 88, 70, 1.0 * gain, 0.004);
    tone(ctx, startSec, 0.45, 132, 105, 0.35 * gain, 0.004);
    noise(ctx, startSec, 0.025, 1500, 0.7, 0.18 * gain);
    noise(ctx, startSec, 0.05, 350, 0.5, 0.1 * gain);
  },
};
