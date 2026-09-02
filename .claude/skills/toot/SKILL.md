---
name: toot
description: Record an accomplishment or pasted kudos in the performance ledger
disable-model-invocation: true
---

# /toot — manual capture

Record one accomplishment in `ledger/entries.jsonl`. Optimize for a 30-second
interaction: the user's time is the scarce resource, not detail.

1. Take the accomplishment from the arguments. If empty, ask what it was —
   one question only.
2. Classify: text quoting someone else's praise (a pasted Slack message,
   a thank-you) is kudos — `source: "kudos"`, `kind: "kudos"`, the quote
   preserved verbatim in `summary` with attribution ("@sam in #eng: '...'").
   Everything else is `source: "manual"`, `kind: "toot"`.
3. Draft the full entry (schema: `src/ledger.ts`). id `toot:<date>-<slug>` or
   `kudos:<date>-<slug>`; `date` is when it happened, not today — infer from
   the text if stated. Draft `impact` yourself from what was said.
4. Ask at most one follow-up, and only when you cannot draft it: usually
   "what was the impact?" — or the date, if neither stated nor today-implied.
5. Append and show the user the entry that landed:

   ```bash
   echo '[<entry>]' | flox activate -- node src/cli.ts append
   ```

   On a validation error, fix the named field and retry. `skipped` means the
   id already exists — pick a distinct slug.

6. Commit ledger changes: `toot: <short title>`.

Done when the CLI reports the entry in `added` and the commit exists.
