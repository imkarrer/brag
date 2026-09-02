import type { Entry } from "./ledger.ts";

// Shapes as returned by `gh search prs --json ...` and Linear's GraphQL API.
export type GhPr = {
  closedAt: string;
  number: number;
  repository: { name: string; nameWithOwner: string };
  title: string;
  url: string;
  author?: { login: string };
};

export type LinearIssue = {
  identifier: string;
  title: string;
  url: string;
  completedAt: string;
  project?: { name: string } | null;
};

type PrMapping = {
  kind: "pr_merged" | "review";
  excludeAuthor?: string;
};

export function githubPrsToCandidates(
  prs: GhPr[],
  mapping: PrMapping,
  now: Date
): Entry[] {
  const prefix = mapping.kind === "review" ? "gh-review" : "gh-pr";
  return prs
    .filter(
      (pr) =>
        mapping.excludeAuthor === undefined ||
        pr.author?.login !== mapping.excludeAuthor
    )
    .map((pr) => ({
      id: `${prefix}:${pr.repository.nameWithOwner}#${pr.number}`,
      date: pr.closedAt.slice(0, 10),
      source: "github" as const,
      kind: mapping.kind,
      title: pr.title,
      summary: pr.title,
      impact: "",
      tags: [],
      links: [pr.url],
      harvested_at: now.toISOString(),
    }));
}

export function linearIssuesToCandidates(
  issues: LinearIssue[],
  now: Date
): Entry[] {
  return issues.map((issue) => ({
    id: `linear:${issue.identifier}`,
    date: issue.completedAt.slice(0, 10),
    source: "linear" as const,
    kind: "issue_done" as const,
    title: issue.title,
    summary: issue.title,
    impact: "",
    tags: issue.project?.name ? [issue.project.name] : [],
    links: [issue.url],
    harvested_at: now.toISOString(),
  }));
}

const DAY_MS = 86_400_000;
const CHUNK_DAYS = 31;

export function chunkWindows(
  since: string,
  until: string
): { since: string; until: string }[] {
  const chunks: { since: string; until: string }[] = [];
  let start = new Date(since + "T00:00:00Z").getTime();
  const end = new Date(until + "T00:00:00Z").getTime();
  while (start <= end) {
    const chunkEnd = Math.min(start + (CHUNK_DAYS - 1) * DAY_MS, end);
    chunks.push({
      since: new Date(start).toISOString().slice(0, 10),
      until: new Date(chunkEnd).toISOString().slice(0, 10),
    });
    start = chunkEnd + DAY_MS;
  }
  return chunks;
}
