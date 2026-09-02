# perf-review-input-tracker — Spec

A private, AI-maintained ledger of work accomplishments at Flox, plus a report
generator that turns any date window into a drill-down story for a performance
review. This is input to the review process — deliberate horn-tooting, kept
continuously so nothing is forgotten by review time.

## Goals

1. **Never lose an accomplishment.** Automated weekly harvest from GitHub and
   Linear; frictionless manual capture for everything without a digital trail.
2. **Whole-tenure ledger.** One append-only record from first day at Flox
   onward. Reports are generated *from* the ledger for any `[from, to]` window;
   the ledger itself is never rewritten per review cycle.
3. **Glance-then-drill reports.** A manager reads the top of the report in 60
   seconds; every claim expands in place to its narrative and then to its
   evidence (PR/issue links). No appendix, no glossary, no cross-referencing.

## Non-goals

- Not a time tracker, standup log, or task manager.
- Not shared team infrastructure — this is one person's ledger, in a private repo.
- No automated Slack scraping. Kudos enter via paste.

## Storage: JSONL, with an explicit exit ramp to SQLite

**Decision: `ledger/entries.jsonl`, one JSON object per line, in this git repo.**

Why JSONL wins at tenure scale: a very productive year produces maybe 150–300
ledger entries. A ten-year tenure is ~2–3k lines, single-digit megabytes.
"Generate a report for period X from date Y to Z" is a linear scan with a date
filter — `jq`, a Claude skill, or ten lines of Python all do it instantly at
this size. Meanwhile JSONL gives things SQLite doesn't: readable `git diff` on
every harvest commit, `grep`-ability, hand-editability when an entry needs a
fix, and zero runtime dependencies.

**When SQLite would actually make sense** (none apply here, revisit if one does):

- Multiple concurrent writers (e.g., a daemon and interactive sessions racing).
- Relational queries across entities (entries ↔ projects ↔ people ↔ quarters)
  asked ad hoc and often.
- The full-scan-per-report pattern gets slow — roughly >100k rows or >50 MB,
  which this ledger will not reach.

The schema below is flat and stable precisely so that if the answer ever
changes, migration is one command (`sqlite-utils insert ledger.db entries
entries.jsonl --nl`). JSONL now costs nothing later.

### Files

```
ledger/
  entries.jsonl      # append-only accomplishment records
  state.json         # harvest watermarks (last-run timestamp per source)
reports/
  2026-H2-review.html  # generated reports, kept for posterity
SPEC.md
.claude/skills/      # the commands (below)
```

### Entry schema

```json
{
  "id": "gh-pr:flox/flox#2481",
  "date": "2026-08-14",
  "source": "github",
  "kind": "pr_merged",
  "title": "Rework activation hook ordering",
  "summary": "What was done, in one or two sentences.",
  "impact": "Why it mattered — the so-what a reviewer cares about.",
  "tags": ["reliability", "activation"],
  "links": ["https://github.com/flox/flox/pull/2481"],
  "harvested_at": "2026-09-02T21:04:00Z"
}
```

- **`id`** is a stable natural key and the dedupe mechanism:
  `gh-pr:<repo>#<n>`, `gh-review:<repo>#<n>`, `gh-release:<repo>@<tag>`,
  `linear:<issue-identifier>`, `toot:<date>-<slug>`, `kudos:<date>-<slug>`.
  Harvest never appends an `id` already present in the file.
- **`source`**: `github` | `linear` | `manual` | `kudos`.
- **`kind`**: `pr_merged` | `review` | `release` | `issue_done` |
  `project_shipped` | `toot` | `kudos`.
- **`impact` is the load-bearing field.** A PR title says what; `impact` says
  why anyone should care. The harvester drafts it from the PR/issue body and
  linked context; the report generator leans on it for narrative.
- **`tags`** are free-form themes ("dx", "onboarding", "publish-pipeline").
  The report generator clusters by them but is not limited to them.

## Sources

| Source | Mechanism | Headless-safe? |
|---|---|---|
| GitHub | `gh` CLI: merged PRs authored, substantial reviews, releases cut, across flox org repos | Yes (`gh auth` token) |
| Linear | Linear GraphQL API with `LINEAR_API_KEY` (personal API key) — **not** the interactive MCP connector | Yes |
| Manual | `/toot` command, interactive | n/a (interactive by nature) |
| Kudos | `/toot --kudos`, paste the Slack message | n/a |

