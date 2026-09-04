# Architecture

How brag's pieces fit. The "why" behind each choice lives in
[docs/adr/](adr/); the vocabulary in [CONTEXT.md](../CONTEXT.md).

## Mechanics / judgment split

The `brag` CLI owns everything deterministic: an append-only JSONL ledger
deduped by stable ids, inclusive date-window reads, per-source harvest
watermarks, schema validation that names the field it rejects, candidate
fetching from GitHub (`gh`) and Linear (GraphQL, `LINEAR_API_KEY`), and
report rendering. All of it is tested; none of it needs a model (ADR 0005).

Agent skills own the judgment: which merged PRs are accomplishments rather
than churn, the "so what" impact line per entry, theme clustering, and the
narrative. They ship inside the package and consume the CLI (ADR 0004).

## Tool / data separation

The tool repo never contains anyone's entries (ADR 0001). `brag init`
creates a user-owned data dir, resolved in order: `--data-dir` flag >
`$BRAG_HOME` > `~/.config/brag/config.json` > `~/.local/share/brag`. If the
data dir is a git repo, every append and watermark write auto-commits;
otherwise it's plain files.

Data dir layout:

```
entries.jsonl      # the ledger (ADR 0002: JSONL, not SQLite)
state.json         # harvest watermarks per source
reports/           # generated reports
.agents/skills/    # canonical skills home (ADR 0006)
.claude/skills     # symlink adapter, created when Claude Code is detected
```

## Skills installation

`brag init` copies the shipped skills into `<data-dir>/.agents/skills/`
(harness-neutral), then detects installed harnesses by their home
directory and creates symlink adapters for any that don't read `.agents` —
Claude Code gets `.claude/skills -> ../.agents/skills`. Re-running init
refreshes the skills (normalizing the read-only permissions a Nix-store
copy would otherwise inherit) and migrates pre-0.5.0 real directories to
the symlink. Supporting a new harness is one row in the adapter table in
`src/cli.ts`.

## The ledger

One JSON object per line; `brag schema` prints the fields and enums. Ids
are natural keys (`gh-pr:<owner>/<repo>#<n>`, `gh-review:...`,
`linear:<identifier>`, `toot:<date>-<slug>`, `kudos:<date>-<slug>`) and are
the dedupe mechanism at both `append` and `candidates`. `impact` is
required non-empty by the schema — the forcing function that keeps the
ledger a record of accomplishments rather than activity.

## Reports

Each window renders as sibling documents telling one story (ADR 0007/0008):

- `reports/<from>--<to>.html` — self-contained page; drill-down via
  `<details>`; print-ready (all sections expand on print).
- `reports/<from>--<to>.md` — the same drill-down as GitHub-flavored
  Markdown, rendered natively by GitHub for repo collaborators.

The CLI's `brag report` produces mechanical tag-grouped versions of both;
the `/report` skill produces the themed narrative versions.

## Automation

`brag schedule` installs the weekly harvest: a launchd agent on macOS
(fires on wake), a marker-managed crontab line on Linux, and a plain
refusal with the manual command on anything else. The job enters the data
dir, sources `.env` (for `LINEAR_API_KEY`), restores the install-time
PATH, and runs `claude -p /harvest` headless.

## Packaging and distribution

The repo is its own dev environment (`flox activate`). `[build.brag]` in
`.flox/env/manifest.toml` packages the TypeScript sources with `nodejs` in
the runtime closure — node ≥23.6 runs the `.ts` directly, no build step
(ADR 0003) — and publishes to FloxHub as `imkarrer/brag`. CI tests on
Linux for every push and publishes per-platform on `v*` tags.
