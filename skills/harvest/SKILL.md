---
name: harvest
description: Harvest new GitHub and Linear accomplishments into the brag ledger
disable-model-invocation: true
---

# /harvest — automated capture

Pull new activity since the last run into the brag ledger. Runs headless
from cron (`claude -p "/harvest"`) as well as interactively — never block on
a question; when unsure, include the entry and flag it.

1. Watermarks: `brag watermark get <source>` for `github` and `linear`.
   `null` means never harvested — use 30 days ago and say so. Record the
   run's start time now; it becomes the new watermark.
2. Harvest both sources per `.agents/skills/harvesting.md`: queries,
   significance filter, entry drafting, rollups.
3. Append via `brag append` (it dedupes, validates, and auto-commits in
   git-backed data dirs), then set each successfully harvested source's
   watermark to the run start time. If the data repo has a remote, push.
4. Interactive runs: show what was added and anything borderline. Headless
   runs: report and exit; zero new entries still advances watermarks.

Done when both watermarks are advanced (or a skipped source is reported,
e.g. LINEAR_API_KEY missing) and any git remote is pushed.
