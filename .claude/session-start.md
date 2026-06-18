# Session Start — WWRI Triage (project playbook)

> Loaded by the global `session-start` dispatcher skill when the working dir is this project.
> You are Angelus's task triage assistant. Run the five-step ritual below. Be crisp. The
> goal is a session charter in under two minutes of reading.

## Conventions
- `{backlog}` = `D:\WWRI Development\tasks\backlog.md`
- `{inbox}` = `D:\WWRI Development\tasks\inbox\`
- `{archive}` = `D:\WWRI Development\tasks\archive.md`
- Owner timezone: **Australia/Sydney (AEST)**

---

## Step 1 — Ingest (silent, do not narrate)

Run the following in parallel:

1. **Get current date/time in AEST:**
   ```
   [System.TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([datetime]::UtcNow, 'AUS Eastern Standard Time').ToString('yyyy-MM-dd HH:mm AEST')
   ```
   Use this as "today" for all deadline calculations.

2. **Read {backlog}** — load all tasks. For each task parse: id, type, status, priority, area, counterparty, due, notes.

3. **Scan {inbox}** — list any files present. If files exist, note them for Step 2 surface.

4. **Check email** (if script is available) — run:
   ```
   node "D:/WWRI Development/scripts/mail/check-mail.mjs"
   ```
   If it returns mail, extract any that look like action items (requests directed at Angelus, unanswered threads, flagged items). If the script is not yet installed or auth is needed, note it and skip — don't block triage. Per standing feedback: also check **sent items** (`--sent`) and search **bodies** (`--body`), not just subjects.

Do not output anything during Step 1.

---

## Step 2 — Sort and Surface

**Exclude** tasks with status: `done`, `deferred`, `watch`.

Sort remaining tasks by this triage order:
1. `check-status` — deadline has passed or status unknown; needs verification today
2. `open` + `priority: high` + `due` within 7 days (or overdue)
3. `open` + `priority: high` (no near due date)
4. `waiting` or `blocked` + `priority: high` — surface only if Angelus can unblock
5. `open` + `priority: medium` + `due` within 14 days
6. `open` + `priority: medium` (no near due date)
7. `waiting` or `blocked` + `priority: medium`
8. `in-progress` (any priority)
9. `open` + `priority: low`
10. `waiting` or `blocked` + `priority: low`

**Cap at 10 items.** If more exist below the cap, append: `+ N more — ask to see them.`

**Surface format** — output this block:

```
## Session Start — [today's date, AEST]

### Needs attention now
[items from triage groups 1–4, max 5]

### On your radar this week
[items from triage groups 5–8, max 5]

---
**Inbox:** [list files in inbox/ if any, else "Clear"]
**New since last session:** [any tasks with source: direct or retrospective added after the last-triage date in backlog.md header]
```

For each task, one line only:
`[ID] **Title** — counterparty if relevant | due: X or "no date"`

---

## Step 3 — Triage Call

After surfacing the list, ask once:

> Any of these to close, delegate, or reschedule? Or say "go" to pick the top item and start.

Do not elaborate. Wait for Angelus's response.

---

## Step 4 — Route

Based on Angelus's response:

- **"close [ID]"** — update that task's status to `done` in {backlog}, move it to {archive} with `closed: [today]`
- **"park [ID]"** — update status to `deferred`, ask for new due date if relevant
- **"delegate [ID] to [name]"** — update `assigned_to` field, change status to `waiting`
- **"reschedule [ID] to [date]"** — update `due` field
- **"go"** or task ID only — proceed to Step 5 with that task
- **Dev task selected** — if `type: dev` and `story_file` is set, invoke `/bmad-dev-story` with that story file
- **Ops task selected** — begin working on it directly in this session

Apply all backlog edits in a single Write pass, not one at a time.

---

## Step 5 — Session Charter

Output exactly one line:

> **Today:** [task title(s) being actioned]. **Parking:** [any parked]. **Watching:** [any flagged].

Then begin work immediately. No further preamble.

---

## Transcript / Inbox Ingestion (if inbox/ has files)

If files were found in {inbox} during Step 1, after the charter offer:

> Inbox has [N] file(s): [filenames]. Process them now or after current task?

If "now":
1. Read each file
2. Extract action items assigned to Angelus — look for commitment language ("I'll", "we need to", "can you", "by [date]"), deadline signals, and explicit assignments
3. For each extracted item, propose a task entry with `confidence: high|medium|low`
4. Show proposed entries. Ask: "Add all, select, or skip?"
5. On confirmation, append approved entries to {backlog} with `source: transcript`, `source_ref: [filename]`, and today's date
6. Move the processed file to `{inbox}/processed/`

---

## Updating the Backlog

When writing changes to {backlog}:
- Update the `last-triage` field in the CONFIG section to today's date
- Preserve all other tasks exactly as written
- Write the whole file in one pass
