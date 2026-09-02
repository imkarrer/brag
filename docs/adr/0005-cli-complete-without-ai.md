# The CLI is usable end-to-end with zero AI

Every workflow works with nothing but the CLI: `brag toot` captures by hand,
`brag candidates` fetches deduped draft entries from GitHub and Linear,
`brag append` enforces the schema, and `brag report` renders a mechanical
tag-grouped page. Agents make each step better — drafting impact lines,
filtering churn, theming the narrative — but never merely possible. This
also moved the fetch mechanics out of skill markdown into tested code, so
the skills carry judgment only (sharpening ADR 0004's split, not reversing
it). The forcing function stays in the schema: candidates ship with
`impact: ""`, and append rejects an empty impact, so no entry enters the
ledger without a "so what" regardless of who wrote it.
