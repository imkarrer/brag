import type { Entry } from "./ledger.ts";

export type TootOptions = {
  title: string;
  impact: string;
  summary?: string;
  date?: string;
  kudos?: boolean;
  tags?: string;
  links?: string;
};

function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v !== "");
}

export function buildTootEntry(opts: TootOptions, now: Date): Entry {
  const date = opts.date ?? now.toISOString().slice(0, 10);
  const prefix = opts.kudos ? "kudos" : "toot";
  return {
    id: `${prefix}:${date}-${slug(opts.title)}`,
    date,
    source: opts.kudos ? "kudos" : "manual",
    kind: opts.kudos ? "kudos" : "toot",
    title: opts.title,
    summary: opts.summary ?? opts.title,
    impact: opts.impact,
    tags: splitList(opts.tags),
    links: splitList(opts.links),
    harvested_at: now.toISOString(),
  };
}
