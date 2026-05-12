"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { playClick } from "@/lib/metronome-audio";

export type InnerTaktCfg = {
  bpm: number;
  beatsPerBar: number;
  accentEvery: number;
  audibleBars: number;
  silentBars: number;
  fadeBeats: number;
};

export type Tap = {
  deviationMs: number;
  globalBeatIndex: number;
  timeSec: number;
};

type Phase = { silent: boolean; fade: number };
type ScheduledBeat = { globalBeatIndex: number; timeSec: number };

// AudioContext での発音予約は正確だが、JavaScript の setTimeout には揺らぎがある．
// 揺らぎより長い「先読み窓」の中に常にビートを詰めておけば，音は途切れない．
const SCHEDULE_AHEAD_SEC = 0.15;
// スケジューラを呼び出す間隔（この間隔ごとに先読み窓を埋めにいく）
const SCHEDULER_TICK_MS = 20;
// 直近のビート予約を保持する最大数（タップ判定と RAF 表示で参照される）
const RING_MAX = 64;

// ============================================================================
// 純粋関数群（副作用なし・状態に依存しない）
// ============================================================================

// 1サイクル = audibleBars(音あり) + silentBars(無音) の繰り返し．
// 与えたビートが「音を鳴らす／鳴らさない」と，そのフェード強度(0〜1)を返す．
const phaseAt = (globalBeatIndex: number, c: InnerTaktCfg): Phase => {
  const totalBeats = (c.audibleBars + c.silentBars) * c.beatsPerBar;
  const pos = ((globalBeatIndex % totalBeats) + totalBeats) % totalBeats;
  const audibleBeats = c.audibleBars * c.beatsPerBar;

  // 可聴区間: 末尾 fadeBeats 拍で fade を 1 → 0 へ徐々に減衰
  if (pos < audibleBeats) {
    if (c.fadeBeats > 0 && pos >= audibleBeats - c.fadeBeats) {
      return { silent: false, fade: (audibleBeats - pos) / c.fadeBeats };
    }
    return { silent: false, fade: 1 };
  }
  // 無音区間: 末尾 fadeBeats 拍で fade を 0 → 1 へ復帰（次サイクルへの繋ぎ）
  const silentPos = pos - audibleBeats;
  const silentTotal = c.silentBars * c.beatsPerBar;
  if (c.fadeBeats > 0 && silentPos >= silentTotal - c.fadeBeats) {
    return {
      silent: false,
      fade: 1 - (silentTotal - silentPos) / c.fadeBeats,
    };
  }
  return { silent: true, fade: 0 };
};

