# perf-review-input-tracker

A private, AI-maintained ledger of accomplishments at Flox, and a report
generator that turns any date window into a drill-down story for performance
review input. Design and rationale: [SPEC.md](SPEC.md).

## Commands (in Claude Code, from this directory)

| Command                  | Does                                                 |
| ------------------------ | ---------------------------------------------------- |
| `/toot <what happened>`  | Record one accomplishment or pasted kudos by hand    |
| `/backfill <start-date>` | One-time bootstrap from employment start date        |
| `/harvest`               | Pull new GitHub + Linear activity since the last run |
| `/report <from> <to>`    | Generate the glance/drill-down report for a window   |

## Setup

- `flox activate` — provides node, gh, jq. Tests: `npm test`.
- `gh auth status` must be green.
- `LINEAR_API_KEY` (a personal Linear API key) in the environment or `.env`
  (gitignored) — required for headless harvests; interactive runs can fall
  back to the Linear MCP connector.
- Weekly automation: `claude -p "/harvest"` from cron or launchd (launchd
  survives laptop sleep — see SPEC.md "Automation").
