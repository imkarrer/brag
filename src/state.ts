import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { Source } from "./ledger.ts";

type State = Partial<Record<Source, string>>;

function readState(statePath: string): State {
  if (!existsSync(statePath)) return {};
  return JSON.parse(readFileSync(statePath, "utf8")) as State;
}

export function readWatermark(statePath: string, source: Source): string | null {
  return readState(statePath)[source] ?? null;
}

export function writeWatermark(
  statePath: string,
  source: Source,
  timestamp: string,
): void {
  const state = readState(statePath);
  state[source] = timestamp;
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
}
