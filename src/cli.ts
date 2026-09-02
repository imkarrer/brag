import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { configPath, resolveDataDir } from "./config.ts";
import {
  appendEntries,
  KINDS,
  readEntries,
  SOURCES,
  type Entry,
  type Source,
} from "./ledger.ts";
import { readWatermark, writeWatermark } from "./state.ts";

const USAGE = `usage:
  brag init [--git] [--data-dir <path>]           # set up a data dir (default ~/.local/share/brag)
  brag append [--data-dir <path>]                 # entries as JSON array or JSONL on stdin
  brag read [--data-dir <path>] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
  brag watermark get <source> [--data-dir <path>]
  brag watermark set <source> <timestamp> [--data-dir <path>]
  brag paths                                      # print resolved data locations
  brag schema                                     # print the entry schema

data dir resolution: --data-dir flag > $BRAG_HOME > ~/.config/brag/config.json > default`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "data-dir": { type: "string" },
    git: { type: "boolean", default: false },
    ledger: { type: "string" },
    state: { type: "string" },
    from: { type: "string" },
    to: { type: "string" },
  },
});

const dataDir = resolveDataDir({ flag: values["data-dir"] });
const ledgerPath = values.ledger ?? join(dataDir, "entries.jsonl");
const statePath = values.state ?? join(dataDir, "state.json");

function parseStdin(): Entry[] {
  const raw = readFileSync(0, "utf8").trim();
  if (raw === "") return [];
  if (raw.startsWith("[")) return JSON.parse(raw) as Entry[];
  return raw.split("\n").map((line) => JSON.parse(line) as Entry);
}

function insideGitRepo(dir: string): boolean {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd: dir,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function autoCommit(file: string, message: string): void {
  const dir = dirname(file);
  if (!insideGitRepo(dir)) return;
  execFileSync("git", ["add", file], { cwd: dir, stdio: "pipe" });
  try {
    execFileSync("git", ["diff", "--cached", "--quiet"], {
      cwd: dir,
      stdio: "pipe",
    });
    return; // nothing staged
  } catch {
    execFileSync("git", ["commit", "-q", "-m", message], {
      cwd: dir,
      stdio: "pipe",
    });
  }
}

function skillsSource(): string {
  return join(import.meta.dirname, "..", "skills");
}

function init(): void {
  mkdirSync(dataDir, { recursive: true });
  cpSync(skillsSource(), join(dataDir, ".claude", "skills"), {
    recursive: true,
  });
  const cfg = configPath(homedir(), process.env);
  if (!process.env["BRAG_HOME"] && !existsSync(cfg)) {
    mkdirSync(dirname(cfg), { recursive: true });
    writeFileSync(cfg, JSON.stringify({ data_dir: dataDir }, null, 2) + "\n");
  }
  if (values.git && !insideGitRepo(dataDir)) {
    execFileSync("git", ["init", "-q", "-b", "main"], { cwd: dataDir });
    execFileSync("git", ["add", "-A"], { cwd: dataDir });
    execFileSync("git", ["commit", "-q", "-m", "brag: init"], { cwd: dataDir });
  }
  console.log(`brag data dir ready: ${dataDir}`);
  console.log(
    values.git
      ? "git-backed: every append and watermark update auto-commits."
      : "plain files (re-run with --git, or `git init` there yourself, to get auto-commits)."
  );
  console.log("Claude Code skills installed: /toot /harvest /backfill /report");
}

const [command, ...rest] = positionals;

switch (command) {
  case "init":
    init();
    break;
  case "append": {
    const result = appendEntries(ledgerPath, parseStdin());
    if (result.added.length > 0) {
      autoCommit(
        ledgerPath,
        `brag: ${result.added.map((e) => e.id).join(", ")}`
      );
    }
    console.log(
      JSON.stringify({
        added: result.added.map((e) => e.id),
        skipped: result.skipped,
      })
    );
    break;
  }
  case "read": {
    for (const e of readEntries(ledgerPath, {
      from: values.from,
      to: values.to,
    })) {
      console.log(JSON.stringify(e));
    }
    break;
  }
  case "watermark": {
    const [action, source, timestamp] = rest;
    if (action === "get" && source) {
      console.log(readWatermark(statePath, source as Source) ?? "null");
    } else if (action === "set" && source && timestamp) {
      writeWatermark(statePath, source as Source, timestamp);
      autoCommit(statePath, `brag: watermark ${source} -> ${timestamp}`);
    } else {
      console.error(USAGE);
      process.exit(2);
    }
    break;
  }
  case "paths":
    console.log(JSON.stringify({ dataDir, ledgerPath, statePath }, null, 2));
    break;
  case "schema": {
    console.log(`ledger entry fields (all required; see src/ledger.ts):
  id           string  stable natural key, e.g. gh-pr:flox/flox#2481, linear:ENG-123, toot:<date>-<slug>
  date         string  YYYY-MM-DD (when it happened)
  source       enum    ${SOURCES.join(" | ")}
  kind         enum    ${KINDS.join(" | ")}
  title        string
  summary      string  what was done
  impact       string  the so-what a reviewer cares about
  tags         string[]
  links        string[]
  harvested_at string  ISO timestamp`);
    break;
  }
  default:
    console.error(USAGE);
    process.exit(2);
}
