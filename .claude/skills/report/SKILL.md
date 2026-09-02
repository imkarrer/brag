---
name: report
description: Generate a drill-down performance report for a date window
disable-model-invocation: true
---

# /report — the drill-down story

Turn a date window of ledger entries into the single-page report defined in
`SPEC.md` ("Report format: one document, three levels of disclosure"):
glance → theme narratives → in-place evidence, all via `<details>`, no
appendix.

1. Window from the arguments (`/report 2026-01-01 2026-06-30`); if absent,
   ask. Audience defaults to manager.
2. Read the window:

   ```bash
   flox activate -- node src/cli.ts read --from <from> --to <to>
   ```

   Fewer than ~5 entries: tell the user the window looks thin and confirm
   before generating.

3. Cluster entries into 3–6 themes — arcs of the story, seeded by tags but
   ruled by judgment. Real-but-unthemed work goes to a collapsed
   "everything else" section, never dropped: every entry in the window
   appears exactly once in the report.
4. Write the narrative per theme from the entries' `impact` fields —
   situation, what was done, outcome. Self-review prose, not a changelog.
5. Load the `artifact-design` skill, then write the report to
   `reports/<from>--<to>.html` as a self-contained page and publish it as a
   private artifact. Every evidence row links its PR/issue/release directly.
6. Commit: `report: <from>..<to>`.

Done when the artifact link is delivered, every window entry is in the page,
and the commit exists.
