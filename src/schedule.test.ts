import { describe, expect, it } from "vitest";
import {
  harvestJobCommand,
  renderCronLine,
  renderLaunchdPlist,
  updateCrontab,
} from "./schedule.ts";

const JOB = {
  dataDir: "/home/u/brag data",
  claudePath: "/opt/bin/claude",
  path: "/opt/bin:/usr/bin",
};

describe("harvestJobCommand", () => {
  it("cds to the data dir, sources .env when present, and execs claude headless", () => {
    const cmd = harvestJobCommand(JOB);
    expect(cmd).toContain("cd '/home/u/brag data'");
    expect(cmd).toContain(". ./.env");
    expect(cmd).toContain("'/opt/bin/claude' -p /harvest");
    expect(cmd).toContain("PATH='/opt/bin:/usr/bin'");
  });
});

describe("renderLaunchdPlist", () => {
  it("renders a weekly calendar job with the escaped command", () => {
    const plist = renderLaunchdPlist(
      JOB,
      { weekday: 1, hour: 9 },
      "/logs/brag.log"
    );
    expect(plist).toContain("<string>dev.brag.harvest</string>");
    expect(plist).toContain("<key>Weekday</key>");
    expect(plist).toContain("<integer>1</integer>");
    expect(plist).toContain("<integer>9</integer>");
    expect(plist).toContain("/logs/brag.log");
    // XML-escaped job command (single quotes fine, but & < > must escape)
    expect(plist).not.toContain("&&");
    expect(plist).toContain("&amp;&amp;");
  });
});

describe("renderCronLine", () => {
  it("renders the schedule, the command, and the brag marker", () => {
    const line = renderCronLine(JOB, { weekday: 1, hour: 9 });
    expect(line.startsWith("0 9 * * 1 ")).toBe(true);
    expect(line).toContain("# brag-harvest");
  });

  it("escapes percent signs, which cron treats as newlines", () => {
    const line = renderCronLine(
      { ...JOB, path: "/weird%dir:/usr/bin" },
      { weekday: 0, hour: 18 }
    );
    expect(line).toContain("\\%");
    expect(line).not.toMatch(/[^\\]%d/);
  });
});

describe("updateCrontab", () => {
  const line = renderCronLine(JOB, { weekday: 1, hour: 9 });

  it("appends to an empty crontab", () => {
    expect(updateCrontab("", line)).toBe(line + "\n");
  });

  it("replaces an existing brag line and preserves everything else", () => {
    const existing =
      "0 5 * * * /bin/backup\n0 8 * * 3 old-cmd # brag-harvest\n";
    const out = updateCrontab(existing, line);
    expect(out).toContain("/bin/backup");
    expect(out).toContain(line);
    expect(out).not.toContain("old-cmd");
    expect(out.match(/brag-harvest/g)).toHaveLength(1);
  });

  it("removes the brag line when given null", () => {
    const existing = "0 5 * * * /bin/backup\n" + line + "\n";
    const out = updateCrontab(existing, null);
    expect(out).toBe("0 5 * * * /bin/backup\n");
  });
});
