import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { appendEntries, readEntries, type Entry, type Source } from "./ledger.ts";
import { readWatermark, writeWatermark } from "./state.ts";

const USAGE = `usage:
  cli.ts append [--ledger <path>]                 # entries as JSON array or JSONL on stdin
  cli.ts read [--ledger <path>] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
  cli.ts watermark get <source> [--state <path>]
  cli.ts watermark set <source> <timestamp> [--state <path>]`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    ledger: { type: "string", default: "ledger/entries.jsonl" },
    state: { type: "string", default: "ledger/state.json" },
    from: { type: "string" },
    to: { type: "string" },
  },
});

function parseStdin(): Entry[] {
  const raw = readFileSync(0, "utf8").trim();
  if (raw === "") return [];
  if (raw.startsWith("[")) return JSON.parse(raw) as Entry[];
  return raw.split("\n").map((line) => JSON.parse(line) as Entry);
}

const [command, ...rest] = positionals;

switch (command) {
  case "append": {
    const result = appendEntries(values.ledger, parseStdin());
    console.log(
      JSON.stringify({
        added: result.added.map((e) => e.id),
        skipped: result.skipped,
      }),
    );
    break;
  }
  case "read": {
    for (const e of readEntries(values.ledger, {
      from: values.from,
      to: values.to,
    })) {
      console.log(JSON.stringify(e));
    }
    break;
  }
  case "watermark": {
    const [action, source, timestamp] = rest;
    if (action === "get" && source) {
      console.log(readWatermark(values.state, source as Source) ?? "null");
    } else if (action === "set" && source && timestamp) {
      writeWatermark(values.state, source as Source, timestamp);
    } else {
      console.error(USAGE);
      process.exit(2);
    }
    break;
  }
  default:
    console.error(USAGE);
    process.exit(2);
}
