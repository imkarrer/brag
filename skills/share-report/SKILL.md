---
name: share-report
description: Share a brag report with chosen people via a private Claude artifact
disable-model-invocation: true
---

# /share-report — get a report in front of the right people

Share one report from `reports/` with exactly the people the user chooses.
Default channel: a Claude artifact, because artifacts start private and the
user grants access person by person — the right model for a document that
quotes colleagues by name.

1. Which report: from the arguments, or the newest file in `reports/`. No
   reports yet: stop and point at `/report`.
2. Publish it as an artifact:
   - If this report was already published (by `/report` or a previous
     share), update that artifact rather than minting a second link — find
     its URL with the Artifact tool's listing and pass it as `url`.
   - Otherwise publish `reports/<file>.html` as a new artifact. It is
     private until the user shares it.
3. Hand over the link and say how access works: the artifact stays
   private to the user until they share it from the artifact page —
   `/artifacts` in the Claude Code terminal (o opens, c copies the link) or
   the gallery at claude.ai/code/artifacts — where they pick the specific
   people or org. Re-running `/share-report` after regenerating the report
   updates the same link, so reviewers never hold a stale copy.
4. If the user wants a channel outside Claude:
   - **Send the file.** The report HTML is self-contained; attaching it to
     email or Slack shares it with exactly the recipients. Offer to
     surface the file for them.
   - **GitHub Pages** is not a private channel: sites are readable by
     anyone with the URL on every plan except GitHub Enterprise Cloud,
     whose access control gates on _repo_ read access — so it only fits an
     Enterprise org publishing from a dedicated share-only repo, never
     from the ledger repo. If the user wants that anyway, say all of this
     first and proceed only on a clear yes.

Done when the user has a working link (or the file) and knows how to grant
and revoke access.
