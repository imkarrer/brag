# brag

`brag` keeps a running, append-only record of what you shipped: harvested
automatically from GitHub and Linear, captured by hand for everything else.
When review season comes, it turns any date window into a report your
manager can read in a minute and drill into as deep as they like.

The practice it automates is Julia Evans'
[brag document](https://jvns.ca/blog/brag-documents/). Her post is the best
argument for keeping one; read it first. The short version: you will not
remember what you did in February, so write it down when it happens.

Built and distributed with [Flox](https://flox.dev).

## Install

```bash
flox install imkarrer/brag
```

Run outside an activated project environment, this lands `brag` in your
[default environment](https://flox.dev/docs/tutorials/default-environment),
so it's on your PATH everywhere. New to Flox? Install it from
[flox.dev/download](https://flox.dev/download) (macOS: `brew install flox`)
and run the same command.

Without Flox: `brag` is plain TypeScript, run natively by Node.js 23.6+.

```bash
git clone https://github.com/imkarrer/brag && cd brag
node --no-warnings src/cli.ts --help
```

## Quickstart

```bash
brag init --git                   # data dir at ~/.local/share/brag; override with BRAG_HOME or --data-dir
cd ~/.local/share/brag && claude  # open Claude Code in your data dir
```

Then, inside Claude Code:

- `/toot <what you did>` records one accomplishment, or pastes in kudos
  someone gave you. Takes about 30 seconds.
- `/backfill 2025-04-01` is the one-time bootstrap from your start date. It
  ends with a sweep for wins that left no digital trail.
- `/harvest` pulls merged PRs, reviews, and completed Linear issues since
  the last run; `brag schedule` makes it weekly.
- `/report 2026-01-01 2026-06-30` generates the window's report: an HTML
  page and a Markdown twin whose drill-down GitHub renders natively.

Harvesting needs `gh` authenticated, and a `LINEAR_API_KEY` in the
environment for Linear (skipped with a note when absent).

## Sharing with specific people

Reports quote colleagues by name, so every sharing lane is deliberate,
never public:

- **A standing reviewer** (your manager): add them as a read-only
  collaborator on your private data repo; they read `reports/<window>.md`
  on GitHub, drill-down included. Note that a collaborator sees the whole
  ledger, not just the curated reports.
- **One person, one report**: `/share-report` publishes the report as a
  private Claude artifact; you grant access person by person.
- **No accounts involved**: send the self-contained HTML file directly.

## Skill or plain CLI?

Every workflow works with nothing but the CLI:

```bash
brag toot "Unblocked the demo" --impact "Demo shipped on time."
brag candidates --since 2026-08-01 > candidates.jsonl   # deduped drafts from GitHub + Linear
$EDITOR candidates.jsonl                                # fill in impact, delete the churn
brag append < candidates.jsonl
brag report --from 2026-01-01 --to 2026-06-30
```

The skills carry the judgment; the CLI carries the mechanics:

| Task    | Plain CLI                                                                    | With the skill                                                                                                                            |
| ------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Capture | `brag toot` with flags; you write the impact line                            | `/toot` drafts the impact from what you said, classifies pasted praise as kudos, infers the date                                          |
| Harvest | `brag candidates` emits every PR and issue; you fill every impact, cut churn | `/harvest` filters churn into rollups, drafts each impact from the PR body, and flags borderline calls instead of deciding silently       |
| Report  | `brag report` renders a tag-grouped changelog                                | `/report` finds the 3–6 themes, writes the narrative arc for each, and builds the glance → story → evidence page a manager actually reads |

## The ledger

One JSON object per line in `entries.jsonl`; `brag schema` prints the
fields. The `impact` field is the point of the whole exercise: the
one-sentence "so what" that report narratives are built from. Stable ids
like `gh-pr:owner/repo#123` make harvesting idempotent, so re-running is
always safe. `brag append` rejects an empty impact — nothing enters the
ledger without a "so what", whether a human or an agent wrote it.

## Development

```bash
flox activate      # node, gh, jq
npm test           # vitest suite
flox build         # build the package -> ./result-brag/bin/brag
```

How the pieces fit: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Design
rationale: [SPEC.md](SPEC.md). Vocabulary: [CONTEXT.md](CONTEXT.md).
Decisions and rejected alternatives: [docs/adr/](docs/adr/). MIT licensed.
