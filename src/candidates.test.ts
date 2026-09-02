import { describe, expect, it } from "vitest";
import {
  chunkWindows,
  githubPrsToCandidates,
  linearIssuesToCandidates,
} from "./candidates.ts";

const NOW = new Date("2026-09-02T21:00:00Z");

const PR = {
  closedAt: "2026-09-01T21:59:40Z",
  number: 2,
  repository: {
    name: "flox-onboarding",
    nameWithOwner: "flox/flox-onboarding",
  },
  title: "Pin workflow actions to commit SHAs",
  url: "https://github.com/flox/flox-onboarding/pull/2",
};

describe("githubPrsToCandidates", () => {
  it("maps authored PRs to draft entries with empty impact", () => {
    const [e] = githubPrsToCandidates([PR], { kind: "pr_merged" }, NOW);
    expect(e).toMatchObject({
      id: "gh-pr:flox/flox-onboarding#2",
      date: "2026-09-01",
      source: "github",
      kind: "pr_merged",
      title: "Pin workflow actions to commit SHAs",
      impact: "",
      links: ["https://github.com/flox/flox-onboarding/pull/2"],
    });
  });

  it("maps reviews with the gh-review id prefix and skips the user's own PRs", () => {
    const reviewed = [
      { ...PR, author: { login: "someone-else" } },
      { ...PR, number: 3, url: "x", author: { login: "imkarrer" } },
    ];
    const out = githubPrsToCandidates(
      reviewed,
      { kind: "review", excludeAuthor: "imkarrer" },
      NOW
    );
    expect(out.map((e) => e.id)).toEqual(["gh-review:flox/flox-onboarding#2"]);
  });
});

describe("linearIssuesToCandidates", () => {
  it("maps completed issues to draft entries", () => {
    const [e] = linearIssuesToCandidates(
      [
        {
          identifier: "ENG-123",
          title: "Ship the publish pipeline",
          url: "https://linear.app/flox/issue/ENG-123",
          completedAt: "2026-08-15T10:00:00.000Z",
          project: { name: "Publishing" },
        },
      ],
      NOW
    );
    expect(e).toMatchObject({
      id: "linear:ENG-123",
      date: "2026-08-15",
      source: "linear",
      kind: "issue_done",
      title: "Ship the publish pipeline",
      impact: "",
      tags: ["Publishing"],
      links: ["https://linear.app/flox/issue/ENG-123"],
    });
  });
});

describe("chunkWindows", () => {
  it("splits a long range into month-sized chunks covering it exactly", () => {
    const chunks = chunkWindows("2026-01-15", "2026-03-20");
    expect(chunks[0]!.since).toBe("2026-01-15");
    expect(chunks.at(-1)!.until).toBe("2026-03-20");
    // contiguous: each chunk starts the day after the previous ends
    for (let i = 1; i < chunks.length; i++) {
      const prevEnd = new Date(chunks[i - 1]!.until + "T00:00:00Z").getTime();
      const start = new Date(chunks[i]!.since + "T00:00:00Z").getTime();
      expect(start - prevEnd).toBe(86_400_000);
    }
  });

  it("returns a single chunk for a short range", () => {
    expect(chunkWindows("2026-08-10", "2026-09-02")).toEqual([
      { since: "2026-08-10", until: "2026-09-02" },
    ]);
  });
});
