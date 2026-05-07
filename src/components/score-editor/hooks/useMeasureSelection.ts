"use client";

import { useCallback, useState } from "react";

export const useMeasureSelection = () => {
  const [sel, setSel] = useState<number[]>([]);

  const toggle = useCallback(
    (mi: number) =>
      setSel((s) => (s.includes(mi) ? s.filter((i) => i !== mi) : [...s, mi])),
    [],
  );

  const clear = useCallback(() => setSel([]), []);

  return { sel, toggle, clear };
};
