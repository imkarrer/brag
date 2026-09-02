# brag

The accomplishment-tracking context: capturing what a person shipped into a
personal ledger, and telling that story back at performance-review time.

## Language

### The ledger

**Entry**:
One accomplishment: a single record with a stable id, a date, and an impact.
_Avoid_: item, record, event, achievement

**Ledger**:
The append-only, whole-tenure collection of entries owned by one person.
_Avoid_: log, database, history

**Data dir**:
The user-owned directory holding their ledger, watermarks, and reports —
always separate from the tool, optionally git-backed.
_Avoid_: workspace, vault, home

**Impact**:
The "so what" of an entry — why a reviewer should care. The load-bearing
field every narrative is built from.
_Avoid_: outcome, result, value

**Source**:
Where an entry originated: github, linear, manual, or kudos.
_Avoid_: provider, channel

**Window**:
An inclusive [from, to] date range that selects entries for reading or
reporting.
_Avoid_: period, range, timeframe

### Capture

**Harvest**:
The automated pull of new accomplishments from external sources since the
last watermark.
_Avoid_: sync, import, scrape, ingest

**Watermark**:
The per-source timestamp recording how far harvesting has progressed;
everything before it has already been considered.
_Avoid_: cursor, checkpoint, last-run

**Backfill**:
A one-time harvest across a person's whole history, from a start date to the
current watermarks.
_Avoid_: bootstrap, migration

**Toot**:
A manually captured accomplishment — deliberate horn-tooting for work that
left no digital trail.
_Avoid_: note, manual entry

**Kudos**:
Praise received from someone else, preserved verbatim with attribution.
_Avoid_: shout-out, testimonial, praise entry

**Significance filter**:
The judgment separating accomplishments from mere activity: churn is rolled
up, borderline work is kept.
_Avoid_: relevance check, noise filter

**Rollup**:
A single entry standing in for a batch of mechanical churn (dependency
bumps, CI fixes) in one window.
_Avoid_: aggregate, summary entry

### Storytelling

**Report**:
The single-page story generated from a window: read at a glance, drilled
into in place, never via an appendix.
_Avoid_: summary, review doc, export

**Glance**:
The report's top level — headline numbers and theme cards on one screen.
_Avoid_: overview, TL;DR

**Theme**:
A cluster of entries forming one arc of the story, carrying its narrative
and its evidence.
_Avoid_: category, section, group

**Evidence**:
The entries backing a theme, each linking to its PR, issue, or release.
_Avoid_: appendix, references, sources
