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

// Same reason as the CLI's own git helper: under a git hook GIT_DIR and
// GIT_INDEX_FILE are set and beat cwd, so fixture repos created here would
// otherwise be committed into the repository running the hook.
const GIT_ENV_OVERRIDES = [
  "GIT_DIR",
  "GIT_WORK_TREE",
  "GIT_INDEX_FILE",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_COMMON_DIR",
  "GIT_NAMESPACE",
  "GIT_PREFIX",
];

const gitEnv = (extra: Record<string, string> = {}) => {
  const env = { ...process.env, ...extra };
  for (const key of GIT_ENV_OVERRIDES) delete env[key];
  return env;
};

const git = (args: string[], cwd: string): string =>
  execFileSync("git", args, { cwd, encoding: "utf8", env: gitEnv() });

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

    const log = git(["log", "--format=%s"], dataDir);
    expect(log).toContain("brag: t:1");
    expect(log).toContain("brag: watermark github");
  });

  it("commits to the data dir even when git env vars point elsewhere", () => {
    // Reproduces the pre-commit hook failure: git exports GIT_DIR and
    // GIT_INDEX_FILE to its hooks, and those beat `cwd`, so a brag write from
    // inside a hook used to commit into the hooked repository instead of the
    // ledger. The decoy below stands in for that repository.
    const decoy = mkdtempSync(join(tmpdir(), "decoy-"));
    git(["init", "-q", "-b", "main", "."], decoy);
    writeFileSync(join(decoy, "seed"), "seed\n");
    git(["add", "-A"], decoy);
    git(["commit", "-q", "-m", "decoy: seed"], decoy);
    const decoyHead = () => git(["rev-parse", "HEAD"], decoy).trim();
    const before = decoyHead();

    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    const hookEnv = {
      BRAG_HOME: dataDir,
      GIT_DIR: join(decoy, ".git"),
      GIT_INDEX_FILE: join(decoy, ".git", "index"),
    };

    run(["init", "--git"], hookEnv);
    run(["append"], hookEnv, entry("t:1"));

    const log = git(["log", "--format=%s"], dataDir);
    expect(log).toContain("brag: t:1");
    expect(decoyHead()).toBe(before);
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

    const [htmlPath, mdPath] = run(
      ["report", "--from", "2026-01-01", "--to", "2026-06-30"],
      env
    )
      .trim()
      .split("\n");
    expect(htmlPath).toContain("2026-01-01--2026-06-30.html");
    expect(readFileSync(htmlPath!, "utf8")).toContain("Shipped the pipeline");
    expect(mdPath).toContain("2026-01-01--2026-06-30.md");
    expect(readFileSync(mdPath!, "utf8")).toContain("<details>");
  });
});

describe("brag schedule", () => {
  it("fails elegantly on unsupported platforms", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    let err = "";
    try {
      run(["schedule"], { BRAG_HOME: dataDir, BRAG_PLATFORM: "win32" });
    } catch (e) {
      err = String((e as { stderr: string }).stderr);
    }
    expect(err).toContain("win32");
    expect(err).toContain("claude -p");
    expect(err).not.toContain("at ");
  });

  it("rejects an invalid weekday or hour with a clear message", () => {
    const dataDir = join(mkdtempSync(join(tmpdir(), "brag-")), "ledger");
    let err = "";
    try {
      run(["schedule", "--hour", "25"], { BRAG_HOME: dataDir });
    } catch (e) {
      err = String((e as { stderr: string }).stderr);
    }
    expect(err).toContain("hour");
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
