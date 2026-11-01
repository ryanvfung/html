# agents-docs-plans.md — docs/ inside repo; plans format; archive mirroring
- All doc/planning artifacts live inside `app/docs/`.
- Active plans → `app/docs/plans/YYYYMMDD-<slug>.md`; format YYYYMMDD (no separators); include task-ID (e.g., `T099`) if project convention uses it: `YYYYMMDD-T099-<slug>.md`; pure-date acceptable without task.
- Completed → `git mv` to `app/docs/archive/plans/`, preserve filename, do not rename.
- Mirror: `docs/archive/` mirrors `docs/` subfolders (plans/, designs/, audits/) — predictable lookup.
- Never put plans at repo root, in `todos/`, or in skill-default `docs/superpowers/plans/`.
