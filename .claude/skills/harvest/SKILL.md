---
name: harvest
description: Harvest new GitHub and Linear accomplishments into the ledger
disable-model-invocation: true
---

# /harvest — automated capture

Pull new activity since the last run into `ledger/entries.jsonl`. Runs
headless from cron (`claude -p "/harvest"`) as well as interactively — never
block on a question; when unsure, include the entry and flag it.

1. Watermarks: `flox activate -- node src/cli.ts watermark get <source>` for
   `github` and `linear`. `null` means never harvested — use 30 days ago and
   say so. Record the run's start time now; it becomes the new watermark.
2. Harvest both sources per `docs/harvesting.md`: queries, significance
   filter, entry drafting, rollups.
3. Append via the CLI (it dedupes and validates), set each successfully
   harvested source's watermark to the run start time, and commit ledger +
   state: `harvest: <date>, <n> entries`.
4. Interactive runs: show what was added and anything borderline. Headless
   runs: commit and exit; zero new entries still updates watermarks and
   commits state.

Done when both watermarks are advanced (or a skipped source is named in the
commit message) and the commit exists.
