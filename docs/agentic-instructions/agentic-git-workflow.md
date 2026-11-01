# Agentic Git Workflow — SSoT

Generalized workflow for agent-driven git work. Overrides below make it flexible; default is cautious (worktree isolation, hold for merge, no force-push). Case-specific exceptions (e.g., particular branch names, temporary exception branches) are intentionally omitted — add locally or via prompt override, not here.

## 1. Default (cautious)

- **Work in a worktree** (isolated), never directly on the shared branch (master/main) unless overridden.
- **Worktree directory**: `<workspace-root>/.worktrees/` — a sibling of the git repo (`app/`), never inside it. Projects may extend with local relocation (e.g., `GIT_WORKTREE_ROOT` for a secondary disk); do not invent project-specific paths without confirmation.
- **Commit after each task**: stage relevant files, descriptive message, run tests (e.g. `pytest`) before commit if applicable.
- **Hold for merge**: after commit, do **not** merge or push to shared branch automatically. Hold. User / integration process merges when ready.
- **No destructive operations without confirmation** (`rm -rf`, force-push, etc.). Route through `careful` / confirmation.
- **Auto-push**: if a hook tries push post-commit, best-effort only; never block commit; skip with `GIT_AUTOPUSH=0` if needed.

## 2. Override clauses (prompt-sensitive; err cautious)

If the prompt / instruction / env indicates any of the following, override the default. Use judgment; when in doubt, ask rather than assume: prefer confirming with user over silently overriding.

| Signal / phrase (examples; not exhaustive) | Override effect |
|---|---|
| `direct`, `work directly in master/main`, `skip worktree` | Allow working directly in the shared branch instead of a worktree. Still commit per task. |
| `merge when done`, `merge immediately`, `merge after task`, `land it` | After implementation + tests, allow merge (and push if appropriate) instead of holding. Confirm merge target (master/main?). |
| `merge now`, `fast merge allowed` | Allow direct merge of current task branch; still prefer descriptive commit. |
| `override worktree`, `use main workspace` | Skip worktree creation for this task. |
| `force push ok`, `force-push allowed` (with context) | Allow force-push only when explicitly justified; else refuse. |

**Principle**: overrides are guiding, not absolute. If a prompt says "direct" but also involves destructive commands or untested code, prefer caution: confirm or apply only the non-destructive part (e.g., work directly in master but still hold for merge until confirmed).

**Config / env layer** (optional, for repeated patterns):
- `AGENT_GIT_DIRECT=1` → default direct (can be overridden back by prompt requiring worktree).
- `AGENT_GIT_MERGE_HOLD=0` → allow merge after commit by default.
- Prompt keywords always take precedence over env (more specific = wins).

## 3. Worktree rules (canonical location)

- Worktrees live at `<workspace-root>/.worktrees/` — a sibling of the git repo (`app/`); one subfolder per worktree, named by purpose/branch (see `agents-worktrees.md`).
- Establish worktrees via the `implement` skill / equivalent mechanism (creates isolated worktree, runs pipeline, commits, holds for merge).
- Preserve existing parallel-session worktrees; do not move/delete them.
- Secondary-disk relocation (`GIT_WORKTREE_ROOT`) and sparse-cone tuning are project-local details — see `agents-workflow.md`.

## 4. Commit / merge protocol (general)

```
work → test (if applicable) → commit (descriptive) → hold for merge
```
Override (`merge when done` / prompt):
```
work → test → commit → merge → push (if remote configured)
```

If worktree was used: commit in worktree; merge from worktree branch to target; do not commit directly to target unless `direct` override active.

## 5. What is deliberately excluded (case-specific; add locally)

These are omitted so the SSoT stays portable. Project should maintain a local supplement (e.g., `docs/project-git-rules.md`, or section in local `AGENTS.md`) rather than pollute this file:

- Per-session exception branches / temporary worktrees (e.g., `temp-T061-print-mutex`).
- Project-specific branch names beyond generic `master`/`main`.
- Project-specific test command beyond generic `pytest`; project may document its own.
- Local hook details beyond the shipped set (pre-commit shadow/credential audit, best-effort auto-push) — see `agents-shadow-sync.md`.


## 6. Reference / adoption

Use this as SSoT. For project-specific instantiation:

- Keep this file unchanged (portable).
- In project repo, either:
  (a) create local `docs/git-workflow-local.md` that references this file and adds local paths / exceptions, or
  (b) replace local `AGENTS.md` workflow section with a reference line (`"See agentic-git-workflow.md (SSoT) + local supplement docs/git-workflow-local.md"`) and move project-specific rules to the supplement.
- Do not duplicate the full protocol in both places; that's the point of SSoT.

## 7. Session commitment rule (prevent sweeping / cross-session leaks)

Only commit files this session actually modified / created. Never include unrelated parallel work (other agents' branches, untracked artifacts from other sessions, unrelated source changes, temporary files, unrelated worktree contents). Verify with git status (or equivalent) and stage explicitly (`git add <file>`) rather than `git add .` or broad patterns. In worktrees: commit only within the worktree; do not stage files from the main repo or sibling worktrees. If a file was not touched by this session's task, do not include it — even if it is technically modified / untracked in the directory.
