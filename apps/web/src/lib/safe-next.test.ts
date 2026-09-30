import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("allows internal paths", () => expect(safeNext("/account?tab=1")).toBe("/account?tab=1"));
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "", undefined, "/a\r\nSet-Cookie: x"])(
    "rejects %s",
    (v) => expect(safeNext(v)).toBe("/account"),
  );
});
