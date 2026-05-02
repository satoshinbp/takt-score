"use client";

import { useCallback, useEffect, useRef } from "react";
import { type RefObject, useLayoutEffect, useState } from "react";
import ScoreGrid from "@/components/score-grid";
import { type Score } from "@/lib/constants";

type EdgePadding = { left: number; right: number };

// 譜面（横スクロールするステップアンカー列）の先頭/末尾セルを、コンテナ内の
// 固定位置（playheadRatio で指定）に揃えるために必要な左右の余白幅を計算する。
//
// 前提: content 配下のステップ要素には data-step-anchor 属性が付いており、
// 先頭・末尾アンカーが譜面両端のセルを指す。
//
// 余白の決め方:
//   left  = playhead の X − 先頭アンカー幅 / 2
//   right = コンテナ幅 − playhead の X − 末尾アンカー幅 / 2
// scrollLeft は 0 以上にしかなれないので、左 padding が無いと先頭アンカーを
// playhead に合わせられない。右側も同様の理由で必要。
//
// アンカーの増減は content の幅変化として ResizeObserver が捕えるため、
// 外部依存を渡さなくても再計算がトリガされる。
const useScoreAnchorPadding = (
  containerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  playheadRatio: number,
): EdgePadding => {
  const [padding, setPadding] = useState<EdgePadding>({ left: 0, right: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    const computePadding = () => {
      const anchors = content.querySelectorAll("[data-step-anchor]");
      const firstAnchor = anchors[0] as HTMLElement | undefined;
      const lastAnchor = anchors[anchors.length - 1] as HTMLElement | undefined;

      if (!firstAnchor || !lastAnchor) return;

      const playheadX = container.clientWidth * playheadRatio;
      setPadding({
        left: Math.max(0, playheadX - firstAnchor.offsetWidth),
        right: Math.max(
          0,
          container.clientWidth - playheadX - lastAnchor.offsetWidth / 2,
        ),
      });
    };

    const observer = new ResizeObserver(computePadding);
    observer.observe(container);
    observer.observe(content);
    computePadding();

    return () => observer.disconnect();
  }, [containerRef, contentRef, playheadRatio]);

  return padding;
};

const PLAYHEAD_RATIO = 0.25;

type Props = {
  measures: Score["measures"];
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
};

const ScoreTimeline = ({ measures, currentStep, isPlaying, bpm }: Props) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const edgePadding = useScoreAnchorPadding(
    viewportRef,
    scoreRef,
    PLAYHEAD_RATIO,
  );

  // ステップ N の左端がプレイヘッドに重なる scrollLeft を返す。
  const scrollLeftForStep = useCallback((step: number): number => {
    const container = viewportRef.current;
    const content = scoreRef.current;
    if (!container || !content) return 0;
    const anchor = content.querySelector<HTMLElement>(
      `[data-step-anchor="${step}"]`,
    );
    if (!anchor) return 0;
    return Math.max(
      0,
      Math.min(
        anchor.offsetLeft - container.clientWidth * PLAYHEAD_RATIO,
        container.scrollWidth - container.clientWidth,
      ),
    );
  }, []);

  // 再生中はステップごとに速度を計算して一定速度でスクロールする。
  // シーク時も currentStep が変わることで正しい位置に再アンカーされる。
  // セル幅は全ステップ等幅なので、step 0→1 の距離から px/ms を計算する。
  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !isPlaying) return;

    const stepDurationMs = 60000 / bpm / 4;
    const scrollSpeedPxPerMs =
      (scrollLeftForStep(1) - scrollLeftForStep(0)) / stepDurationMs;

    const startMs = performance.now();
    const startScrollLeft = scrollLeftForStep(Math.max(0, currentStep - 1));

    const tick = (now: number) => {
      const newScrollLeft =
        startScrollLeft + scrollSpeedPxPerMs * (now - startMs);
      container.scrollLeft = Math.max(
        0,
        Math.min(newScrollLeft, container.scrollWidth - container.clientWidth),
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, bpm, currentStep, scrollLeftForStep]);

  // 停止中はステップの左端を playhead に合わせてスナップする。
  useEffect(() => {
    if (isPlaying) return;
    const container = viewportRef.current;
    if (!container) return;
    container.scrollLeft = currentStep < 0 ? 0 : scrollLeftForStep(currentStep);
  }, [currentStep, isPlaying, scrollLeftForStep]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-4 z-10 flex w-px -translate-x-1/2 justify-center bg-primary"
        style={{ left: `${PLAYHEAD_RATIO * 100}%` }}
      />
      <div
        ref={viewportRef}
        className="h-full overflow-x-auto overflow-y-hidden px-6 py-4"
      >
        <div ref={scoreRef} className="flex">
          <div
            aria-hidden="true"
            className="shrink-0"
            style={{ width: edgePadding.left }}
          />
          <ScoreGrid measures={measures} currentStep={-1} horizontal />
          <div
            aria-hidden="true"
            className="shrink-0"
            style={{ width: edgePadding.right }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreTimeline;
