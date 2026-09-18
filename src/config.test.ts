import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDataDir, resolveGithubOwners } from "./config.ts";

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

describe("resolveGithubOwners", () => {
  const home = () => mkdtempSync(join(tmpdir(), "home-"));
  const withConfig = (cfg: unknown): string => {
    const h = home();
    mkdirSync(join(h, ".config", "brag"), { recursive: true });
    writeFileSync(
      join(h, ".config", "brag", "config.json"),
      JSON.stringify(cfg)
    );
    return h;
  };

  it("reads github_owners from the config file", () => {
    const h = withConfig({
      github_owners: ["flox", { owner: "imkarrer", visibility: ["public"] }],
    });
    expect(resolveGithubOwners({ env: {}, home: h })).toEqual([
      { owner: "flox" },
      { owner: "imkarrer", visibility: ["public"] },
    ]);
  });

  it("lets --owner flags win outright, filter and all", () => {
    const h = withConfig({
      github_owners: [{ owner: "imkarrer", visibility: ["public"] }],
    });
    expect(
      resolveGithubOwners({ env: {}, home: h, flags: ["someone-else"] })
    ).toEqual([{ owner: "someone-else" }]);
  });

  it("is empty when the config has no github_owners", () => {
    const h = withConfig({ data_dir: "/somewhere" });
    expect(resolveGithubOwners({ env: {}, home: h })).toEqual([]);
  });

  it("is empty when there is no config file at all", () => {
    expect(resolveGithubOwners({ env: {}, home: home() })).toEqual([]);
  });
});
