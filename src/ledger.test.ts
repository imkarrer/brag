import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it } from "vitest";
import { appendEntries, readEntries, type Entry } from "./ledger.ts";

const entry = (overrides: Partial<Entry> & Pick<Entry, "id">): Entry => ({
  date: "2026-08-14",
  source: "github",
  kind: "pr_merged",
  title: "Rework activation hook ordering",
  summary: "Reordered hooks so activation is deterministic.",
  impact: "Eliminated a class of flaky activations.",
  tags: ["reliability"],
  links: ["https://github.com/flox/flox/pull/2481"],
  harvested_at: "2026-09-02T21:04:00Z",
  ...overrides,
});

describe("appendEntries", () => {
  let ledgerPath: string;

  beforeEach(() => {
    ledgerPath = join(mkdtempSync(join(tmpdir(), "ledger-")), "entries.jsonl");
  });

  it("appends new entries and skips ones whose id is already in the ledger", () => {
    const first = appendEntries(ledgerPath, [
      entry({ id: "gh-pr:flox/flox#2481" }),
    ]);
    expect(first.added.map((e) => e.id)).toEqual(["gh-pr:flox/flox#2481"]);
    expect(first.skipped).toEqual([]);

    const second = appendEntries(ledgerPath, [
      entry({ id: "gh-pr:flox/flox#2481" }),
      entry({ id: "linear:ENG-123", source: "linear", kind: "issue_done" }),
    ]);
    expect(second.added.map((e) => e.id)).toEqual(["linear:ENG-123"]);
    expect(second.skipped).toEqual(["gh-pr:flox/flox#2481"]);

    expect(readEntries(ledgerPath).map((e) => e.id)).toEqual([
      "gh-pr:flox/flox#2481",
      "linear:ENG-123",
    ]);
  });

  it("rejects an entry with a missing required field and writes nothing", () => {
    expect(() =>
      appendEntries(ledgerPath, [
        fromPartial<Entry>({ id: "toot:2026-09-02-demo", title: "Demo" }),
      ]),
    ).toThrow(/toot:2026-09-02-demo.*summary/);
    expect(readEntries(ledgerPath)).toEqual([]);
  });

  it("rejects a date that is not YYYY-MM-DD", () => {
    expect(() =>
      appendEntries(ledgerPath, [
        entry({ id: "toot:2026-09-02-demo", date: "Sep 2, 2026" }),
      ]),
    ).toThrow(/date/);
  });

  it("rejects an unknown source", () => {
    expect(() =>
      appendEntries(ledgerPath, [
        entry({ id: "x:1", source: "slack" as Entry["source"] }),
      ]),
    ).toThrow(/source/);
  });
});

describe("readEntries with a window", () => {
  it("returns only entries within the inclusive [from, to] range", () => {
    const ledgerPath = join(
      mkdtempSync(join(tmpdir(), "ledger-")),
      "entries.jsonl",
    );
    appendEntries(ledgerPath, [
      entry({ id: "a", date: "2026-03-31" }),
      entry({ id: "b", date: "2026-04-01" }),
      entry({ id: "c", date: "2026-06-15" }),
      entry({ id: "d", date: "2026-06-30" }),
      entry({ id: "e", date: "2026-07-01" }),
    ]);
    const window = readEntries(ledgerPath, {
      from: "2026-04-01",
      to: "2026-06-30",
    });
    expect(window.map((e) => e.id)).toEqual(["b", "c", "d"]);
  });
});
