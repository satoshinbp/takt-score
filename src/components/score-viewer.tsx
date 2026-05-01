"use client";

import { useCallback, useEffect, useRef } from "react";
import ScoreGrid from "@/components/score-grid";
import ViewerHeader from "@/components/score-viewer-header";
import Transport from "@/components/score-viewer-transport";
import { useScoreAnchorPadding } from "@/components/useScoreAnchorPadding";
import { usePlayback } from "@/hooks/usePlayback";
import { type Score, SUBDIVISIONS } from "@/lib/constants";

type ScoreAreaProps = {
  measures: Score["measures"];
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
};

// 再生ヘッド（縦線）を画面の左から 35% の位置に固定する。
// 譜面側がこのラインに現在ステップが揃うようにスクロールする。
const PLAYHEAD_RATIO = 0.35;

// 再生ヘッドを固定し譜面を横スクロールさせるエリア。
// PlaybackEngine から届く currentStep は 16 分音符単位の離散値なので、
// このコンポーネント内でステップ間を補間して滑らかなスクロールを作る。
const ScoreArea = ({
  measures,
  currentStep,
  isPlaying,
  bpm,
}: ScoreAreaProps) => {
  // スクロール対象のビューポート（overflow-x-auto を持つ要素）
  const areaRef = useRef<HTMLDivElement>(null);
  // ビューポート内の譜面コンテンツ。アンカーの座標計算に使う
  const contentRef = useRef<HTMLDivElement>(null);
  // 進行中の requestAnimationFrame ID。重複起動とクリーンアップのために保持
  const frameRef = useRef<number | null>(null);
  // 見た目上のステップ位置（小数）。currentStep は離散値だが、
  // ここはアニメーション中も連続的に動く
  const visualStepRef = useRef(0);
  const totalSteps = measures.length * SUBDIVISIONS;
  // 譜面の左右に挟むスペーサー幅。先頭/末尾ステップを再生ヘッドに
  // 揃えるために必要な余白
  const edgePadding = useScoreAnchorPadding(
    areaRef,
    contentRef,
    PLAYHEAD_RATIO,
  );

  // 小数値のステップ位置（例: 3.4 = ステップ3とステップ4の間 40% 地点）を
  // 受け取り、その位置が再生ヘッドの真下に来るように scrollLeft を更新する。
  const scrollToVisualStep = useCallback(
    (stepFloat: number) => {
      const container = areaRef.current;
      const content = contentRef.current;

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

  // currentStep が変わるたびに、前のステップから新しいステップへ
  // requestAnimationFrame で補間スクロールを走らせる。
  //
  // PlaybackEngine 側の RAF は「音を鳴らすタイミング」を司り、currentStep は
  // 16 分音符ごとの離散値としてここに届く。スクロールを滑らかに見せるには
  // ステップ間をピクセル単位で補間する別のアニメーションが必要で、それが
  // この effect の役割。音響系と表示系で RAF を分けている。
  useEffect(() => {
    // 既に走っている補間アニメーションを止める（重複起動を防ぐ）
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    // 停止状態（currentStep < 0）は先頭にスナップ
    if (currentStep < 0) {
      visualStepRef.current = 0;
      scrollToVisualStep(0);

      return;
    }

    const previousStep = visualStepRef.current;
    // ループ末尾 → 0 への巻き戻り検出。
    // 普通に補間すると「末尾から先頭へ」譜面全体を逆走してしまうので、
    // この場合は fromStep = 0 にして瞬時にスナップさせる。
    const isWrappedLoop =
      currentStep === 0 && previousStep > Math.max(0, totalSteps - 2);
    const fromStep = isWrappedLoop ? 0 : previousStep;
    const toStep = currentStep;

    // 一時停止中、または移動量がない場合はアニメーションせず即座にスナップ
    if (!isPlaying || fromStep === toStep) {
      visualStepRef.current = toStep;
      scrollToVisualStep(toStep);

      return;
    }

    // 1 ステップ（16 分音符）あたりの所要時間 = 60000ms / bpm / 4。
    // fromStep → toStep の歩数分を、その時間に比例した期間で補間する。
    const startedAt = performance.now();
    const animDurationMs = (toStep - fromStep) * (60000 / bpm / 4);

    // 毎フレーム、経過時間から進行率を求めて visualStep を更新し、
    // scrollToVisualStep でピクセル位置に反映する。
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / animDurationMs);
      const visualStep = fromStep + (toStep - fromStep) * progress;
      visualStepRef.current = visualStep;
      scrollToVisualStep(visualStep);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    // アンマウントや依存値の変更時に走行中フレームを確実に止める
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [bpm, currentStep, isPlaying, scrollToVisualStep, totalSteps]);

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
        ref={areaRef}
        className="h-full overflow-x-auto overflow-y-hidden px-6 py-4"
      >
        <div ref={contentRef} className="flex">
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

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);
  const totalSteps = score.measures.length * SUBDIVISIONS;
  const currentMeasure =
    pb.currentStep >= 0 ? Math.floor(pb.currentStep / SUBDIVISIONS) : -1;
  const currentBeat =
    pb.currentStep >= 0 ? Math.floor((pb.currentStep % SUBDIVISIONS) / 4) : -1;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ViewerHeader
        title={score.title}
        onBack={() => {
          pb.stop();
          onBack();
        }}
        onEdit={() => {
          pb.stop();
          onEdit();
        }}
        onDelete={onDelete}
      />
      <Transport
        isPlaying={pb.isPlaying}
        currentStep={pb.currentStep}
        currentMeasure={currentMeasure}
        currentBeat={currentBeat}
        bpm={pb.bpm}
        loop={pb.loop}
        totalSteps={totalSteps}
        onToggle={pb.toggle}
        onStop={pb.stop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
      <ScoreArea
        measures={score.measures}
        currentStep={pb.currentStep}
        isPlaying={pb.isPlaying}
        bpm={pb.bpm}
      />
    </div>
  );
};

export default ScoreViewer;
