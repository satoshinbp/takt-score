"use client";

import { useCallback, useEffect, useRef } from "react";
import { type RefObject, useLayoutEffect, useState } from "react";
import ScoreGrid from "@/components/score-grid";
import { type Score, SUBDIVISIONS } from "@/lib/constants";

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
        left: Math.max(0, playheadX - firstAnchor.offsetWidth / 2),
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
  const stepFloatRef = useRef(0);
  const totalSteps = measures.length * SUBDIVISIONS;
  const edgePadding = useScoreAnchorPadding(
    viewportRef,
    scoreRef,
    PLAYHEAD_RATIO,
  );

  // 小数値のステップ位置（例: 3.4 = ステップ3とステップ4の間 40% 地点）を
  // 「見た目上の現在位置」として確定する唯一の入口。
  // stepFloatRef（次回補間の起点）と scrollLeft（DOM への反映）を同時に更新し、
  // 両者が常に同じ値を指すようにする。
  const setFloatStep = useCallback(
    (stepFloat: number) => {
      stepFloatRef.current = stepFloat;

      const container = viewportRef.current;
      const content = scoreRef.current;

      if (!container || !content || totalSteps <= 0) return;

      // 補間元となる前後2つのステップを決める。
      // baseStep が整数部、nextStep はその次のステップ（末尾では自分自身）。
      const baseStep = Math.floor(stepFloat);
      const nextStep = Math.min(baseStep + 1, totalSteps - 1);
      // 各ステップのセルは DOM 上で data-step-anchor 属性でマークされている。
      // それを拾って X 座標を取るのが座標計算の起点。
      const currentAnchor = content.querySelector<HTMLElement>(
        `[data-step-anchor="${baseStep}"]`,
      );
      const nextAnchor = content.querySelector<HTMLElement>(
        `[data-step-anchor="${nextStep}"]`,
      );

      if (!currentAnchor) return;

      // 前後アンカーの中心 X を、stepFloat の小数部で線形補間する。
      // これが「現在の見た目上のステップ」のピクセル X 座標。
      const currentCenter =
        currentAnchor.offsetLeft + currentAnchor.offsetWidth / 2;
      const nextCenter = nextAnchor
        ? nextAnchor.offsetLeft + nextAnchor.offsetWidth / 2
        : currentCenter;
      const cellCenter =
        currentCenter +
        (nextCenter - currentCenter) * Math.max(0, stepFloat - baseStep);
      // セル中心が再生ヘッド位置（コンテナ幅 × PLAYHEAD_RATIO）に
      // 重なるよう、scrollLeft を逆算する。
      // 上下限でクランプして、不正なスクロール位置を防ぐ。
      const nextScrollLeft = Math.max(
        0,
        cellCenter - container.clientWidth * PLAYHEAD_RATIO,
      );
      container.scrollLeft = Math.min(
        nextScrollLeft,
        container.scrollWidth - container.clientWidth,
      );
    },
    [totalSteps],
  );

  const cancelScrollAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startScrollAnimation = useCallback(
    (from: number, to: number, durationMs: number) => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / durationMs);
        setFloatStep(from + (to - from) * progress);
        rafRef.current = progress < 1 ? requestAnimationFrame(tick) : null;
      };
      tick(startedAt);
    },
    [setFloatStep],
  );

  // PlaybackEngine 側の RAF は「音を鳴らすタイミング」を司り、currentStep は
  // 16 分音符ごとの離散値としてここに届く。スクロールを滑らかに見せるには
  // ステップ間をピクセル単位で補間する別のアニメーションが必要で、それが
  // この effect の役割。音響系と表示系で RAF を分けている。
  //
  // currentStep-1 → currentStep の逆方向アニメを使う。ステップ N が発火した瞬間に
  // セル N はプレイヘッドより右にあり、次ステップ発火タイミングでプレイヘッドに到達する。
  // 前進アニメ（N → N+1）にすると発火後にセルが左へ押し出されてずれて見えるため。
  useEffect(() => {
    if (currentStep < 0) {
      setFloatStep(0);
      return;
    }

    if (!isPlaying) {
      setFloatStep(currentStep);
      return;
    }

    const stepDurationMs = 60000 / bpm / 4;
    const fromStep = Math.max(0, currentStep - 1);
    startScrollAnimation(fromStep, currentStep, stepDurationMs);
    return cancelScrollAnimation;
  }, [
    bpm,
    cancelScrollAnimation,
    currentStep,
    isPlaying,
    setFloatStep,
    startScrollAnimation,
  ]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {currentStep >= 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 z-10 flex w-px -translate-x-1/2 justify-center bg-primary"
          style={{ left: `${PLAYHEAD_RATIO * 100}%` }}
        />
      )}
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
          <ScoreGrid measures={measures} currentStep={currentStep} horizontal />
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
