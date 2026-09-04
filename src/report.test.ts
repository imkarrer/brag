import { describe, expect, it } from "vitest";
import type { Entry } from "./ledger.ts";
import { renderReport } from "./report.ts";

const entry = (overrides: Partial<Entry> & Pick<Entry, "id">): Entry => ({
  date: "2026-05-01",
  source: "github",
  kind: "pr_merged",
  title: "A change",
  summary: "Did a change.",
  impact: "It mattered.",
  tags: [],
  links: ["https://github.com/x/y/pull/1"],
  harvested_at: "2026-09-02T21:00:00Z",
  ...overrides,
});

describe("renderReport", () => {
  it("groups by first tag, puts untagged under Everything else, includes each entry once", () => {
    const html = renderReport(
      [
        entry({
          id: "a",
          tags: ["reliability"],
          title: "Fix flaky activation",
        }),
        entry({ id: "b", tags: ["reliability", "dx"], title: "Retry harness" }),
        entry({ id: "c", title: "Odd job <script>" }),
      ],
      { from: "2026-01-01", to: "2026-06-30" }
    );
    expect(html).toContain("reliability");
    expect(html).toContain("Everything else");
    expect(html.match(/Fix flaky activation/g)).toHaveLength(1);
    expect(html.match(/Retry harness/g)).toHaveLength(1);
    // Entry content is escaped — the raw title must never appear as markup
    expect(html).not.toContain("Odd job <script>");
    expect(html).toContain("Odd job &lt;script&gt;");
  });

  it("prints with every drill-down expanded", () => {
    const html = renderReport([entry({ id: "a" })], {
      from: "2026-01-01",
      to: "2026-06-30",
    });
    // beforeprint opens all <details>; print CSS backs it up.
    expect(html).toContain("beforeprint");
    expect(html).toContain("@media print");
  });

  it("shows headline counts for the window", () => {
    const html = renderReport(
      [
        entry({ id: "a" }),
        entry({ id: "b", kind: "kudos", source: "kudos" }),
        entry({ id: "c", kind: "release" }),
      ],
      { from: "2026-01-01", to: "2026-06-30" }
    );
    expect(html).toContain("2026-01-01");
    expect(html).toContain("2026-06-30");
    // one PR, one kudos, one release — assert on text content, not markup
    const text = html.replace(/<[^>]+>/g, " ");
    expect(text).toMatch(/1\s+PRs merged/);
    expect(text).toMatch(/1\s+kudos/);
    expect(text).toMatch(/1\s+releases/);
  });
});
