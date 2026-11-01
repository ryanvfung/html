# .root/ — workspace shadow directory (SSoT)

This file lives in `<REPO_DIR>/.root/` (tracked via git) and is copied to the
workspace root (`README.md`) by `copy-to-root.ps1`.

The **real project README** belongs in `app/README.md`. This shadow file only
explains the folder/shadow mechanism; replace the workspace-root copy with
your project README once you have one, keeping this source note in `.root/`.

## Mechanism / policy

- `app/.root/` is the **single source of truth** for workspace-root files.
  Everything under `.root/` (except the sync script itself) mirrors to the
  workspace root, recursively, one-way — subdirectories included.
- Workspace-root copies are **generated**. There is no reverse sync: editing
  a root copy directly creates drift, which `app/.githooks/pre-commit`
  blocks. Edit the `.root/` version, then re-run the sync.
- **Track a new root file**: add it under `app/.root/` (same relative path),
  run `copy-to-root.ps1`, commit through `app/`.
- **Sync**: `powershell -ExecutionPolicy Bypass -File app/.root/copy-to-root.ps1`
- **Excluded / never shadow-tracked** (enforced by the sync script — it skips
  and warns): `.env`, `cookie_*.txt`, `*_token.json`, `*.tmp`, `tmp_*`,
  `copy-to-root.ps1` itself. Never place `tmp/`, `tmp_scripts/`,
  or build artifacts under `.root/` either. `.env.example`/`.sample`/
  `.template` are intentionally allowed (documented trackable practice).
- **Removal lifecycle**: the sync never prunes — when you delete a file from
  `.root/`, also delete its workspace-root copy (the pre-commit audit flags
  drift, not orphans).
- **EOL note**: the audit compares raw bytes — after changing git eol
  settings (`core.autocrlf`), re-run the sync to avoid mass false drift.

## Sync set (derived — no hardcoded list)

The mirror set is *every* file under `app/.root/` except `copy-to-root.ps1`.
Currently: `AGENTS.md`, `CLAUDE.md`, `README.md`, `worktree-add.ps1`,
`worktree-add.bat`, `.opencode/opencode.json`. To extend the set, just add
files under `.root/`.

## Worktrees

Create worktrees only via `worktree-add.ps1` (synced to the workspace root):
it enforces `.worktrees/` at the workspace root (never inside `app/`), uses
cone-mode sparse checkout by default, and honors `GIT_WORKTREE_ROOT` for
secondary-disk relocation.
