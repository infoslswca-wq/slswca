import { describe, expect, it } from "vitest";
import type { UpcomingEvent } from "@slswca/core/schemas";
import { registrationState } from "./events";

const base: UpcomingEvent = {
  slug: "e", kind: "workshop", title: "E", tag: null, body: "", venue: null, startsAt: "2026-11-01T10:00:00Z", endsAt: null,
  feeLkr: 0, capacity: 10, categories: [], registrationOpensAt: null, registrationClosesAt: null, waiverVersion: "2026-10",
};
const now = new Date("2026-10-15T00:00:00Z");

describe("registrationState", () => {
  it("open by default", () => expect(registrationState(base, { capacity: 10, taken: 3 }, now)).toBe("open"));
  it("full at capacity", () => expect(registrationState(base, { capacity: 10, taken: 10 }, now)).toBe("full"));
  it("respects windows and start time", () => {
    expect(registrationState({ ...base, registrationOpensAt: "2026-10-20T00:00:00Z" }, null, now)).toBe("not_open");
    expect(registrationState({ ...base, registrationClosesAt: "2026-10-10T00:00:00Z" }, null, now)).toBe("closed");
    expect(registrationState(base, null, new Date("2026-11-02T00:00:00Z"))).toBe("closed");
  });
  it("unlimited capacity never full", () => expect(registrationState({ ...base, capacity: null }, { capacity: null, taken: 999 }, now)).toBe("open"));
});
