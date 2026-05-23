"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

// Auto-scrolls so the currently playing measure stays near the center of the scroll area.
export const useFollowPlayback = (
  currentMeasure: number,
  areaRef: RefObject<HTMLDivElement | null>,
) => {
  useEffect(() => {
    if (currentMeasure < 0 || !areaRef.current) return;
    const container = areaRef.current;
    const el = container.querySelector(
      `[data-measure="${currentMeasure}"]`,
    ) as HTMLElement;

    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop =
      container.scrollTop +
      elRect.top -
      containerRect.top -
      (container.clientHeight - el.clientHeight) / 2;
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
  }, [currentMeasure, areaRef]);
};
