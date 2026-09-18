import { describe, expect, it } from "vitest";
import { normalizeOwners, ownerSearchGroups } from "./owners.ts";

describe("normalizeOwners", () => {
  it("treats a bare string as every visibility", () => {
    expect(normalizeOwners(["flox"])).toEqual([{ owner: "flox" }]);
  });

  it("reads a visibility filter from the object form", () => {
    expect(
      normalizeOwners([{ owner: "imkarrer", visibility: ["public"] }])
    ).toEqual([{ owner: "imkarrer", visibility: ["public"] }]);
  });

  it("accepts both forms in one list", () => {
    expect(
      normalizeOwners(["flox", { owner: "imkarrer", visibility: ["public"] }])
    ).toEqual([
      { owner: "flox" },
      { owner: "imkarrer", visibility: ["public"] },
    ]);
  });

  it("accepts a bare string visibility", () => {
    expect(normalizeOwners([{ owner: "me", visibility: "public" }])).toEqual([
      { owner: "me", visibility: ["public"] },
    ]);
  });

  it("sorts and dedupes visibility so equivalent groups match", () => {
    expect(
      normalizeOwners([
        { owner: "me", visibility: ["internal", "public", "public"] },
      ])
    ).toEqual([{ owner: "me", visibility: ["internal", "public"] }]);
  });

  it("is empty when unset", () => {
    expect(normalizeOwners(undefined)).toEqual([]);
  });

  it("rejects an unknown visibility rather than silently widening scope", () => {
    expect(() =>
      normalizeOwners([{ owner: "me", visibility: ["secret"] }])
    ).toThrow(/unknown visibility "secret"/);
  });

  it("rejects an empty visibility list", () => {
    expect(() => normalizeOwners([{ owner: "me", visibility: [] }])).toThrow(
      /visibility for "me" is empty/
    );
  });

  it("rejects an entry with no owner", () => {
    expect(() => normalizeOwners([{ visibility: ["public"] }])).toThrow(
      /needs a non-empty owner/
    );
  });

  it("rejects a non-array config value", () => {
    expect(() => normalizeOwners("flox")).toThrow(/must be an array/);
  });
});

describe("ownerSearchGroups", () => {
  it("issues one unscoped search when no owners are configured", () => {
    expect(ownerSearchGroups([])).toEqual([[]]);
  });

  it("puts owners with no visibility filter in a single search", () => {
    expect(
      ownerSearchGroups([{ owner: "flox" }, { owner: "agent-stacks" }])
    ).toEqual([["--owner", "flox", "--owner", "agent-stacks"]]);
  });

  it("splits an owner with its own visibility into a second search", () => {
    expect(
      ownerSearchGroups([
        { owner: "flox" },
        { owner: "imkarrer", visibility: ["public"] },
      ])
    ).toEqual([
      ["--owner", "flox"],
      ["--owner", "imkarrer", "--visibility", "public"],
    ]);
  });

  it("groups owners that share a visibility filter", () => {
    expect(
      ownerSearchGroups([
        { owner: "a", visibility: ["public"] },
        { owner: "b", visibility: ["public"] },
      ])
    ).toEqual([["--owner", "a", "--owner", "b", "--visibility", "public"]]);
  });

  it("joins multiple visibilities into one flag", () => {
    expect(
      ownerSearchGroups([{ owner: "a", visibility: ["internal", "public"] }])
    ).toEqual([["--owner", "a", "--visibility", "internal,public"]]);
  });

  it("does not repeat an owner listed twice in the same group", () => {
    expect(ownerSearchGroups([{ owner: "a" }, { owner: "a" }])).toEqual([
      ["--owner", "a"],
    ]);
  });

  it("keeps the same owner in two groups when the filters differ", () => {
    // Deliberate: this is how you include one owner's public repos plus a
    // narrower slice, and the searches dedupe by entry id downstream anyway.
    expect(
      ownerSearchGroups([
        { owner: "a", visibility: ["public"] },
        { owner: "a", visibility: ["internal"] },
      ])
    ).toEqual([
      ["--owner", "a", "--visibility", "public"],
      ["--owner", "a", "--visibility", "internal"],
    ]);
  });
});
