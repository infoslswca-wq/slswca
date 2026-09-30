import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv([{ a: 'x,"y"\nz' }], ["a"])).toBe('a\r\n"x,""y""\nz"\r\n');
  });
  it("neutralises formula injection", () => {
    expect(toCsv([{ a: "=HYPERLINK(\"http://x\")" }, { a: "+1" }, { a: "@SUM(A1)" }, { a: "-2" }], ["a"])).toBe(
      "a\r\n\"'=HYPERLINK(\"\"http://x\"\")\"\r\n'+1\r\n'@SUM(A1)\r\n'-2\r\n",
    );
  });
  it("renders null as empty", () => expect(toCsv([{ a: null }], ["a"])).toBe("a\r\n\r\n"));
});
