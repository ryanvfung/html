# agents-worktrees.md — worktrees in .worktrees/ sibling to repo
- Worktrees at `project-root/.worktrees/` (sibling to `<REPO_DIR>`, not inside); keeps repo clean.
- Each subfolder named by purpose/branch (`.worktrees/implement-T099/`). `.worktrees/` not git-tracked (add `.gitignore` inside `app/`).
- Use `worktree-add.ps1` (+ `.bat` shim, synced from `.root/`); enforces `.worktrees/` at workspace root; derives the repo dir dynamically (refuses inside the repo dir whatever it is named); cone-mode sparse checkout by default (edit `$SparseDirs`); honors `GIT_WORKTREE_ROOT`; self-locating.
- Cleanup after merge: park (reset to base, preserve sparse cone) by default; delete/archive only when corrupt/idle; don't accumulate stale worktrees.
