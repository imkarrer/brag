# brag

An AI-centric accomplishment ledger for performance reviews. `brag` keeps a
running, append-only record of what you shipped — harvested automatically
from GitHub and Linear, captured by hand for everything else — and turns any
date window into a drill-down report your manager can read in a minute and
dig into as deep as they like.

Built with, packaged by, and installed through [Flox](https://flox.dev).

## How it works

Two halves, deliberately split:

- **The `brag` CLI** (this repo, installable) handles the deterministic
  mechanics: an append-only JSONL ledger deduped by stable ids, date-window
  reads, harvest watermarks, and schema validation that names the field it
  rejects.
- **Claude Code skills** (shipped inside the package, installed into your
  data dir by `brag init`) handle the judgment: deciding which merged PRs are
  accomplishments vs. churn, drafting the "so what" impact line, clustering a
  review window into themes, and writing the narrative.

Your data never lives in this repo. `brag init` sets up a separate data
directory — a git repo if you want history and offsite backup (every write
auto-commits), or plain files if you don't.

## Install

### Already on Flox

```bash
flox install imkarrer/brag
```

Run outside an activated project environment, this installs `brag` into your
[**default environment**](https://flox.dev/docs/tutorials/default-environment)
— the flox environment that travels with your shell rather than with any one
project, so `brag` is on your PATH everywhere. (Inside an activated project
environment, the same command installs it there instead.)

### New to Flox?

[Flox](https://flox.dev) gives you reproducible developer environments built
on Nix — same packages on macOS and Linux, per-project or shell-wide, no
containers. It's also how this project is built, tested, and distributed.

1. Install Flox from [flox.dev/download](https://flox.dev/download) (macOS:
   `brew install flox`).
2. `flox install imkarrer/brag` — your first install creates your default
   environment; the [default environment tutorial](https://flox.dev/docs/tutorials/default-environment)
   explains how it hooks into your shell.
3. Want to see how far the flox-for-daily-CLI-life idea goes?
   [imkarrer/flox-workstation-template](https://github.com/imkarrer/flox-workstation-template)
   is a worked example: flox for everyday tools, nix-darwin underneath.

### Without Flox

`brag` is plain TypeScript run natively by Node.js ≥ 23.6 (type stripping) —
no build step:

```bash
git clone https://github.com/imkarrer/brag && cd brag
node --no-warnings src/cli.ts --help    # alias it: alias brag='node --no-warnings /path/to/brag/src/cli.ts'
```

You bring your own `node`, `gh`, and `jq`; the flox path brings them for you.

## Quickstart

```bash
brag init --git                   # data dir at ~/.local/share/brag (override: BRAG_HOME or --data-dir)
cd ~/.local/share/brag && claude  # open Claude Code in your data dir
```

Then, inside Claude Code:

- `/toot <what you did>` — record one accomplishment (or paste kudos someone
  gave you) in ~30 seconds.
- `/backfill 2025-04-01` — one-time bootstrap from your start date; ends with
  a sweep for wins that left no digital trail.
- `/harvest` — pull merged PRs, reviews, and completed Linear issues since
  the last run. Automate it weekly:
  `0 9 * * 1 cd <data-dir> && claude -p "/harvest"` (or a launchd job on
  macOS, which fires on wake instead of silently skipping sleeping laptops).
- `/report 2026-01-01 2026-06-30` — generate the glance/drill-down report
  for a window.

Harvesting needs `gh` authenticated, and a `LINEAR_API_KEY` in the
environment for Linear (skipped with a note when absent).

## The ledger

One JSON object per line in `entries.jsonl`; `brag schema` prints the
fields. The `impact` field is the point of the whole exercise — the
one-sentence "so what" that report narratives are built from. Stable ids
(`gh-pr:owner/repo#123`, `linear:ENG-42`, `toot:2026-09-02-slug`) make
harvesting idempotent: re-running is always safe.

## Development

```bash
flox activate      # node, gh, jq — the whole toolchain
npm test           # vitest suite
flox build         # build the package -> ./result-brag/bin/brag
```

Design rationale lives in [SPEC.md](SPEC.md). MIT licensed.
