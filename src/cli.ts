import { execFileSync } from "node:child_process";
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as readline from "node:readline/promises";
import { parseArgs } from "node:util";
import {
  chunkWindows,
  githubPrsToCandidates,
  linearIssuesToCandidates,
  type GhPr,
  type LinearIssue,
} from "./candidates.ts";
import { configPath, resolveDataDir } from "./config.ts";
import { renderReport } from "./report.ts";
import { buildTootEntry } from "./toot.ts";
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
  brag toot [title] [--kudos] [--impact <text>] [--summary <text>]
            [--date YYYY-MM-DD] [--tags a,b] [--links url,url]
  brag candidates [--source github|linear|all] [--since YYYY-MM-DD] [--until YYYY-MM-DD]
                  [--owner <org>]...              # draft entries (JSONL) for curation, new ids only
  brag append [--data-dir <path>]                 # entries as JSON array or JSONL on stdin
  brag read [--data-dir <path>] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
  brag report --from YYYY-MM-DD --to YYYY-MM-DD [--out <file.html>]
  brag watermark get <source> [--data-dir <path>]
  brag watermark set <source> <timestamp> [--data-dir <path>]
  brag paths                                      # print resolved data locations
  brag schema                                     # print the entry schema

data dir resolution: --data-dir flag > $BRAG_HOME > ~/.config/brag/config.json > default`;

function parseCliArgs(): ReturnType<typeof doParseArgs> {
  try {
    return doParseArgs();
  } catch (e) {
    console.error(`${(e as Error).message}\n\n${USAGE}`);
    process.exit(2);
  }
}

const doParseArgs = () =>
  parseArgs({
    allowPositionals: true,
    options: {
      help: { type: "boolean", default: false },
      "data-dir": { type: "string" },
      git: { type: "boolean", default: false },
      ledger: { type: "string" },
      state: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      kudos: { type: "boolean", default: false },
      impact: { type: "string" },
      summary: { type: "string" },
      date: { type: "string" },
      tags: { type: "string" },
      links: { type: "string" },
      source: { type: "string", default: "all" },
      owner: { type: "string", multiple: true },
      since: { type: "string" },
      until: { type: "string" },
      out: { type: "string" },
    },
  });

const { values, positionals } = parseCliArgs();

if (values.help) {
  console.log(USAGE);
  process.exit(0);
}

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

// chmod u+w everything under dir so a previous copy that inherited
// read-only Nix-store permissions can be removed and re-copied.
function makeWritable(dir: string): void {
  chmodSync(dir, 0o755);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) makeWritable(p);
    else chmodSync(p, 0o644);
  }
}

function refreshSkills(dest: string): void {
  if (existsSync(dest)) {
    makeWritable(dest);
    rmSync(dest, { recursive: true, force: true });
  }
  cpSync(skillsSource(), dest, { recursive: true });
  makeWritable(dest);
}

function init(): void {
  mkdirSync(dataDir, { recursive: true });
  refreshSkills(join(dataDir, ".claude", "skills"));
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
  console.log(
    "Claude Code skills installed: /toot /harvest /backfill /report /share-report"
  );
}

async function promptFor(field: string): Promise<string> {
  if (!process.stdin.isTTY) {
    console.error(
      `missing --${field} (required when not running in a terminal)`
    );
    process.exit(2);
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  const answer = (await rl.question(`${field}: `)).trim();
  rl.close();
  if (answer === "") {
    console.error(`--${field} is required`);
    process.exit(2);
  }
  return answer;
}

async function toot(titleArg?: string): Promise<void> {
  const title = titleArg ?? (await promptFor("title"));
  const impact = values.impact ?? (await promptFor("impact"));
  const entry = buildTootEntry(
    {
      title,
      impact,
      summary: values.summary,
      date: values.date,
      kudos: values.kudos,
      tags: values.tags,
      links: values.links,
    },
    new Date()
  );
  const result = appendEntries(ledgerPath, [entry]);
  if (result.skipped.length > 0) {
    console.error(
      `already in ledger: ${result.skipped[0]} (change the title or --date)`
    );
    process.exit(1);
  }
  autoCommit(ledgerPath, `brag: ${entry.id}`);
  console.log(JSON.stringify(entry, null, 2));
}

function gh(args: string[]): string {
  return execFileSync("gh", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const GH_JSON = "repository,number,title,url,closedAt,author";

async function fetchLinearIssues(
  since: string,
  until: string
): Promise<LinearIssue[]> {
  const key = process.env["LINEAR_API_KEY"];
  if (!key) {
    console.error("LINEAR_API_KEY not set; skipping linear");
    return [];
  }
  const issues: LinearIssue[] = [];
  let after: string | null = null;
  do {
    const query = `query($after: String) { issues(first: 100, after: $after, filter: {assignee: {isMe: {eq: true}}, completedAt: {gte: "${since}T00:00:00Z", lte: "${until}T23:59:59Z"}}) { pageInfo { hasNextPage endCursor } nodes { identifier title url completedAt project { name } } } }`;
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { Authorization: key, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { after } }),
    });
    if (!res.ok) throw new Error(`linear API: HTTP ${res.status}`);
    const body = (await res.json()) as {
      data?: {
        issues: {
          pageInfo: { hasNextPage: boolean; endCursor: string };
          nodes: LinearIssue[];
        };
      };
      errors?: { message: string }[];
    };
    if (body.errors?.length)
      throw new Error(`linear API: ${body.errors[0]!.message}`);
    const page = body.data!.issues;
    issues.push(...page.nodes);
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return issues;
}

async function candidates(): Promise<void> {
  const now = new Date();
  const until = values.until ?? now.toISOString().slice(0, 10);
  const wantGithub = values.source === "all" || values.source === "github";
  const wantLinear = values.source === "all" || values.source === "linear";
  const existing = new Set(readEntries(ledgerPath).map((e) => e.id));
  const drafts: Entry[] = [];

  const sinceFor = (source: Source): string => {
    const since =
      values.since ?? readWatermark(statePath, source)?.slice(0, 10);
    if (!since) {
      console.error(`no ${source} watermark yet — pass --since YYYY-MM-DD`);
      process.exit(2);
    }
    return since;
  };

  if (wantGithub) {
    const since = sinceFor("github");
    const login = gh(["api", "user", "--jq", ".login"]).trim();
    const owners = values.owner ?? [];
    const ownerArgs = owners.flatMap((o) => ["--owner", o]);
    for (const chunk of chunkWindows(since, until)) {
      const range = `${chunk.since}..${chunk.until}`;
      const authored = JSON.parse(
        gh([
          "search",
          "prs",
          "--author",
          login,
          "--merged",
          "--merged-at",
          range,
          "--limit",
          "200",
          "--json",
          GH_JSON,
          ...ownerArgs,
        ])
      ) as GhPr[];
      drafts.push(
        ...githubPrsToCandidates(authored, { kind: "pr_merged" }, now)
      );
      const reviewed = JSON.parse(
        gh([
          "search",
          "prs",
          "--reviewed-by",
          login,
          "--merged",
          "--merged-at",
          range,
          "--limit",
          "200",
          "--json",
          GH_JSON,
          ...ownerArgs,
        ])
      ) as GhPr[];
      drafts.push(
        ...githubPrsToCandidates(
          reviewed,
          { kind: "review", excludeAuthor: login },
          now
        )
      );
    }
  }
  if (wantLinear) {
    const since = sinceFor("linear");
    drafts.push(
      ...linearIssuesToCandidates(await fetchLinearIssues(since, until), now)
    );
  }

  const seen = new Set<string>();
  for (const d of drafts) {
    if (existing.has(d.id) || seen.has(d.id)) continue;
    seen.add(d.id);
    console.log(JSON.stringify(d));
  }
  console.error(
    `${seen.size} new candidate(s); fill in "impact", drop the churn, then: brag append < file`
  );
}

function report(): void {
  if (!values.from || !values.to) {
    console.error("report needs --from and --to");
    process.exit(2);
  }
  const entries = readEntries(ledgerPath, { from: values.from, to: values.to });
  const outPath =
    values.out ?? join(dataDir, "reports", `${values.from}--${values.to}.html`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    renderReport(entries, { from: values.from, to: values.to })
  );
  console.error(
    "tag-grouped render. For a themed, narrative report, run /report in Claude Code from your data dir."
  );
  console.log(outPath);
}

const [command, ...rest] = positionals;

switch (command) {
  case "init":
    init();
    break;
  case "toot":
    await toot(rest[0]);
    break;
  case "candidates":
    await candidates();
    break;
  case "report":
    report();
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
