---
name: toot
description: Record an accomplishment or pasted kudos in the brag ledger
disable-model-invocation: true
---

# /toot — manual capture

Record one accomplishment in the brag ledger. Optimize for a 30-second
interaction: the user's time is the scarce resource, not detail.

1. Take the accomplishment from the arguments. If empty, ask what it was —
   one question only.
2. Classify: text quoting someone else's praise (a pasted Slack message,
   a thank-you) is kudos — `source: "kudos"`, `kind: "kudos"`, the quote
   preserved verbatim in `summary` with attribution ("@sam in #eng: '...'").
   Everything else is `source: "manual"`, `kind: "toot"`.
3. Draft the fields: a short title; `--date` is when it happened, not today
   — infer from the text if stated; draft `--impact` yourself from what was
   said; `--tags` reusing existing ones where possible.
4. Ask at most one follow-up, and only when you cannot draft it: usually
   "what was the impact?" — or the date, if neither stated nor today-implied.
5. Record it and show the user the entry that landed:

   ```bash
   brag toot "<title>" --impact "<impact>" [--kudos --summary "<verbatim quote>"] [--date YYYY-MM-DD] [--tags a,b] [--links url]
   ```

   "already in ledger" means the id collides — adjust the title or date.
   Git-backed data dirs auto-commit; if the repo has a remote, push.

Done when the CLI prints the recorded entry.
