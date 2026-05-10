export const playClick = (
  ctx: AudioContext,
  startSec: number,
  accent: boolean,
  gain = 1,
) => {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = accent ? "triangle" : "square";
  const freq = accent ? 1760 : 1100;
  osc.frequency.setValueAtTime(freq, startSec);
  if (accent) {
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, startSec + 0.18);
  }
  const peak = (accent ? 0.55 : 0.35) * gain;
  const decaySec = accent ? 0.22 : 0.05;
  g.gain.setValueAtTime(0, startSec);
  g.gain.linearRampToValueAtTime(peak, startSec + 0.002);
  g.gain.exponentialRampToValueAtTime(0.001, startSec + decaySec);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(startSec);
  osc.stop(startSec + decaySec + 0.03);
};
