import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readWatermark, writeWatermark } from "./state.ts";

describe("harvest watermarks", () => {
  it("returns null for a source that has never been harvested", () => {
    const statePath = join(mkdtempSync(join(tmpdir(), "state-")), "state.json");
    expect(readWatermark(statePath, "github")).toBeNull();
  });

  it("round-trips a watermark and preserves other sources", () => {
    const statePath = join(mkdtempSync(join(tmpdir(), "state-")), "state.json");
    writeWatermark(statePath, "github", "2026-09-01T09:00:00Z");
    writeWatermark(statePath, "linear", "2026-09-02T09:00:00Z");
    expect(readWatermark(statePath, "github")).toBe("2026-09-01T09:00:00Z");
    expect(readWatermark(statePath, "linear")).toBe("2026-09-02T09:00:00Z");
  });
});
