import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

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
