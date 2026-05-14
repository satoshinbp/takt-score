"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fadeAt,
  type ScheduledBeat,
  type SchedulerRefs,
} from "./useBeatScheduler";

// RAF ループから「今鳴っているはずのビート」を求める．
// リングは時刻順に並んでいるので，末尾から走査して最初に now 以下を見つけたら確定．
const findActiveBeat = (
  now: number,
  ring: ScheduledBeat[]
): ScheduledBeat | null => {
  for (let i = ring.length - 1; i >= 0; i--) {
    if (ring[i].timeSec <= now) return ring[i];
  }
  return null;
};

// 画面描画専任．スケジューラが書き込むリングを RAF で読み取り，
// 「今のビート位置」と「フェード強度」を React state に反映する．
// 音は鳴らさないし，鳴る／鳴らない自体の決定にも関与しない．
// reset は呼び出し側（合成フック）が start/stop のタイミングで明示的に呼ぶ．
export const useVisualBeat = (refs: SchedulerRefs) => {
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [beatIndex, setBeatIndex] = useState(0);
  const [isSilent, setIsSilent] = useState(false);
  const [fadeAmount, setFadeAmount] = useState(1);

  // スケジューラが停止時にリングを空にする契約なので，
  // ここでは「リングを読んでアクティブビートがあれば描画」だけを行えばよい．
  // 停止中は findActiveBeat が null を返すので自然に no-op になる．
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const ctx = refs.audioContextRef.current;
      if (ctx) {
        const c = refs.configRef.current;
        const now = ctx.currentTime;
        const active = findActiveBeat(now, refs.beatTimesRef.current);
        if (active) {
          const bi = active.beatIdx;
          const beatInBar = bi % c.beatsPerBar;
          setCurrentBeat((prev) => (prev === beatInBar ? prev : beatInBar));
          setBeatIndex(bi);

          // 現ビートと次ビートのフェード値を線形補間して，滑らかな見た目にする
          const beatLen = 60 / c.bpm;
          const fadeNow = fadeAt(bi, c);
          const fadeNext = fadeAt(bi + 1, c);
          const intoBeat = Math.min(
            1,
            Math.max(0, (now - active.timeSec) / beatLen)
          );
          const fade = fadeNow + (fadeNext - fadeNow) * intoBeat;
          setFadeAmount(fade);
          setIsSilent(fade < 0.5);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [refs]);

  const reset = useCallback(() => {
    setCurrentBeat(-1);
    setIsSilent(false);
    setFadeAmount(1);
  }, []);

  return { currentBeat, beatIndex, isSilent, fadeAmount, reset };
};
