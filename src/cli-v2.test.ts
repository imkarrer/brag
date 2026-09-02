import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
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
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "brag-test",
      GIT_AUTHOR_EMAIL: "brag-test@example.invalid",
      GIT_COMMITTER_NAME: "brag-test",
      GIT_COMMITTER_EMAIL: "brag-test@example.invalid",
      ...env,
    },
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
      existsSync(join(dataDir, ".agents", "skills", "toot", "SKILL.md"))
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

describe("brag init harness detection", () => {
  it("symlinks .claude/skills to .agents/skills when Claude Code is detected", () => {
    const home = mkdtempSync(join(tmpdir(), "home-"));
    mkdirSync(join(home, ".claude"), { recursive: true });
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir, HOME: home };

    run(["init"], env);
    const link = join(dataDir, ".claude", "skills");
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    expect(existsSync(join(link, "toot", "SKILL.md"))).toBe(true);
  });

  it("creates no .claude dir when no harness is detected", () => {
    const home = mkdtempSync(join(tmpdir(), "home-"));
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    run(["init"], { BRAG_HOME: dataDir, HOME: home });
    expect(existsSync(join(dataDir, ".claude"))).toBe(false);
    expect(
      existsSync(join(dataDir, ".agents", "skills", "toot", "SKILL.md"))
    ).toBe(true);
  });

  it("migrates a real .claude/skills directory from older versions to a symlink", () => {
    const home = mkdtempSync(join(tmpdir(), "home-"));
    mkdirSync(join(home, ".claude"), { recursive: true });
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir, HOME: home };

    // Old layout: a real directory, possibly read-only from a store copy.
    const oldDir = join(dataDir, ".claude", "skills", "toot");
    mkdirSync(oldDir, { recursive: true });
    writeFileSync(join(oldDir, "SKILL.md"), "old");
    execFileSync("chmod", ["-R", "a-w", join(dataDir, ".claude", "skills")]);

    run(["init"], env);
    expect(lstatSync(join(dataDir, ".claude", "skills")).isSymbolicLink()).toBe(
      true
    );
    expect(
      readFileSync(
        join(dataDir, ".claude", "skills", "toot", "SKILL.md"),
        "utf8"
      )
    ).not.toBe("old");
  });
});

describe("brag init re-run", () => {
  it("refreshes skills even when a previous copy left them read-only", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };
    run(["init"], env);

    // Simulate a copy that inherited Nix-store permissions (dirs 555, files 444).
    const skillsDir = join(dataDir, ".agents", "skills");
    execFileSync("chmod", ["-R", "a-w", skillsDir]);

    run(["init"], env);
    expect(existsSync(join(skillsDir, "toot", "SKILL.md"))).toBe(true);
    // And the refreshed copy is writable, so the next refresh works too.
    run(["init"], env);
  });
});

describe("brag toot", () => {
  it("records a toot from flags and rejects a missing impact when not a TTY", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };
    run(["init"], env);

    const out = JSON.parse(
      run(
        [
          "toot",
          "Unblocked the demo",
          "--impact",
          "Demo shipped on time.",
          "--tags",
          "demo",
        ],
        env
      )
    );
    expect(out.kind).toBe("toot");
    expect(out.tags).toEqual(["demo"]);
    expect(JSON.parse(run(["read"], env).trim()).id).toBe(out.id);

    expect(() => run(["toot", "No impact given"], env)).toThrow(/impact/);
  });
});

describe("brag report", () => {
  it("renders the window to an html file and prints its path", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const env = { BRAG_HOME: dataDir };
    run(["init"], env);
    run(
      [
        "toot",
        "Shipped the pipeline",
        "--impact",
        "Cut release time in half.",
        "--date",
        "2026-05-01",
      ],
      env
    );

    const outPath = run(
      ["report", "--from", "2026-01-01", "--to", "2026-06-30"],
      env
    ).trim();
    expect(outPath).toContain("2026-01-01--2026-06-30.html");
    expect(readFileSync(outPath, "utf8")).toContain("Shipped the pipeline");
  });
});

describe("brag --help", () => {
  it("prints usage instead of a stack trace, for --help and for unknown flags", () => {
    expect(run(["--help"])).toContain("usage:");
    let err = "";
    try {
      run(["read", "--bogus"]);
    } catch (e) {
      err = String((e as { stderr: string }).stderr);
    }
    expect(err).toContain("usage:");
    expect(err).not.toContain("at checkOptionUsage");
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