The Linear MCP server connected in interactive sessions may be absent in
headless/cron runs, so the harvest skill talks to Linear's GraphQL API directly
with a personal API key kept in the environment (or `.env`, gitignored). In an
interactive session the skill may use the MCP tools opportunistically, but the
API path is the one that must always work.

**Significance filter.** Not every merged PR is an accomplishment. The
harvester applies judgment: typo fixes, lockfile bumps, and mechanical churn
are skipped or rolled up ("14 dependency/CI maintenance PRs this period" as a
single entry). Borderline items are included — deleting from a ledger is easy,
remembering a forgotten win in February is not.

## Commands (Claude Code project skills)

### `/harvest`
1. Read `state.json` watermarks.
2. Pull new GitHub activity (authored PRs merged, reviews given, releases) and
   completed Linear issues/projects since the watermark.
3. Draft entries: summary + impact from PR/issue bodies, linked issues, and
   diff stats. Apply the significance filter.
4. Dedupe by `id` against `entries.jsonl`, append survivors, update
   `state.json`, commit (`harvest: 2026-09-02, 6 entries`).
5. In interactive runs, show what was added and flag anything it was unsure
   about. In headless runs, commit and exit silently.

### `/toot [text]`
Manual capture, optimized for a 30-second interaction: paste or describe the
thing; the skill asks at most one or two follow-ups (usually "what was the
impact?"), writes the entry, commits. `--kudos` variant tags `source: kudos`
and preserves the quoted praise verbatim in `summary` with attribution.

### `/report <from> <to> [--audience manager|self]`
Generates the drill-down report (format below) from all entries in the window,
writes it to `reports/`, and publishes it as a **private Claude artifact** —
manager gets one link, sharing stays opt-in.

### `/backfill <start-date>`
One-time bootstrap for existing tenure: same pipeline as `/harvest` but from
employment start date, chunked by month so it's resumable. Expected to surface
a lot; runs interactively so borderline calls can be reviewed. After backfill,
a `/toot` session fills the gaps automation can't see (incidents handled,
customers helped, processes influenced).

## Report format: one document, three levels of disclosure

Single self-contained HTML page (artifact-ready), no external navigation.
Everything drills down *in place* via `<details>` — the reader never jumps to
an appendix.

**Level 1 — the glance** (one screen): review window, four or five headline
numbers (PRs shipped, releases cut, projects delivered, kudos received), and
3–6 **theme cards** — the arcs of the story ("Hardened the publish pipeline",
"Onboarding time cut for new environments"). Each card: title + one-sentence
claim.

**Level 2 — the narrative** (expand a theme card): 1–2 paragraphs telling that
arc — situation, what was done, outcome. Written from the entries' `impact`
fields; reads like a self-review section, not a changelog.

**Level 3 — the evidence** (expand within the narrative): the individual
ledger entries backing that theme, each with date, title, one-line impact, and
direct links to the PR/issue/release. Kudos quotes appear here verbatim.

A short "everything else" section at the bottom catches real-but-unthemed work
the same way (collapsed by default). Chronology is available as a sort within
themes, but the report's spine is thematic — reviews reward arcs, not timelines.

## Automation: yes, crontab works

Weekly harvest via user crontab (or `launchd` on macOS, which survives sleep
better — a Monday-morning job on a laptop that was asleep at cron-time never
runs; `launchd` runs it on wake):

```
# crontab: Mondays 9am
0 9 * * 1 cd ~/src/perf-review-input-tracker && claude -p "/harvest" --allowedTools "Bash,Read,Write,Edit"
```

Requirements for headless: `gh auth status` green, `LINEAR_API_KEY` in the
environment, and the harvest skill written to need no interactive input. A
Google Calendar reminder to run `/toot` monthly is the right complement — the
manual entries are the ones automation can never recover, and they rot fastest
in memory.

## Privacy

The repo stays private and local (or on a private remote). Reports may quote
colleagues' kudos — sharing a report means sharing those quotes; the artifact
link stays private until deliberately shared. No Slack tokens, no scraping.

## Implementation order

1. `git init`, directory layout, schema doc (this file).
2. `/toot` — capture works on day one, before any automation exists.
3. `/backfill` + a review pass over what it finds (the "already under my belt"
   problem is the most time-sensitive one).
4. `/harvest` + crontab/launchd entry.
5. `/report` + first real report against the backfilled ledger to validate the
   drill-down format with your actual manager-audience in mind.
