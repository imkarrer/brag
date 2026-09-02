import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = join(import.meta.dirname, "cli.ts");

const run = (
  args: string[],
  env: Record<string, string> = {},
  input?: string
) =>
  execFileSync("node", ["--no-warnings", CLI, ...args], {
    input,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

const entry = (id: string) =>
  JSON.stringify([
    {
      id,
      date: "2026-05-01",
      source: "manual",
      kind: "toot",
      title: "Did a thing",
      summary: "Did a memorable thing.",
      impact: "It mattered.",
      tags: [],
      links: [],
      harvested_at: "2026-09-02T21:04:00Z",
    },
  ]);

describe("brag init", () => {
  it("creates the data dir with skills installed and honors BRAG_HOME for later commands", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };

    run(["init"], env);
    expect(
      existsSync(join(dataDir, ".claude", "skills", "toot", "SKILL.md"))
    ).toBe(true);

    const result = JSON.parse(run(["append"], env, entry("t:1")));
    expect(result.added).toEqual(["t:1"]);
    expect(existsSync(join(dataDir, "entries.jsonl"))).toBe(true);

    const read = run(
      ["read", "--from", "2026-01-01", "--to", "2026-12-31"],
      env
    );
    expect(JSON.parse(read.trim()).id).toBe("t:1");
  });

  it("with --git creates a repo and later writes auto-commit", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };

    run(["init", "--git"], env);
    run(["append"], env, entry("t:1"));
    run(["watermark", "set", "github", "2026-09-01T00:00:00Z"], env);

    const log = execFileSync("git", ["log", "--format=%s"], {
      cwd: dataDir,
      encoding: "utf8",
    });
    expect(log).toContain("brag: t:1");
    expect(log).toContain("brag: watermark github");
  });

  it("without git, writes still succeed as plain files", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };
    run(["init"], env);
    run(["append"], env, entry("t:1"));
    expect(existsSync(join(dataDir, ".git"))).toBe(false);
  });
});

describe("brag schema", () => {
  it("prints the entry fields and enums", () => {
    const out = run(["schema"]);
    expect(out).toContain("impact");
    expect(out).toContain("pr_merged");
    expect(out).toContain("kudos");
  });
});
