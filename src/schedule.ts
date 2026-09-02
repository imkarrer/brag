export type JobEnv = {
  dataDir: string;
  claudePath: string;
  path: string; // PATH to embed, captured at install time
};

export type Weekly = {
  weekday: number; // 0 = Sunday .. 6 = Saturday
  hour: number; // 0..23
};

export const CRON_MARKER = "# brag-harvest";
export const LAUNCHD_LABEL = "dev.brag.harvest";

const shq = (s: string): string => `'${s.replaceAll("'", `'\\''`)}'`;

// The job: enter the data dir, load .env if present (LINEAR_API_KEY),
// restore the install-time PATH, run the harvest skill headless.
export function harvestJobCommand(job: JobEnv): string {
  return (
    `cd ${shq(job.dataDir)} && ` +
    `{ [ -f .env ] && { set -a; . ./.env; set +a; }; } ; ` +
    `PATH=${shq(job.path)} exec ${shq(job.claudePath)} -p /harvest`
  );
}

const xmlEsc = (s: string): string =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function renderLaunchdPlist(
  job: JobEnv,
  when: Weekly,
  logPath: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string>
    <string>-c</string>
    <string>${xmlEsc(harvestJobCommand(job))}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key>
    <integer>${when.weekday}</integer>
    <key>Hour</key>
    <integer>${when.hour}</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${xmlEsc(logPath)}</string>
  <key>StandardErrorPath</key>
  <string>${xmlEsc(logPath)}</string>
</dict>
</plist>
`;
}

export function renderCronLine(job: JobEnv, when: Weekly): string {
  // cron interprets % as a newline; escape it.
  const cmd = `/bin/sh -c ${shq(harvestJobCommand(job))}`.replaceAll(
    "%",
    "\\%"
  );
  return `0 ${when.hour} * * ${when.weekday} ${cmd} ${CRON_MARKER}`;
}

// Replace (or, with null, remove) the marked brag line, preserving the rest.
export function updateCrontab(existing: string, line: string | null): string {
  const kept = existing
    .split("\n")
    .filter((l) => l.trim() !== "" && !l.includes(CRON_MARKER));
  if (line !== null) kept.push(line);
  return kept.length > 0 ? kept.join("\n") + "\n" : "";
}
