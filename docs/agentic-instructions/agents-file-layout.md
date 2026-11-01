# agents-file-layout.md — repo layout, reference tree + annotations
- Git dir = `<REPO_DIR>` (derived dynamically at bootstrap; default
  `<workspace-folder>_app/`; `app/` is the legacy example); workspace-root
  files shadow-tracked via `<REPO_DIR>/.root/` (SSoT; one-way recursive
  mirror, subdirs included; never edit root directly).
- Sync script `<REPO_DIR>/.root/copy-to-root.ps1`: self-locating (derives
  the repo dir from its own path), no args, refuses if workspace root lacks
  the repo dir. Substitutes `{{REPO_DIR}}` into synced text files that
  contain it (e.g. `.opencode/opencode.json`).
- Excluded (sync skips + pre-commit blocks): secrets (.env, cookie_*.txt, *_token.json except .example/.sample), temp (tmp/, *.tmp, tmp_*), build artifacts.
```
project-root/
  <REPO_DIR>/           # git repo (name derived dynamically; `app/` shown as legacy example)
    .root/              # SSoT for root files -> workspace root (one-way)
      .opencode/        # opencode.json -> workspace-root .opencode/ (propose-guard registration)
    .hooks/             # propose-guard.js (framework hook, not a git hook)
    .githooks/          # pre-commit (shadow audit + credential guard) / post-commit (best-effort push)
    .gitignore
    docs/plans/         # YYYYMMDD-<slug>.md (active)
    docs/archive/plans/ # completed (git mv, preserve filename)
    todo.md             # open only
    todo-completed.md   # completed (verify B before delete A)
    AGENTS.md           # thin index into docs/agentic-instructions/
    CLAUDE.md           # pointer: AGENTS.md is the SSoT
    docs/agentic-instructions/  # agents-*.md topical standards (workflow, git, plans, todos, ...)
  .worktrees/           # sibling; primary worktree location; not tracked
  tmp/                  # untracked temp; never shadow-copied
  tmp_scripts/          # untracked scratch
```
- Task numbering continuity: task IDs are global and never reused (format per project convention).
- Closing = archive plan (post-merge on master): B (append todo-completed + verify) then A (delete todo); `git mv`; push; prune; report remaining.
- Archived status loose; plan uniqueness `YYYYMMDD`; shadow-audit enforced.
