# Agents — Workflow
# Template boilerplate (portable; edit freely for the project). Covers the
# workspace shell: layout, shadow mechanism, hooks, worktrees, scratch space.

## Workspace Layout

- `<workspace root>` — generated shadow files only (AGENTS.md, CLAUDE.md,
  README.md, worktree helpers, `.opencode/` config). Not a git repo.
- `<REPO_DIR>/` — the git repository (source, tests, `<REPO_DIR>/docs/`, `<REPO_DIR>/todo.md` SSoT). The repo dir name is derived dynamically at bootstrap (default `<workspace-folder>_app/`; `app/` is the legacy example).
- `.worktrees/` — worktree checkouts, sibling to `<REPO_DIR>/`. Create only via
  `worktree-add.ps1` (guards: never inside `<REPO_DIR>/`, sparse cone by default).
- `tmp/`, `tmp_scripts/` — untracked scratch space; never inside `app/`,
  never shadow-tracked, never committed.

## Workspace-Root Files Are NOT Directly Editable — the `app/.root/` Shadow Mechanism

- `app/.root/` is the **single source of truth** for workspace-root files.
  Everything under it (except `copy-to-root.ps1` itself) mirrors to the
  workspace root — recursively, one-way. There is no reverse sync.
- **Track a new workspace-root file**: create it under `app/.root/` at the
  same relative path, run `app/.root/copy-to-root.ps1`, commit inside `app/`.
- **Edit a tracked file**: edit the `app/.root/` version, re-run the sync,
  commit. Editing the workspace-root copy directly creates drift, which
  `app/.githooks/pre-commit` blocks.
- **Mirror set is derived** — every file under `.root/` except the sync
  script; no hardcoded list to maintain.
- **Never** place secrets under `.root/` or the workspace root: `.env`,
  `cookie_*.txt`, `*_token.json` are excluded by the sync script (skips +
  warns) and blocked from committing by the pre-commit credential guard.
  `tmp/`, `tmp_scripts/` are never tracked.
- **Removal lifecycle**: the sync never prunes — deleting a file from
  `.root/` also requires deleting its workspace-root copy.
- **EOL note**: after changing git eol settings (`core.autocrlf`), re-run
  the sync to avoid mass false drift (the audit compares raw bytes).
- **Sync**: `powershell -ExecutionPolicy Bypass -File <REPO_DIR>/.root/copy-to-root.ps1`
  (self-locating; derives the repo dir from its own path; refuses to run where
  there is no repo dir; PowerShell-only). Substitutes `{{REPO_DIR}}` into synced
  text files that contain it (e.g. `.opencode/opencode.json`).

## Git Hooks (`app/.githooks/`, activated via `git config core.hooksPath .githooks`)

- `pre-commit` — three layers: (1) credential guard (blocks staging `.env`,
  `cookie_*.txt`, `*token.json` — post-commit would auto-push them within
  seconds; `.env.example`/`.sample`/`.template` allowlisted); (2)
  NUL-delimited renormalize (space-safe); (3) shadow-drift audit — walks
  every file under the running checkout's own `app/.root/`, blocks on
  content drift *or* a missing workspace-root mirror; fails open when the
  workspace root can't be resolved. Project lint/test checks live in marked
  slots at the bottom of the hook — enable per project.
- `post-commit` — best-effort auto-push, one attempt, never forced, never
  blocks a commit. Skip: `GIT_AUTOPUSH=0`. Logs: `<git-common-dir>/push-log.txt`
  (human), `<git-common-dir>/~pushlog.jsonl` (agent).

## Framework hooks (OpenCode — not git)

- `.opencode/opencode.json` at the workspace root (synced from
  `app/.root/.opencode/`) registers `app/.hooks/propose-guard.js` — the
  propose-only mutation gate (see `agents-propose-guard.md`). The static
  rule applies by instruction regardless of whether the hook loads.

## Worktrees

- Create only via `worktree-add.ps1` (synced to the workspace root; `.bat`
  shim for cmd). It enforces `.worktrees/` at the workspace root — guards
  run on the final target, so `GIT_WORKTREE_ROOT` relocation cannot bypass
  them — creates cone-mode sparse checkouts by default (edit its
  `$SparseDirs` default to match the project layout), and honors
  `GIT_WORKTREE_ROOT` for secondary-disk relocation with fallback.
- The sparse cone **always** includes `.githooks` and `.root` (post-verified
  after creation) — without them the pre-commit guards are silently skipped
  in the worktree. Never remove them from the cone.
- Review/merge work uses `git diff` only — never a second full checkout.

## Scratch Routing

- `tmp/` — temporary artifacts (`*.txt`, scan dumps, working state). Never
  committed, never shadow-tracked.
- `tmp_scripts/` — one-off scratch scripts (`.py`, `.ps1`, `.sh`, `.bat`).
  Never at repo root, never inside `app/` tracking.

## Shell command composition (PowerShell)

- The default shell here is PowerShell (`powershell.exe`), which does **not**
  support `&&` for command chaining — it is not a valid operator and will
  fail. Run commands as separate statements or separate shell calls instead.
- To chain statements on one line, use `;` (statement separator). Note that
  `;` runs each command regardless of the prior command's exit code, unlike
  `&&` in POSIX shells.
- For "run next only if previous succeeded," do not use `&&`. Either run the
  commands as separate shell calls and check each result, or use an explicit
  `if` block: `<cmd1>; if ($LASTEXITCODE -eq 0) { <cmd2> }`.
- Prefer separate shell calls per command so each call's success/failure is
  individually observable and easier to debug.
