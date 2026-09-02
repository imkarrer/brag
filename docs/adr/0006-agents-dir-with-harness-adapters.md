# Skills install to .agents/skills, with per-harness symlink adapters

Amends ADR 0004's install location. Skills land canonically in
`<data-dir>/.agents/skills/` — a harness-neutral home, matching the
AGENTS.md convention — instead of belonging to any one agent's directory.
`brag init` then detects which harnesses are installed on the machine (by
their home directory, e.g. `~/.claude`) and creates a symlink adapter for
any that don't read `.agents` — Claude Code gets
`.claude/skills -> ../.agents/skills`. Re-init migrates a real
`.claude/skills` directory from older versions to the symlink. The point:
supporting a new harness is one row in the adapter table, not a second
copy of the skills.
