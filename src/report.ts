import type { Entry } from "./ledger.ts";

const esc = (s: string): string =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const UNTHEMED = "Everything else";

function groupByFirstTag(entries: Entry[]): Map<string, Entry[]> {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = e.tags[0] ?? UNTHEMED;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  // Untagged work sorts last.
  const sorted = new Map(
    [...groups.entries()].sort(([a], [b]) =>
      a === UNTHEMED ? 1 : b === UNTHEMED ? -1 : a.localeCompare(b)
    )
  );
  return sorted;
}

function headline(entries: Entry[]): string {
  const count = (pred: (e: Entry) => boolean): number =>
    entries.filter(pred).length;
  const stats: [number, string][] = [
    [count((e) => e.kind === "pr_merged"), "PRs merged"],
    [count((e) => e.kind === "review"), "reviews"],
    [count((e) => e.kind === "release"), "releases"],
    [
      count((e) => e.kind === "issue_done" || e.kind === "project_shipped"),
      "issues/projects",
    ],
    [count((e) => e.kind === "kudos"), "kudos"],
    [count((e) => e.kind === "toot"), "logged by hand"],
  ];
  return stats
    .filter(([n]) => n > 0)
    .map(
      ([n, label]) =>
        `<span class="stat"><strong>${n}</strong> ${esc(label)}</span>`
    )
    .join("\n");
}

function entryRow(e: Entry): string {
  const links = e.links
    .map((l) => `<a href="${esc(l)}">${esc(l.replace(/^https?:\/\//, ""))}</a>`)
    .join(" · ");
  return `<li><strong>${esc(e.date)}</strong> — ${esc(e.title)}<br>
${esc(e.impact !== "" ? e.impact : e.summary)}${links ? `<br><small>${links}</small>` : ""}</li>`;
}

// The markdown twin of the HTML report: GitHub renders <details> in .md,
// so a repo collaborator gets the same glance -> drill-down experience
// directly in the repository UI.
export function renderMarkdownReport(
  entries: Entry[],
  window: { from: string; to: string }
): string {
  const groups = groupByFirstTag(
    [...entries].sort((a, b) => a.date.localeCompare(b.date))
  );
  const stats = headline(entries)
    .replaceAll(/<[^>]+>/g, "")
    .split("\n")
    .join(" · ");
  const sections = [...groups.entries()]
    .map(([tag, group]) => {
      const rows = group
        .map(
          (e) =>
            `- **${e.date}** — ${e.title}\n  ${e.impact !== "" ? e.impact : e.summary}${
              e.links.length > 0 ? ` — ${e.links.join(" · ")}` : ""
            }`
        )
        .join("\n");
      return `<details>\n<summary><strong>${tag}</strong> (${group.length})</summary>\n\n${rows}\n\n</details>`;
    })
    .join("\n\n");
  return `# Accomplishments — ${window.from} → ${window.to}

${entries.length} entries · ${stats}

${sections}
`;
}

export function renderReport(
  entries: Entry[],
  window: { from: string; to: string }
): string {
  const groups = groupByFirstTag(
    [...entries].sort((a, b) => a.date.localeCompare(b.date))
  );
  const sections = [...groups.entries()]
    .map(
      ([tag, group]) => `<details open>
<summary><strong>${esc(tag)}</strong> (${group.length})</summary>
<ul>
${group.map(entryRow).join("\n")}
</ul>
</details>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accomplishments ${esc(window.from)} to ${esc(window.to)}</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 44rem; margin: 2rem auto; padding: 0 1rem; }
  .stat { margin-right: 1.25rem; }
  details { margin: 1rem 0; }
  li { margin: 0.6rem 0; }
  small a { color: inherit; }
  @media print {
    details > * { display: block !important; }
    details { border: none; }
    body { padding: 0; }
  }
</style>
<script>
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll("details").forEach((d) => (d.open = true));
  });
</script>
</head>
<body>
<h1>Accomplishments</h1>
<p>${esc(window.from)} — ${esc(window.to)} · ${entries.length} entries</p>
<p>
${headline(entries)}
</p>
${sections}
</body>
</html>`;
}
