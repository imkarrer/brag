import { describe, expect, it } from "vitest";
import { buildTootEntry } from "./toot.ts";

const NOW = new Date("2026-09-02T21:00:00Z");

describe("buildTootEntry", () => {
  it("builds a toot with a slugged id and today's date by default", () => {
    const e = buildTootEntry(
      {
        title: "Fixed the demo outage!",
        impact: "Demo went ahead; prospect signed.",
      },
      NOW
    );
    expect(e.id).toBe("toot:2026-09-02-fixed-the-demo-outage");
    expect(e.date).toBe("2026-09-02");
    expect(e.source).toBe("manual");
    expect(e.kind).toBe("toot");
    expect(e.summary).toBe("Fixed the demo outage!");
    expect(e.harvested_at).toBe("2026-09-02T21:00:00.000Z");
  });

  it("builds kudos with the quote preserved as summary", () => {
    const e = buildTootEntry(
      {
        title: "Praise from Sam",
        summary: "@sam in #eng: 'brag saved my review'",
        impact: "Peer recognition for the brag rollout.",
        kudos: true,
        date: "2026-08-30",
      },
      NOW
    );
    expect(e.id).toBe("kudos:2026-08-30-praise-from-sam");
    expect(e.source).toBe("kudos");
    expect(e.kind).toBe("kudos");
    expect(e.summary).toBe("@sam in #eng: 'brag saved my review'");
  });

  it("splits comma-separated tags and links", () => {
    const e = buildTootEntry(
      {
        title: "T",
        impact: "I",
        tags: "mentoring, onboarding",
        links: "https://a.example, https://b.example",
      },
      NOW
    );
    expect(e.tags).toEqual(["mentoring", "onboarding"]);
    expect(e.links).toEqual(["https://a.example", "https://b.example"]);
  });
});
