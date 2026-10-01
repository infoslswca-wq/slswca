import { describe, expect, it } from "vitest";
import { jsonLd } from "./jsonld";

describe("jsonLd", () => {
  it("cannot break out of a script tag", () => {
    const out = jsonLd({ description: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(JSON.parse(out).description).toBe("</script><script>alert(1)</script>");
  });
  it("round-trips line separators", () => {
    expect(JSON.parse(jsonLd({ a: "x y" })).a).toBe("x y");
  });
});
