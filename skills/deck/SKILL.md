---
name: deck
description: Render a brag window as a Marp slide deck (PDF) for presenting at a review
disable-model-invocation: true
---

# /deck — the review window as slides

Turn a date window into a short Marp deck: the artifact you present in the
review meeting, where the report page is the one you send before it. Marp
ships in the brag package, so `marp` is on PATH wherever brag is.

1. Window from the arguments; if absent, ask. Read it:
   `brag read --from <from> --to <to>`.
2. Cluster and rank exactly as `/report` does (3–6 themes; if a report for
   this window already exists in `reports/`, reuse its themes and order —
   the deck and the page must tell the same story). Reviews-style
   supporting work goes on the last content slide.
3. Write `reports/<from>--<to>.deck.md` with Marp frontmatter
   (`marp: true`, `paginate: true`) and this shape, one idea per slide:
   - **Title**: name, window, the one-line thesis.
   - **Numbers**: the headline stats, nothing else.
   - **One slide per theme**: the claim as the header, at most three
     evidence bullets, each ending with its `repo#number`.
   - **Kudos verbatim**, on its own slide, quoted and attributed — let
     someone else's words close the argument.
   - **Closer**: the window's through-line in one sentence.
     Slides are prompts to talk over, not documents: no paragraph on a
     slide, no bullet deeper than one level.
4. Render PDF:

   ```bash
   marp reports/<w>.deck.md --pdf --allow-local-files -o reports/<w>.pdf
   ```

   PDF export needs a Chrome/Chromium/Edge on the machine (marp finds it
   itself; `CHROME_PATH` overrides). If none is found, fall back to
   `marp reports/<w>.deck.md -o reports/<w>.deck.html` — browser-free —
   and tell the user the HTML deck opens in anything and prints to PDF
   from there.

5. Commit both the `.deck.md` and the rendered output; push if the data
   repo has a remote. Hand the user the PDF path (or send them the file).

Done when the user has the rendered deck and it tells the same story as
the window's report.
