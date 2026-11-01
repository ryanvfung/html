# agents-todo.md — todo.md SSoT; format; move order A→B
- SSoT = `app/todo.md`; **no root `todo.md`**.
- Completed move to `app/todo-completed.md` (prefer in `app/`; shadow-copy only if user needs root visibility).
- Format: concise one-line per task; task ID when the project uses them (`T###` is only an example shape — follow the project's existing format); reference plan filename (`docs/plans/YYYYMMDD-...`) once plan exists; shorten todo to reference after plan written.
- Move order (critical): append to `todo-completed.md` first (B), verify entry present/correct, then delete from `todo.md` (A). Never delete A before confirming B. `todo.md` = only open/deferred/reference; zero completed allowed.
- Archive/consolidation tasks (archive plan, consolidate superseded audits): perform actual file operation (`git mv`, create/delete, reference update) — recording text only = failure; verify after.
- Queue discipline: treat all work as a queue. When the user proposes tweaks/corrections, append them to the queue — do not break the queue to suddenly prioritize the correction. Only stop when 100% of the queue is truly clear. Move order stays unchanged: write B (`todo-completed.md`) first, verify, then delete from A (`todo.md`). `A→B` denotes content direction (A moves to B), not operation order.
