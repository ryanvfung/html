# AGENTS.md — project agent instructions (thin index; template boilerplate)
# Convention: keep this base file concise — an index plus project-critical
# one-liners. Topic details live in docs/agentic-instructions/agents-<topic>.md;
# add each new one to the Index below.

## Index

Workspace shell:
- `docs/agentic-instructions/agents-workflow.md` — workspace layout, `.root/` shadow mechanism, git hooks, worktrees, scratch routing

Git workflow:
- `docs/agentic-instructions/agentic-git-workflow.md` — default cautious git workflow (worktree isolation, hold-for-merge) + prompt-sensitive overrides
- `docs/agentic-instructions/agents-branch-naming.md` — branch naming: `<type>/YYYYMMDD[-taskID]-slug`
- `docs/agentic-instructions/agents-commit-conventions.md` — commit messages, commit-on-milestone, closing sequence

Structure & conventions:
- `docs/agentic-instructions/agents-file-layout.md` — repo layout: `<REPO_DIR>` repo (derived dynamically at bootstrap, default `<workspace-folder>_app/`; `app/` is the legacy example), `.root/` SSoT + sync script, reference tree
- `docs/agentic-instructions/agents-docs-plans.md` — docs/plans format, archive mirroring
- `docs/agentic-instructions/agents-todo.md` — todo.md SSoT, format, A→B move order
- `docs/agentic-instructions/agents-archive.md` — archive rules, plan status values, review gate
- `docs/agentic-instructions/agents-shadow-sync.md` — `.root/` mechanism + pre/post-commit hook audit
- `docs/agentic-instructions/agents-worktrees.md` — `.worktrees/` location, creation guards, cleanup
- `docs/agentic-instructions/agents-linting.md` — lint-obedience (lint = build-blocking)
- `docs/agentic-instructions/agents-propose-guard.md` — PROPOSE-vs-IMPACT mutation gate + propose-guard hook deploy
- `docs/agentic-instructions/agents-verification.md` — verify-before-assert rule (no invented IDs/files/plans; evidence for hard claims)
- `docs/agentic-instructions/agents-mistake-handling.md` — mistake posture / no-apology error handling
- `docs/agentic-instructions/agents-scope.md` — YAGNI / scope discipline / engineering grade
- `docs/agentic-instructions/agents-review.md` — fresh-eyes sub-agent review
- `docs/agentic-instructions/agents-adr.md` — Architecture Decision Record discipline (hard to reverse + surprising + real trade-off).
- `docs/agentic-instructions/agents-glossary.md` — persistent terminology; design/plan-writing add disambiguated terms here.
- `docs/agentic-instructions/agents-risk-tiers.md` — T0–T3 risk-based dispatch; hard edge makes behavior/interface/persisted-format/security/spec-covered changes T2+.
- `docs/agentic-instructions/agents-standards-versioning.md` — standards versioning: date-integer `Baseline version: YYYYMMDD` README first line, baseline vs project-specific differentiation, per-project `STANDARDS_VERSION` conformance, drift audit via `z-install/check-standards-version.ps1`.
