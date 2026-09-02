---
name: publish-report
description: Publish brag reports to GitHub Pages from a git-backed data repo
disable-model-invocation: true
---

# /publish-report — share reports via GitHub Pages

Put chosen reports from `reports/` on a GitHub Pages site so supervisors
and peers get a link instead of an attachment. Only for git-backed data
dirs with a GitHub remote.

1. Which report: from the arguments, or default to the newest file in
   `reports/`. No reports yet: stop and point at `/report`.
2. Preconditions, in order, stopping with instructions at the first miss:
   - data dir is a git repo (`git rev-parse`);
   - it has a GitHub remote (`git remote get-url origin`) — if not, suggest
     `gh repo create <owner>/<repo> --private --source . --push`.
3. **Visibility gate — never skip.** Check `gh repo view --json visibility`.
   Tell the user exactly what publishing means before touching anything:
   - GitHub Pages sites are **readable by anyone with the URL**, even when
     the repo is private (Pro/Team). Only GitHub Enterprise Cloud offers
     access-controlled Pages.
   - On the Free plan, Pages does not build from private repos at all —
     expect enabling to fail there.
   - Reports quote kudos with colleagues' names. Publishing shares those
     words on the open web.

   Ask for explicit confirmation, and offer the private alternative: the
   report HTML is self-contained, so sending the file itself (email, Slack,
   a claude.ai artifact) shares it without a public URL. Proceed only on a
   clear yes.

4. Publish the site content:
   - copy the chosen report(s) into `docs/`;
   - write `docs/index.html` linking every published report (window as link
     text, newest first) — regenerate it, don't hand-append;
   - commit (`brag: publish report <window>`) and push.
5. Enable Pages if it isn't already:

   ```bash
   gh api repos/{owner}/{repo}/pages 2>/dev/null ||
   gh api -X POST repos/{owner}/{repo}/pages \
     -f "source[branch]=main" -f "source[path]=/docs"
   ```

   On failure, report the API error plainly — on Free + private repo the
   fix is upgrading the plan or making the repo public, and making a brag
   ledger public is almost never right; recommend the send-the-file route
   instead.

6. Give the user the link: `html_url` from
   `gh api repos/{owner}/{repo}/pages`, plus the report filename. Note the
   first build can take a minute, and that unpublishing is deleting the
   file from `docs/` and pushing.

Done when the user has the report URL (or declined at the visibility gate
and, if they wanted sharing, got the file-sending alternative).
