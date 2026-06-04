import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useLang, useTranslation } from "@/hooks/useTranslation";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("useLang", () => {
  it("returns the current lang and tracks setLang updates", () => {
    const { result } = renderHook(() => useLang());
    expect(result.current).toBe("en");
  });
});

describe("useTranslation", () => {
  it("translates a key with the current lang", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("dashboard.title")).toBe("Scores");
  });

  it("supports parameter substitution", () => {
    const { result } = renderHook(() => useTranslation());
    expect(result.current.t("dashboard.count", { count: 5 })).toBe("5 scores");
  });

  it("setLang switches the language and triggers a re-render", () => {
    const { result } = renderHook(() => useTranslation());
    act(() => {
      result.current.setLang("ja");
    });
    expect(result.current.lang).toBe("ja");
    expect(result.current.t("dashboard.newScore")).toBe("新規ドラム譜");
  });
});
