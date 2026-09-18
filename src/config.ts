import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { normalizeOwners, type OwnerScope } from "./owners.ts";

export type ResolveOptions = {
  flag?: string;
  env?: Record<string, string | undefined>;
  home?: string;
};

export function configPath(
  home: string,
  env: Record<string, string | undefined>
): string {
  const configHome = env["XDG_CONFIG_HOME"] ?? join(home, ".config");
  return join(configHome, "brag", "config.json");
}

type ConfigFile = {
  data_dir?: string;
  github_owners?: unknown;
};

function readConfigFile(opts: ResolveOptions = {}): ConfigFile {
  const env = opts.env ?? process.env;
  const home = opts.home ?? homedir();
  const cfg = configPath(home, env);
  if (!existsSync(cfg)) return {};
  return JSON.parse(readFileSync(cfg, "utf8")) as ConfigFile;
}

export function resolveDataDir(opts: ResolveOptions = {}): string {
  const env = opts.env ?? process.env;
  const home = opts.home ?? homedir();
  if (opts.flag) return opts.flag;
  if (env["BRAG_HOME"]) return env["BRAG_HOME"];
  const { data_dir } = readConfigFile(opts);
  if (data_dir) return data_dir;
  return join(home, ".local", "share", "brag");
}

/**
 * Owners to scope `brag candidates` to. `--owner` flags win outright when
 * given, so a one-off search is never silently narrowed by the config.
 */
export function resolveGithubOwners(
  opts: ResolveOptions & { flags?: string[] } = {}
): OwnerScope[] {
  if (opts.flags?.length) return opts.flags.map((owner) => ({ owner }));
  return normalizeOwners(readConfigFile(opts).github_owners);
}