// ブラウザは初回ユーザー操作後でないと音を出せない（自動再生ポリシー）．
// suspended になっていれば resume を呼んでから返す．
const ensureAudioCtx = (existing: AudioContext | null): AudioContext => {
  if (existing) {
    if (existing.state === "suspended") void existing.resume();
    return existing;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  return new Ctor();
};

// RAF ループから「今鳴っているはずのビート」を求める．
// リングは時刻順に並んでいるので，末尾から走査して最初に now 以下を見つけたら確定．
const findActiveBeat = (
  now: number,
  ring: ScheduledBeat[],
): ScheduledBeat | null => {
  for (let i = ring.length - 1; i >= 0; i--) {
    if (ring[i].timeSec <= now) return ring[i];
  }
  return null;
};

// タップ時刻に最も近いビートを探す．
// 過去〜現在のリングに加え「まだ予約されていない次のビート」も候補に含めるのは，
// タップが次ビートぎりぎりに来た場合に「次ビート基準でやや早い」と正しく判定するため．
const findNearestBeat = (
  now: number,
  ring: ScheduledBeat[],
  projected: ScheduledBeat,
): { beat: ScheduledBeat; diffSec: number } | null => {
  let nearest: ScheduledBeat | null = null;
  let minDiff = Infinity;
  for (const bt of ring) {
    const d = Math.abs(now - bt.timeSec);
    if (d < minDiff) {
      minDiff = d;
      nearest = bt;
    }
  }
  const projDiff = Math.abs(now - projected.timeSec);
  if (projDiff < minDiff) {
    minDiff = projDiff;
    nearest = projected;
  }
  return nearest ? { beat: nearest, diffSec: minDiff } : null;
};

// ステータス表示用: 現在地がサイクル内のどこか（可聴 or 無音，相対位置，区間長）
const calcCycleProgress = (beatIndex: number, c: InnerTaktCfg) => {
  const totalBeats = (c.audibleBars + c.silentBars) * c.beatsPerBar;
  const pos = ((beatIndex % totalBeats) + totalBeats) % totalBeats;
  const audibleBeats = c.audibleBars * c.beatsPerBar;
  const isAudible = pos < audibleBeats;
  return {
    isAudible,
    pos: isAudible ? pos : pos - audibleBeats,
    total: isAudible ? audibleBeats : c.silentBars * c.beatsPerBar,
  };
};

// ============================================================================
// フック本体
// ============================================================================
export const useInnerTakt = (cfg: InnerTaktCfg) => {
  // UI 描画用の state
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(0);
  const [isSilent, setIsSilent] = useState(false);
  const [fadeAmount, setFadeAmount] = useState(1);
  const [taps, setTaps] = useState<Tap[]>([]);

  // 高頻度ループ（スケジューラ / RAF）からは ref で参照する．
  // state を介すと再レンダー待ちになり，サンプル単位の精度を出せない．
  const cfgRef = useRef(cfg);
  const runningRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);
  // 次に予約するビートの AudioContext 時刻（秒）
  const nextBeatTimeRef = useRef(0);
  // 起動からの通算ビート番号
  const beatIndexRef = useRef(0);
  // 直近に予約したビートのリングバッファ．タップ判定と RAF 表示の両方で参照される．
  const beatTimesRef = useRef<ScheduledBeat[]>([]);
  // スケジューラ (setTimeout) の解除用ハンドル
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  // --------------------------------------------------------------------------
  // スケジューラ: 先読み窓に入るビートを AudioContext に予約する
  // --------------------------------------------------------------------------

  // 1ビート分の処理: 発音予約 → リングに記録 → 次ビート位置へポインタを進める
  const scheduleOneBeat = useCallback((ctx: AudioContext, c: InnerTaktCfg) => {
    const gbi = beatIndexRef.current;
    const beatInBar = gbi % c.beatsPerBar;
    const isAccent = beatInBar % c.accentEvery === 0;
    const phase = phaseAt(gbi, c);
    const time = nextBeatTimeRef.current;

    beatTimesRef.current.push({ globalBeatIndex: gbi, timeSec: time });
    if (beatTimesRef.current.length > RING_MAX) {
      beatTimesRef.current.shift();
    }

    // フェードがほぼ 0 なら無音にする（無駄に Oscillator を生成しない）
    if (phase.fade > 0.001) {
      playClick(ctx, time, isAccent, phase.fade);
    }

    nextBeatTimeRef.current += 60 / c.bpm;
    beatIndexRef.current += 1;
  }, []);

  // setTimeout で自分自身を呼び続けるループ本体．
  // ・running 中だけ動く
  // ・nextBeatTime が「現在 + 先読み窓」を超えるまでビートを連続予約
  // ・useLayoutEffect で毎レンダー最新のクロージャを ref に入れ替える
  //   （内部参照は cfgRef 経由なので依存配列は不要）
  const schedulerRef = useRef<() => void>(() => {
    return;
  });
  useLayoutEffect(() => {
    schedulerRef.current = () => {
      if (!runningRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      const c = cfgRef.current;

      while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SEC) {
        scheduleOneBeat(ctx, c);
      }
      timerRef.current = setTimeout(
        () => schedulerRef.current(),
        SCHEDULER_TICK_MS,
      );
    };
  });

  // --------------------------------------------------------------------------
  // RAF ループ: 視覚的なビート表示とフェード補間を更新する
  // 音の予約は AudioContext が正確に再生してくれるので，画面表示だけ RAF で追う．
  // --------------------------------------------------------------------------

  const updateVisualBeat = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const c = cfgRef.current;
    const now = ctx.currentTime;

    const active = findActiveBeat(now, beatTimesRef.current);
    if (!active) return;

    const bi = active.globalBeatIndex;
    const beatInBar = bi % c.beatsPerBar;
    setCurrentBeat((prev) => (prev === beatInBar ? prev : beatInBar));
    setBeatIndex(bi);

    // 現ビートと次ビートのフェード値を線形補間して，滑らかな見た目にする
    const beatLen = 60 / c.bpm;
    const ph = phaseAt(bi, c);
    const nextPh = phaseAt(bi + 1, c);
    const intoBeat = Math.min(1, Math.max(0, (now - active.timeSec) / beatLen));
    const fade = ph.fade + (nextPh.fade - ph.fade) * intoBeat;
    setFadeAmount(fade);
    setIsSilent(fade < 0.5);
  }, []);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      if (runningRef.current && ctxRef.current) {
        updateVisualBeat();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [updateVisualBeat]);

  // --------------------------------------------------------------------------
  // 操作: 開始 / 停止 / タップ記録 / タップ消去
  // --------------------------------------------------------------------------

  const start = useCallback(() => {
    const ctx = ensureAudioCtx(ctxRef.current);
    ctxRef.current = ctx;
    runningRef.current = true;
    // 100ms 後を起点にするのは，currentTime ぴったりに予約すると
    // 既に AudioContext の再生位置を過ぎていて発音されない事故を避けるため
    nextBeatTimeRef.current = ctx.currentTime + 0.1;
    beatIndexRef.current = 0;
    beatTimesRef.current = [];
    setIsRunning(true);
    setTaps([]);
    setCurrentBeat(-1);
    schedulerRef.current();
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    setCurrentBeat(-1);
    setIsSilent(false);
    setFadeAmount(1);
  }, []);

  const recordTap = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const c = cfgRef.current;
    const beatLen = 60 / c.bpm;

    const projected: ScheduledBeat = {
      globalBeatIndex: beatIndexRef.current,
      timeSec: nextBeatTimeRef.current,
    };
    const result = findNearestBeat(now, beatTimesRef.current, projected);
    if (!result) return;

    // 半拍より遠いタップは「狙ったビートが特定できない」として無効化する
    if (result.diffSec > beatLen / 2) return;

    const deviationMs = (now - result.beat.timeSec) * 1000;
    setTaps((prev) => [
      ...prev,
      {
        deviationMs,
        globalBeatIndex: result.beat.globalBeatIndex,
        timeSec: now,
      },
    ]);
  }, []);

  const resetTaps = useCallback(() => setTaps([]), []);

  const cycleProgress = isRunning ? calcCycleProgress(beatIndex, cfg) : null;

  return {
    isRunning,
    currentBeat,
    isSilent,
    fadeAmount,
    taps,
    cycleProgress,
    start,
    stop,
    recordTap,
    resetTaps,
  };
};
