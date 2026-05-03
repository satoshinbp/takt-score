"use client";

import { useCallback, useEffect, useRef } from "react";
import { type RefObject, useLayoutEffect, useState } from "react";
import ScoreGrid from "@/components/score-grid";
import { type Score } from "@/lib/constants";

type EdgePadding = { left: number; right: number };

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
  const currentStepRef = useRef(currentStep);
  const scrollAnchorRef = useRef<{
    startMs: number;
    startScrollLeft: number;
  } | null>(null);
  // isPlaying を ref に同期する。読む effect より前に定義することで
  // React Compiler の順序制約を満たす。
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

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

  // 再生中は一定速度でスクロールする。rAF ループは isPlaying/bpm 変化時のみ再起動し、
  // ステップ切り替えではアンカーだけ差し替えることでかくつきを防ぐ。
  // セル幅は全ステップ等幅なので、step 0→1 の距離から px/ms を計算する。
  useEffect(() => {
    const container = viewportRef.current;
    if (!container || !isPlaying) return;

    const stepDurationMs = 60000 / bpm / 4;
    const scrollSpeedPxPerMs =
      (scrollLeftForStep(1) - scrollLeftForStep(0)) / stepDurationMs;

    scrollAnchorRef.current = {
      startMs: performance.now(),
      startScrollLeft: scrollLeftForStep(currentStepRef.current),
    };

    const tick = (now: number) => {
      const anchor = scrollAnchorRef.current;
      if (!anchor) return;
      const newScrollLeft =
        anchor.startScrollLeft + scrollSpeedPxPerMs * (now - anchor.startMs);
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
      scrollAnchorRef.current = null;
    };
  }, [isPlaying, bpm, scrollLeftForStep]);

  // ステップが変わるたびにアンカーを差し替える。rAF ループは止めないので
  // ステップ切り替えによるスクロール停止が起きない。
  useEffect(() => {
    currentStepRef.current = currentStep;
    if (!isPlayingRef.current) return;
    scrollAnchorRef.current = {
      startMs: performance.now(),
      startScrollLeft: scrollLeftForStep(currentStep),
    };
  }, [currentStep, scrollLeftForStep]);

  // シーク時（停止中に currentStep が変わった場合）のみスナップする。
  // isPlaying の変化（一時停止）では発火させないため isPlayingRef で追跡する。
  useEffect(() => {
    if (isPlayingRef.current) return;
    const container = viewportRef.current;
    if (!container) return;
    container.scrollLeft = currentStep < 0 ? 0 : scrollLeftForStep(currentStep);
  }, [currentStep, scrollLeftForStep]);

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
