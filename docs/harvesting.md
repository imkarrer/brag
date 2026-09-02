# Harvest procedure

Shared reference for the `/harvest` and `/backfill` skills: how to pull
accomplishments from each source and turn them into ledger entries. The entry
schema's source of truth is `src/ledger.ts`; the CLI rejects invalid entries
with the field named, so draft, pipe, and fix on error.

All commands run inside the flox environment: `flox activate -- <cmd>`.

## GitHub (gh CLI)

Identify the user with `gh api user --jq .login`. For a window `[SINCE, UNTIL]`:

```bash
# Merged PRs authored
gh search prs --author "$LOGIN" --owner flox --merged \
  --merged-at "$SINCE..$UNTIL" --limit 200 \
  --json repository,number,title,url,closedAt

# Substantial reviews given (exclude own PRs)
gh search prs --reviewed-by "$LOGIN" --owner flox --merged \
  --merged-at "$SINCE..$UNTIL" --limit 200 \
  --json repository,number,title,url,closedAt,author
```

For each candidate PR, fetch the body for impact drafting:
`gh pr view <url> --json body,additions,deletions,labels`.

- id: `gh-pr:<owner>/<repo>#<n>` for authored, `gh-review:<owner>/<repo>#<n>`
  for reviews. `date` is the merge date (YYYY-MM-DD).
- Releases: only worth checking on repos where the user cut them — ask, or in
  headless runs skip. id: `gh-release:<owner>/<repo>@<tag>`.

## Linear (GraphQL API)

Use `LINEAR_API_KEY` from the environment — the MCP connector is absent in
headless runs, so the API path is the one that must always work. If the key is
missing in an interactive run, fall back to the Linear MCP tools; in a
headless run, skip Linear and note it in the commit message.

```bash
curl -s https://api.linear.app/graphql \
  -H "Authorization: $LINEAR_API_KEY" -H "Content-Type: application/json" \
  -d @- <<'EOF'
{"query": "query($after: String) { issues(first: 100, after: $after, filter: {assignee: {isMe: {eq: true}}, completedAt: {gte: \"SINCE\", lte: \"UNTIL\"}}) { pageInfo { hasNextPage endCursor } nodes { identifier title description url completedAt project { name } } } }"}
EOF
```

Substitute SINCE/UNTIL (ISO timestamps) and page with `after` until
`hasNextPage` is false.

- id: `linear:<identifier>` (e.g. `linear:ENG-123`). `date` from `completedAt`.
- A completed Linear _project_ the user led is one `project_shipped` entry,
  not a repeat of its issues.

## Significance filter

The ledger records accomplishments, not activity. Judge each candidate:

- **Keep**: features, fixes with user-visible or reliability impact, releases,
  design/infra work, reviews that materially shaped someone else's change.
- **Roll up**: dependency bumps, lockfile updates, CI churn, typo fixes —
  one entry per window per repo ("N maintenance PRs in flox/flox"), id
  `gh-pr:<owner>/<repo>#rollup-<SINCE>`, kind `pr_merged`.
- **Borderline**: include it. Deleting a line later is easy; remembering a
  forgotten win at review time is not.
- A Linear issue and its implementing PR are one accomplishment: keep the PR
  entry, add the issue URL to its `links`, and skip the Linear entry.

## Drafting entries

`impact` is the load-bearing field — the "so what" a reviewer cares about,
drafted from the PR/issue body and linked context, one or two sentences,
concrete over grand ("cut activation time ~40% for composed envs" beats
"improved performance"). `summary` says what was done; `tags` are free-form
themes reused across entries where possible (check existing tags with
`jq -r .tags[] ledger/entries.jsonl | sort -u`).

## Append and commit

Pipe drafted entries as a JSON array to the CLI — it dedupes by id and
validates:

```bash
flox activate -- sh -c 'node src/cli.ts append < drafted.json'
```

Update the watermark per harvested source to the run's start time:

```bash
flox activate -- node src/cli.ts watermark set github "$RUN_STARTED_AT"
```

Commit ledger and state together: `harvest: <date>, <n> entries` (or
`backfill: <month>, <n> entries`).
