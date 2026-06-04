import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LANG,
  getLangSnapshot,
  getServerLangSnapshot,
  setLang,
  subscribeLang,
  translate,
} from "@/lib/i18n";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("translate", () => {
  it("returns the english template by default", () => {
    expect(translate("en", "dashboard.title")).toBe("Scores");
  });

  it("returns the japanese template when lang=ja", () => {
    expect(translate("ja", "dashboard.newScore")).toBe("新規ドラム譜");
  });

  it("substitutes params", () => {
    expect(translate("en", "dashboard.count", { count: 3 })).toBe("3 scores");
  });

  it("leaves placeholders untouched when params lack the key", () => {
    expect(translate("en", "dashboard.count", {})).toBe("{count} scores");
  });
});

describe("lang storage", () => {
  it("getLangSnapshot returns default when storage is empty", () => {
    expect(getLangSnapshot()).toBe(DEFAULT_LANG);
  });

  it("setLang + getLangSnapshot round-trips", () => {
    setLang("ja");
    expect(getLangSnapshot()).toBe("ja");
  });

  it("invalid stored value falls back to default", () => {
    localStorage.setItem("takt-score:lang", "fr");
    expect(getLangSnapshot()).toBe(DEFAULT_LANG);
  });

  it("getServerLangSnapshot always returns default", () => {
    expect(getServerLangSnapshot()).toBe(DEFAULT_LANG);
  });
});

describe("subscribeLang", () => {
  it("notifies on setLang and stops after unsubscribe", () => {
    const cb = vi.fn();
    const unsub = subscribeLang(cb);
    setLang("ja");
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
    setLang("en");
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("notifies on storage events targeting the lang key", () => {
    const cb = vi.fn();
    const unsub = subscribeLang(cb);
    window.dispatchEvent(
      new StorageEvent("storage", { key: "takt-score:lang" }),
    );
    expect(cb).toHaveBeenCalledTimes(1);
    // Unrelated key is ignored.
    window.dispatchEvent(new StorageEvent("storage", { key: "other" }));
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });
});
