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

## How it works

The `brag` CLI handles the mechanics. It maintains a JSONL ledger deduped by
stable ids, reads date windows, tracks harvest watermarks, and validates
entries against a schema, naming the field it rejects.

Claude Code skills handle the judgment. They ship inside the package, and
`brag init` installs them into your data directory. The skills decide which
merged PRs are accomplishments and which are churn, draft the "so what"
impact line for each entry, cluster a review window into themes, and write
the narrative.

Your data never lives in this repo. `brag init` sets up a separate data
directory: a git repo if you want history and offsite backup (every write
auto-commits), or plain files if you don't.

## Install

### Already on Flox

```bash
flox install imkarrer/brag
```

Run outside an activated project environment, this installs `brag` into your
[default environment](https://flox.dev/docs/tutorials/default-environment),
the flox environment that travels with your shell rather than with any one
project, so `brag` is on your PATH everywhere. Inside an activated project
environment, the same command installs it there instead.

### New to Flox?

[Flox](https://flox.dev) provides reproducible developer environments built
on Nix: the same packages on macOS and Linux, per-project or shell-wide,
without containers. It is also how this project is built, tested, and
distributed.

1. Install Flox from [flox.dev/download](https://flox.dev/download); on
   macOS, `brew install flox`.
2. `flox install imkarrer/brag`. Your first install creates your default
   environment, and the
   [default environment tutorial](https://flox.dev/docs/tutorials/default-environment)
   explains how it hooks into your shell.
3. For a worked example of going all-in,
   [imkarrer/flox-workstation-template](https://github.com/imkarrer/flox-workstation-template)
   runs flox for everyday CLI tools with nix-darwin underneath.

### Without Flox

`brag` is plain TypeScript, run natively by Node.js 23.6 or newer with no
build step:

```bash
git clone https://github.com/imkarrer/brag && cd brag
node --no-warnings src/cli.ts --help
# alias brag='node --no-warnings /path/to/brag/src/cli.ts'
```

You bring your own `node`, `gh`, and `jq`. The flox path brings them for you.

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
  the last run. Automate it weekly with
  `0 9 * * 1 cd <data-dir> && claude -p "/harvest"`, or a launchd job on
  macOS, which fires on wake instead of skipping laptops that were asleep at
  cron time.
- `/report 2026-01-01 2026-06-30` generates the report for a window.

Harvesting needs `gh` authenticated, and a `LINEAR_API_KEY` in the
environment for Linear. When the key is absent, Linear is skipped with a
note.

## The ledger

One JSON object per line in `entries.jsonl`; `brag schema` prints the
fields. The `impact` field is the point of the whole exercise: the
one-sentence "so what" that report narratives are built from. Stable ids
like `gh-pr:owner/repo#123`, `linear:ENG-42`, and `toot:2026-09-02-slug`
make harvesting idempotent, so re-running is always safe.

## Development

```bash
flox activate      # node, gh, jq
npm test           # vitest suite
flox build         # build the package -> ./result-brag/bin/brag
```

Design rationale lives in [SPEC.md](SPEC.md), the vocabulary in
[CONTEXT.md](CONTEXT.md), and decisions in [docs/adr/](docs/adr/).
MIT licensed.
