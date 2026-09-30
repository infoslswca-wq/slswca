import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { colors } from "@slswca/tokens";
import { AcademyInterestInput, Event, Partner, Club } from "./schemas";
import { battles, workshops, partners, clubs } from "./content";

const valid = { name: "Kasun Perera", email: "k@example.com", pathway: "Coaching", consent: true } as const;

describe("AcademyInterestInput", () => {
  it("accepts a minimal valid submission", () => {
    expect(AcademyInterestInput.safeParse(valid).success).toBe(true);
  });
  it("requires email or phone", () => {
    const r = AcademyInterestInput.safeParse({ ...valid, email: "" });
    expect(r.success).toBe(false);
  });
  it("accepts phone instead of email", () => {
    expect(AcademyInterestInput.safeParse({ ...valid, email: "", phone: "+94 77 123 4567" }).success).toBe(true);
  });
  it("rejects filled honeypot", () => {
    expect(AcademyInterestInput.safeParse({ ...valid, website: "spam.com" }).success).toBe(false);
  });
  it("rejects unknown pathway and missing consent", () => {
    expect(AcademyInterestInput.safeParse({ ...valid, pathway: "Other" }).success).toBe(false);
    expect(AcademyInterestInput.safeParse({ ...valid, consent: false }).success).toBe(false);
  });
});

describe("content", () => {
  it("matches schemas", () => {
    [...battles, ...workshops].forEach((e) => Event.parse(e));
    partners.forEach((p) => Partner.parse(p));
    clubs.forEach((c) => Club.parse(c));
  });
  it("battle clubs are member clubs", () => {
    const names = new Set(clubs.map((c) => c.name));
    battles.flatMap((b) => b.clubs).forEach((c) => expect(names).toContain(c));
  });
});

describe("tokens", () => {
  it("tokens.css mirrors tokens index", () => {
    const css = readFileSync(new URL("../../tokens/src/tokens.css", import.meta.url), "utf8");
    const kebab = (k: string) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
    for (const [k, v] of Object.entries(colors)) {
      expect(css).toContain(`--color-${kebab(k)}: ${v};`);
    }
  });
});

import { ProfileUpdate, OtpCode, memberNumber } from "./schemas";
describe("accounts", () => {
  it("validates profile updates", () => {
    expect(ProfileUpdate.safeParse({ fullName: "Nimal", phone: "", clubSlug: "soul-lifters" }).success).toBe(true);
    expect(ProfileUpdate.safeParse({ fullName: "N" }).success).toBe(false);
    expect(ProfileUpdate.safeParse({ fullName: "Nimal", clubSlug: "Bad Slug" }).success).toBe(false);
  });
  it("otp codes are 6 digits", () => {
    expect(OtpCode.safeParse(" 123456 ").success).toBe(true);
    expect(OtpCode.safeParse("12345a").success).toBe(false);
  });
  it("member numbers are stable", () => {
    expect(memberNumber("0a1b2c3d-0000-0000-0000-000000000000")).toBe("SL-0A1B2C3D");
  });
});
