import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("Utils - cn (tailwind-merge + clsx)", () => {
  it("merges tailwind classes correctly", () => {
    // Should merge conflicting classes taking the latter one
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("handles conditional classes correctly", () => {
    // Should handle standard clsx syntax
    expect(cn("p-4", true && "m-4", false && "flex")).toBe("p-4 m-4");
  });

  it("handles arrays and objects", () => {
    expect(cn(["text-sm", "font-bold"], { "opacity-50": true })).toBe("text-sm font-bold opacity-50");
  });
});
