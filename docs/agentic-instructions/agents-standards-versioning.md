# agents-standards-versioning.md — Standards versioning: baseline vs project-specific conformance

This topic is superseded by `docs/designs/20261028-standards-versioning-design.md`, which is the authoritative specification for the date-integer baseline scheme. This topic summarizes the scheme as implemented in the template.

## Purpose
Version the shared agentic coding standards so you can tell which projects run the latest baseline, and clearly distinguish baseline standards from project-specific additions.

## Versioning scheme (date integer)
- `z-agentic-coding-standards/workspace-template/app/docs/agentic-instructions/README.md` first line: `Baseline version: YYYYMMDD` (e.g. `Baseline version: 20261028`).
- The baseline date integer is the SSoT — the single source of truth for "latest baseline."
- Plain integer comparison — `20261028 > 20261027` — no MAJOR/MINOR/PATCH semantics and no separate bare version file.
- Any change to a baseline `agents-baseline-<name>.md` topic bumps the date to today. Project-specific additions never bump the baseline version.

## Baseline vs project-specific standards
- Baseline standards: `agents-baseline-<name>.md`, shipped in this template's `app/docs/agentic-instructions/`. Versioned by the baseline date. Any change to one bumps the baseline date.
- Project-specific standards: `agents-project-<name>.md`, living only in a project's own repo (e.g. `<REPO_DIR>/docs/agentic-instructions/agents-project-<name>.md`). Never tracked by the baseline version; never trigger a baseline bump.
- Bare `agents-<name>.md`: reserved for already-shipped baseline topics during the transition period; the baseline file is authoritative when both exist.

## Project conformance (STANDARDS_VERSION)
- `<REPO_DIR>/STANDARDS_VERSION` — single line in each project repo root declaring the baseline date integer it conforms to (e.g. `20261028`).
- Equal to baseline → up to date. Older → out of date. Absent → not declared. Newer → ahead.
- Drift audit: `z-install/check-standards-version.ps1 <project-root> [...]` compares each project's `STANDARDS_VERSION` against the baseline and reports OK / OUT OF DATE / NOT DECLARED / MALFORMED / AHEAD / MISSING.
