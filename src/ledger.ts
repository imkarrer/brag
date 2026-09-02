import { appendFileSync, existsSync, readFileSync } from "node:fs";

export type Source = "github" | "linear" | "manual" | "kudos";
export type Kind =
  | "pr_merged"
  | "review"
  | "release"
  | "issue_done"
  | "project_shipped"
  | "toot"
  | "kudos";

export type Entry = {
  id: string;
  date: string;
  source: Source;
  kind: Kind;
  title: string;
  summary: string;
  impact: string;
  tags: string[];
  links: string[];
  harvested_at: string;
};

export type AppendResult = {
  added: Entry[];
  skipped: string[];
};

export type Window = { from?: string; to?: string };

export function readEntries(ledgerPath: string, window?: Window): Entry[] {
  if (!existsSync(ledgerPath)) return [];
  const entries = readFileSync(ledgerPath, "utf8")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Entry);
  if (!window) return entries;
  return entries.filter(
    (e) =>
      (window.from === undefined || e.date >= window.from) &&
      (window.to === undefined || e.date <= window.to)
  );
}

export const SOURCES: Source[] = ["github", "linear", "manual", "kudos"];
export const KINDS: Kind[] = [
  "pr_merged",
  "review",
  "release",
  "issue_done",
  "project_shipped",
  "toot",
  "kudos",
];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateEntry(e: Entry): void {
  const fail = (field: string, why: string): never => {
    throw new Error(`invalid entry ${e.id ?? "<no id>"}: ${field} ${why}`);
  };
  for (const field of ["id", "title", "summary", "impact"] as const) {
    if (typeof e[field] !== "string" || e[field].trim() === "")
      fail(field, "must be a non-empty string");
  }
  if (typeof e.date !== "string" || !DATE_RE.test(e.date))
    fail("date", "must be YYYY-MM-DD");
  if (!SOURCES.includes(e.source))
    fail("source", `must be one of ${SOURCES.join(", ")}`);
  if (!KINDS.includes(e.kind))
    fail("kind", `must be one of ${KINDS.join(", ")}`);
  for (const field of ["tags", "links"] as const) {
    if (!Array.isArray(e[field]) || e[field].some((v) => typeof v !== "string"))
      fail(field, "must be an array of strings");
  }
  if (typeof e.harvested_at !== "string" || e.harvested_at.trim() === "")
    fail("harvested_at", "must be a non-empty string");
}

export function appendEntries(
  ledgerPath: string,
  entries: Entry[]
): AppendResult {
  for (const e of entries) validateEntry(e);
  const existing = new Set(readEntries(ledgerPath).map((e) => e.id));
  const added: Entry[] = [];
  const skipped: string[] = [];
  for (const e of entries) {
    if (existing.has(e.id)) {
      skipped.push(e.id);
      continue;
    }
    existing.add(e.id);
    added.push(e);
  }
  if (added.length > 0) {
    const lines = added.map((e) => JSON.stringify(e) + "\n").join("");
    appendFileSync(ledgerPath, lines);
  }
  return { added, skipped };
}
