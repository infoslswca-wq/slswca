import { describe, expect, it } from "vitest";
import { allEvents } from "@slswca/core/content";
import { legacyEventRedirects } from "../legacy-redirects";

describe("legacy WordPress redirects", () => {
  it("cover every event with a legacy slug and point at real events", () => {
    const expected = Object.fromEntries(allEvents.filter((e) => e.legacySlug).map((e) => [e.legacySlug!, e.slug]));
    expect(legacyEventRedirects).toEqual(expected);
    expect(Object.keys(legacyEventRedirects)).toHaveLength(9);
  });
});
