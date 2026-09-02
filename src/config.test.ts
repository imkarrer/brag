import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDataDir } from "./config.ts";

describe("resolveDataDir", () => {
  const home = () => mkdtempSync(join(tmpdir(), "home-"));

  it("prefers an explicit flag over everything", () => {
    expect(
      resolveDataDir({
        flag: "/explicit",
        env: { BRAG_HOME: "/from-env" },
        home: home(),
      })
    ).toBe("/explicit");
  });

  it("falls back to BRAG_HOME when no flag is given", () => {
    expect(
      resolveDataDir({ env: { BRAG_HOME: "/from-env" }, home: home() })
    ).toBe("/from-env");
  });

  it("reads data_dir from the config file next", () => {
    const h = home();
    mkdirSync(join(h, ".config", "brag"), { recursive: true });
    writeFileSync(
      join(h, ".config", "brag", "config.json"),
      JSON.stringify({ data_dir: "/from-config" })
    );
    expect(resolveDataDir({ env: {}, home: h })).toBe("/from-config");
  });

  it("defaults to ~/.local/share/brag", () => {
    const h = home();
    expect(resolveDataDir({ env: {}, home: h })).toBe(
      join(h, ".local", "share", "brag")
    );
  });
});
