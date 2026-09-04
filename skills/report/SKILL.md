---
name: report
description: Generate a drill-down performance report for a date window
disable-model-invocation: true
---

# /report — the drill-down story

Turn a date window of ledger entries into a single-page report a manager
reads top-down: glance → theme narratives → in-place evidence, all via
`<details>`, no appendix.

1. Window from the arguments (`/report 2026-01-01 2026-06-30`); if absent,
   ask. Audience defaults to manager. (`brag report --from --to` renders a
   mechanical tag-grouped page with no themes or narrative — this skill
   exists to do better than that, so don't reach for it here.)
2. Read the window: `brag read --from <from> --to <to>`. Fewer than ~5
   entries: tell the user the window looks thin and confirm before
   generating.
3. Cluster entries into 3–6 themes — arcs of the story, seeded by tags but
   ruled by judgment. Real-but-unthemed work goes to a collapsed
   "everything else" section, never dropped: every entry in the window
   appears exactly once in the report.
4. Write the narrative per theme from the entries' `impact` fields —
   situation, what was done, outcome. Self-review prose, not a changelog.
5. Structure the page in three levels:
   - **Glance** (one screen): the window, 4–5 headline numbers (PRs shipped,
     releases, projects, kudos), and the theme cards — title plus a
     one-sentence claim each.
   - **Narrative**: each theme card expands to its 1–2 paragraph arc.
   - **Evidence**: within each narrative, an expandable list of the backing
     entries — date, title, one-line impact, direct PR/issue links; kudos
     quoted verbatim.
6. Write the report twice, same themes and narrative in both:
   - `reports/<from>--<to>.html` — self-contained page (load the
     `artifact-design` skill first), published as a private artifact; the
     link is shared deliberately, person by person.
   - `reports/<from>--<to>.md` — the same story as GitHub-flavored
     Markdown using `<details>` for the drill-down. This is the copy a
     read-only collaborator on the data repo reads, rendered by GitHub
     itself with the same expand-in-place experience.
     Commit both; push if the data repo has a remote.

Done when both files are committed, the artifact link is delivered, and
every window entry is in each exactly once.
