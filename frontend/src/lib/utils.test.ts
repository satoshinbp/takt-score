import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cn, sleep } from "@/lib/utils";

describe("cn", () => {
  it("joins multiple class strings", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("merges conflicting tailwind classes (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("accepts arrays and objects via clsx", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });
});

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves only after the given delay elapses", async () => {
    let isResolved = false;
    const pending = sleep(1000).then(() => {
      isResolved = true;
    });

    await vi.advanceTimersByTimeAsync(999);
    expect(isResolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(isResolved).toBe(true);
  });
});
