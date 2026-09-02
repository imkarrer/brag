---
name: backfill
description: Bootstrap the brag ledger from a start date to today
disable-model-invocation: true
---

# /backfill — history bootstrap

One-time interactive pass that fills the ledger from a start date (typically
employment start) to the current github/linear watermarks, or today if none.
Expect volume; work month by month so the run is resumable.

1. Start date from the arguments; if absent, ask.
2. For each month from start date to now, run
   `brag candidates --since <month-start> --until <month-end>` and curate
   per `.agents/skills/harvesting.md`, appending that month before moving
   on. Already-captured ids never reappear as candidates — resuming an
   interrupted backfill is just running /backfill again.
3. This run is interactive: show each month's additions, and put borderline
   calls in front of the user instead of deciding silently.
4. After the last month, set both watermarks to now (`brag watermark set`),
   then surface what automation cannot see: ask the user for incidents
   handled, people mentored, customers helped, docs or process work — and
   record each answer as a toot/kudos entry (capture style:
   `.agents/skills/toot/SKILL.md`).

Done when every month from start date to now is appended and the user has
answered (or declined) the non-digital sweep.
