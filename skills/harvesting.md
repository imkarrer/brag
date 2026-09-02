# Harvest procedure

Shared reference for the `/harvest` and `/backfill` skills: how to turn raw
activity into ledger entries. The mechanics live in the CLI; the skill's job
is judgment.

## Fetch candidates

```bash
brag candidates --since <YYYY-MM-DD> --until <YYYY-MM-DD> > candidates.jsonl
```

This emits draft entries (JSONL) for merged PRs authored, PRs reviewed, and
completed Linear issues — already deduped against the ledger, so only new
ids appear. `--since` defaults to each source's watermark. Scope GitHub with
repeated `--owner <org>` flags when the unfiltered list is noisy. Linear
needs `LINEAR_API_KEY` in the environment; without it the CLI says so on
stderr and skips Linear — report that skip.

Drafts arrive with `impact: ""` and `summary` set to the title. `brag
append` rejects an empty impact, which is the point: nothing enters the
ledger without a "so what".

## Significance filter

The ledger records accomplishments, not activity. Judge each candidate:

- **Keep**: features, fixes with user-visible or reliability impact,
  releases, design/infra work, reviews that materially shaped someone
  else's change.
- **Roll up**: dependency bumps, lockfile updates, CI churn, typo fixes —
  replace them with one entry per window per repo ("N maintenance PRs in
  owner/repo"), id `gh-pr:<owner>/<repo>#rollup-<SINCE>`, kind `pr_merged`.
- **Borderline**: include it. Deleting a line later is easy; remembering a
  forgotten win at review time is not.
- A Linear issue and its implementing PR are one accomplishment: keep the
  PR entry, add the issue URL to its `links`, and drop the Linear draft.

## Draft impact and tags

For each kept candidate, fetch context and write the fields:

```bash
gh pr view <url> --json body,additions,deletions,labels
```

`impact` is one or two sentences, concrete over grand ("cut activation time
~40% for composed envs" beats "improved performance"). Improve `summary`
beyond the raw title where the body supports it. Reuse existing tags where
possible (`brag read | jq -r '.tags[]' | sort -u`).

## Append

```bash
brag append < curated.jsonl
brag watermark set <source> <run-start-time>   # per successfully fetched source
```

Append validates and auto-commits in git-backed data dirs. Push if the data
repo has a remote.
