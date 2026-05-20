"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  type DictKey,
  getLangSnapshot,
  getServerLangSnapshot,
  type Lang,
  setLang as setLangStore,
  subscribeLang,
  translate,
} from "@/lib/i18n";

export const useLang = (): Lang =>
  useSyncExternalStore(subscribeLang, getLangSnapshot, getServerLangSnapshot);

export const useTranslation = () => {
  const lang = useLang();
  const t = useCallback(
    (key: DictKey, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang],
  );
  return { lang, t, setLang: setLangStore };
};
