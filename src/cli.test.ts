import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(import.meta.dirname, "cli.ts");

const run = (args: string[], input?: string): string =>
  execFileSync("node", ["--no-warnings", CLI, ...args], {
    input,
    encoding: "utf8",
  });

const entry = (id: string, date: string) => ({
  id,
  date,
  source: "manual",
  kind: "toot",
  title: "Did a thing",
  summary: "Did a memorable thing.",
  impact: "It mattered.",
  tags: [],
  links: [],
  harvested_at: "2026-09-02T21:04:00Z",
});

describe("cli", () => {
  it("appends entries from stdin, dedupes, and reads back a window", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-"));
    const ledger = ["--ledger", join(dir, "entries.jsonl")];

    const first = JSON.parse(
      run(["append", ...ledger], JSON.stringify([entry("t:1", "2026-05-01")])),
    );
    expect(first).toEqual({ added: ["t:1"], skipped: [] });

    const second = JSON.parse(
      run(
        ["append", ...ledger],
        JSON.stringify([entry("t:1", "2026-05-01"), entry("t:2", "2026-08-01")]),
      ),
    );
    expect(second).toEqual({ added: ["t:2"], skipped: ["t:1"] });

    const windowed = run([
      "read",
      ...ledger,
      "--from",
      "2026-07-01",
      "--to",
      "2026-12-31",
    ])
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(windowed.map((e) => e.id)).toEqual(["t:2"]);
  });

  it("gets and sets watermarks", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-"));
    const state = ["--state", join(dir, "state.json")];

    expect(run(["watermark", "get", "github", ...state]).trim()).toBe("null");
    run(["watermark", "set", "github", "2026-09-01T00:00:00Z", ...state]);
    expect(run(["watermark", "get", "github", ...state]).trim()).toBe(
      "2026-09-01T00:00:00Z",
    );
  });
});
