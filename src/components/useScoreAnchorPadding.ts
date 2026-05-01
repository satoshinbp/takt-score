"use client";

import { type RefObject, useLayoutEffect, useState } from "react";

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
export const useScoreAnchorPadding = (
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
