# Prior art: brag documents and accomplishment-tracking tools

Researched 2026-09-02 against primary sources (project repos, product sites, authors' own posts).
Repo metadata (stars, last push, license) read via `gh api` on 2026-09-02.

## Summary

| Tool / source                         | Capture model                                                | Output                                          | Status (last push)                                            | Link                                                                                 |
| ------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Julia Evans' brag document post       | Manual (biweekly or marathon session)                        | Structured doc via template                     | Post, 2019                                                    | [jvns.ca](https://jvns.ca/blog/brag-documents/)                                      |
| bragdoc.ai (edspencer/bragdoc-ai)     | Git commits via CLI + chat + email; LLM extraction           | AI-generated review docs, weekly updates        | Active (2026-08), MIT                                         | [repo](https://github.com/edspencer/bragdoc-ai)                                      |
| bostonaholic/reflect                  | Harvested: GitHub PRs/reviews via PAT                        | Raw contribution list; optional OpenAI brag doc | Active (2026-09), MIT                                         | [repo](https://github.com/bostonaholic/reflect)                                      |
| jstanier/bragdoc                      | Harvested: Linear issues via API                             | AI-summarized weekly brag doc (markdown)        | Active (2025-12), MIT                                         | [repo](https://github.com/jstanier/bragdoc)                                          |
| naamanu/bragbot                       | Harvested: local git history                                 | Generated brag document                         | Active (2026-01), MIT                                         | [repo](https://github.com/naamanu/bragbot)                                           |
| bovem/brag                            | Manual CLI journaling into git-versioned markdown            | Markdown brag doc (no AI)                       | Stale (2024-05), MIT                                          | [repo](https://github.com/bovem/brag)                                                |
| michael-marcal/brag                   | Manual, interactive Claude Code agent interview              | Structured brag entries                         | Active (2025-11), no license                                  | [repo](https://github.com/michael-marcal/brag)                                       |
| did.txt (theptrk)                     | Manual: shell alias appends timestamped lines to a text file | Raw log only                                    | Blog post, 2018                                               | [post](https://theptrk.com/2018/07/11/did-txt-file/)                                 |
| jbranchaud/til                        | Manual: one markdown file per thing learned                  | Public TIL site, not review-oriented            | Active (2026-08), MIT, 14.1k stars                            | [repo](https://github.com/jbranchaud/til)                                            |
| Khan/snippets                         | Manual weekly entries, nag emails                            | Team digest emails, not review narrative        | Archived-ish (2023-07), MIT                                   | [repo](https://github.com/Khan/snippets)                                             |
| Pragmatic Engineer work log           | Manual, template-driven                                      | Feeds self-review; template only, no tool       | Post                                                          | [blog](https://blog.pragmaticengineer.com/work-log-template-for-software-engineers/) |
| GitHub contribution graph / Unwrapped | Fully harvested from GitHub activity                         | Visual/celebratory, not review-ready            | GitHub native; remotion-dev/github-unwrapped active (2026-07) | [repo](https://github.com/remotion-dev/github-unwrapped)                             |

## 1. The concept's origin: Julia Evans

["Get your work recognized: write a brag document"](https://jvns.ca/blog/brag-documents/) (2019-06-28) defines the practice: a running list of accomplishments so you and your manager can advocate for you at review/promotion time, and so you can reflect on themes in your work. She recommends either updating every two weeks or doing a marathon session every 6-12 months, and includes a template in the post (goals, projects + impact, collaboration & mentorship, design & documentation, company building, what you learned, outside work). Capture is entirely manual; there is no tooling. She links Aashni Shah's ["Hype Yourself! You're Worth It!"](https://aashni.me/blog/hype-yourself-youre-worth-it/) as related prior art. I did not find a separate brag-document talk or standalone template repo of hers beyond the post itself.

## 2. Commercial / AI products

**bragdoc.ai** — verified via its open-source monorepo [edspencer/bragdoc-ai](https://github.com/edspencer/bragdoc-ai) (MIT, created 2024-12, pushed 2026-08; the site [bragdoc.ai](https://www.bragdoc.ai/) blocks fetch but its [npm CLI](https://www.npmjs.com/package/@bragdoc/cli) and Ed Spencer's [build log](https://edspencer.net/bragdoc) corroborate). SaaS web app + CLI: the CLI extracts achievements from git commit history using a configurable LLM (OpenAI/Anthropic/Ollama etc.), and the platform adds a chat interface, email-in capture (`hello@bragdoc.ai`), AI impact scoring, and AI-generated performance reviews and weekly updates. Closest commercial analog: harvest + AI judgment, but git-commit-centric, cloud-hosted, and AI-required for its core flow.

**HypeDocs (Aashni Shah)** — Shah (the "Hype Yourself" author Evans cites, [TED talk](https://www.ted.com/talks/aashni_shah_hype_yourself_you_ve_earned_it)) founded HypeDocs; today it ships as an [AI audio-journaling iOS app](https://apps.apple.com/us/app/hypedocs-audio-journaling/id6739805485) oriented at confidence/wellbeing prompts rather than review evidence. Manual capture, no engineering-system harvest.

Not verified: "Brag Diary", "Praiseworthy", "workbrag" — I found no sourceable products under those names and have dropped them. A `bragdocument.io` ("your work, documented automatically") turned up in search results but I did not verify it beyond its existence in the index.

## 3. Open-source CLIs / tools (closest matches)

**[bostonaholic/reflect](https://github.com/bostonaholic/reflect)** (MIT, 36 stars, pushed 2026-09) — "An AI tool to generate your brag document." Harvests your GitHub PRs and reviews via a PAT; OpenAI key is _optional_, used only for the summary/brag-doc step, so raw contribution listing works AI-free. Its README pointedly warns (citing [Glue Work](https://www.noidea.dog/glue)) that GitHub activity undercounts real impact. Nearest OSS neighbor to `brag`'s GitHub harvest, but no Linear, no manual capture, no append-only ledger.

**[jstanier/bragdoc](https://github.com/jstanier/bragdoc)** (MIT, 24 stars, pushed 2025-12) — James Stanier's "Linear Brag Doc Generator": pulls completed/in-progress Linear issues over a lookback window and AI-summarizes them into a weekly markdown brag doc. The only tool found that harvests Linear — but Linear-only, AI-required, and regenerates rather than keeping a ledger.

**[naamanu/bragbot](https://github.com/naamanu/bragbot)** (MIT, pushed 2026-01) — npm CLI that generates brag documents from local git history; explicitly inspired by Evans' post.

**[bovem/brag](https://github.com/bovem/brag)** (MIT, 21 stars, last push 2024-05) — Go CLI for manually journaling daily accomplishments into a git-versioned markdown directory and summarizing them into a brag document. No harvest, no AI; closest analog to `brag toot` + `brag report`, but stale.

**[michael-marcal/brag](https://github.com/michael-marcal/brag)** (no license, pushed 2025-11) — a Claude Code agent that interviews you to produce structured brag entries ([author's write-up](https://michaelmarcal.com/building-a-brag-document-ai-agent-with-claude-code/)). Notable as the only other project found that packages the workflow _as Claude Code agent material_ — but capture is manual/conversational, with no harvest and no AI-free path.

**did.txt** — Patrick's 2018 post ["did.txt file"](https://theptrk.com/2018/07/11/did-txt-file/): a one-line shell alias (`alias did="vim +'normal Go' +'r!date' ..."`) appending timestamped entries to a plain text file; widely circulated ([HN thread](https://news.ycombinator.com/item?id=17551890)). The minimal ancestor of 30-second capture. `theptrk/did` as a GitHub repo returned 404 — the practice lives in the post, not a maintained tool. **[jbranchaud/til](https://github.com/jbranchaud/til)** (MIT, 14.1k stars, active) is the adjacent learn-log convention: manual markdown-per-item, published publicly, but not aimed at reviews. Also seen and skipped as too small/personal: g4rcez/promoteme, stmoreau/bragdoc, kajyr/did, AndreNeves97/brag-document (a doc, not a tool).

## 4. Adjacent practices with tooling

**Google-style weekly snippets** — the best-known open implementation is **[Khan/snippets](https://github.com/Khan/snippets)** (MIT, 215 stars, last push 2023-07), Khan Academy's App Engine snippet server: weekly manual entries, reminder emails, team digest. 18F kept a [weekly_snippets](https://github.com/18F/weekly_snippets) munging tool (dead since 2017). Snippets are peer-visibility artifacts, not review narratives.

**Hype doc** — the traceable origin is Aashni Shah's ["Hype Yourself! You're Worth It!"](https://aashni.me/blog/hype-yourself-youre-worth-it/) (the post Evans herself links). I could **not** verify Karen Catlin as coiner of "hype document" — searches tied Catlin only to Better Allies, so that attribution is dropped.

**Gergely Orosz** — ["A Work Log Template for Software Engineers"](https://blog.pragmaticengineer.com/work-log-template-for-software-engineers/) plus his [performance self-review template](https://blog.pragmaticengineer.com/performance-review-template-and-example-for-software-engineers/): keep a manual work log so the self-review writes itself. Templates only; no software.

**GitHub's own summaries** — the [contribution graph](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/viewing-contributions-on-your-profile) is fully automated harvest but purely quantitative; [remotion-dev/github-unwrapped](https://github.com/remotion-dev/github-unwrapped) (1.3k stars, githubunwrapped.com) renders a celebratory year-in-review video. Neither produces review-usable evidence with context.

## 5. How brag differs

- **Harvest + judgment split.** Prior tools either harvest-and-summarize in one AI pass (bragdoc.ai, reflect, jstanier/bragdoc — regenerating output each run) or are manual-only (bovem/brag, did.txt). brag separates deterministic harvest (gh CLI, Linear) into an append-only JSONL ledger with stable ids from judgment (churn filtering, impact drafting, theming) done by shipped Claude Code skills.
- **CLI-complete without AI.** Every AI harvester found (bragdoc.ai's core flow, jstanier/bragdoc, bragbot) requires an LLM; reflect is closest (optional OpenAI) but has no manual capture or report windows. brag's `toot/candidates/append/report` work with no model at all.
- **Multi-source.** No verified tool combines GitHub _and_ Linear _and_ 30-second manual capture; each prior tool picks exactly one.
- **Review-ready drill-down.** Prior output is either a raw log or a one-shot AI summary; brag's date-window reports over a stable ledger let a summary trace back to every underlying event.
- **Tool/data separation and distribution.** Prior CLIs mix data into the tool's own repo or a SaaS backend; brag keeps user data in a separate private repo and ships via Flox (`flox install imkarrer/brag`) — no other tool found uses either pattern.
