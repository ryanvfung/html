# agents-commit-conventions.md — additional conventions: commit msg, milestone, archive link, close sequence, text markers, safe execution
- Commit message: `<verb>: <summary> — docs/plans/YYYYMMDD-...` (prepend todo ID if exists); enables `git log --grep=`.
- Commit-on-milestone: at plan written, milestone, task complete, or pre-merge — commit required; no uncommitted milestone; reference task/plan in message.
- Merge-hold / archive link: plan moves to `docs/archive/plans/` only as part of closing its `todo.md` task (same post-merge commit, paired by task-ID/filename); don't archive while todo still active.
- Review gate before archive: brief review entry (`docs/archive/reviews/`) referencing plan filename; mandatory multi-step / cross-cutting; optional trivial.
- Closing sequence (master only, never in worktree): 1) move todo A→B (verify) + `git mv` plan; 2) push master; 3) prune worktree + delete branch; 4) report open todos.
- Safe execution (copy/move): write to B first, verify, then delete A; for text edits: edit in place; shadow-copy: `.root/` first; archive: `git mv` preferred; manual only after `cp` verification.
- Text markers in todo: prefer text over symbols (`[in-progress]`, `[merged]`, `[blocked: reason]`).
- Hash in output: after committing, reference the commit briefly, e.g. `Implemented (commit 1234abcd)` — hash from `git log -1 --format="%h"`.
