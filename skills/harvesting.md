# Harvest procedure

Shared reference for the `/harvest` and `/backfill` skills: how to pull
accomplishments from each source and turn them into brag ledger entries.
`brag schema` prints the entry fields; `brag append` rejects invalid entries
with the field named, so draft, pipe, and fix on error.

## GitHub (gh CLI)

Identify the user with `gh api user --jq .login`. The org/owner list to
search comes from `github_owners` in `~/.config/brag/config.json`; if absent,
ask once and save it there. For a window `[SINCE, UNTIL]`:

```bash
# Merged PRs authored
gh search prs --author "$LOGIN" --owner "$OWNER" --merged \
  --merged-at "$SINCE..$UNTIL" --limit 200 \
  --json repository,number,title,url,closedAt

# Substantial reviews given (exclude own PRs)
gh search prs --reviewed-by "$LOGIN" --owner "$OWNER" --merged \
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

Use `LINEAR_API_KEY` from the environment — MCP connectors are absent in
headless runs, so the API path is the one that must always work. If the key
is missing in an interactive run, fall back to Linear MCP tools when
available; in a headless run, skip Linear and report it.

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
  one entry per window per repo ("N maintenance PRs in owner/repo"), id
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
themes reused across entries where possible (existing tags:
`brag read | jq -r '.tags[]' | sort -u`).

## Append

Pipe drafted entries as a JSON array to `brag append` — it dedupes by id,
validates, and auto-commits when the data dir is git-backed. Then
`brag watermark set <source> <run-start-time>` per harvested source, and push
if the data repo has a remote.
