# JSONL ledger, not SQLite

The ledger is `entries.jsonl` — one JSON object per line, appended, deduped
by stable natural ids. A whole tenure is a few thousand entries, so every
query is a fast linear scan, and JSONL buys what SQLite can't: readable
`git diff` per write (the auto-commit feature depends on it), grep, and
hand-editability. SQLite becomes worth revisiting only with concurrent
writers, frequent ad-hoc relational queries, or ~100k+ rows — none plausible
for a personal ledger. The schema is kept flat so migration stays one
`sqlite-utils insert` command if that ever changes.
