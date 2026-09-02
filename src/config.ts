import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

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

export function resolveDataDir(opts: ResolveOptions = {}): string {
  const env = opts.env ?? process.env;
  const home = opts.home ?? homedir();
  if (opts.flag) return opts.flag;
  if (env["BRAG_HOME"]) return env["BRAG_HOME"];
  const cfg = configPath(home, env);
  if (existsSync(cfg)) {
    const parsed = JSON.parse(readFileSync(cfg, "utf8")) as {
      data_dir?: string;
    };
    if (parsed.data_dir) return parsed.data_dir;
  }
  return join(home, ".local", "share", "brag");
}
