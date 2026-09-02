# Claude Code skills ship in the package and install into the data dir

The work splits two ways: the CLI does deterministic mechanics
(append/dedupe/validate, windows, watermarks) and Claude Code skills do
judgment (significance, impact drafting, theming, narrative). The skills are
distributed inside the flox package and copied by `brag init` into
`<data-dir>/.claude/skills/`, because the data dir is where users run Claude
Code — a skill in the tool repo would be invisible there. Alternatives
(a Claude Code plugin marketplace entry, telling users to clone the tool
repo) added a second install step or put sessions in the wrong directory.
Consequence: skill edits reach users only through a republished package,
and `brag init` re-copies (overwrites) them on re-run.
