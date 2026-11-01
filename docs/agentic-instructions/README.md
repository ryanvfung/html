Baseline version: 20261029

# Agentic Coding Standards — Baseline

## Purpose
This folder contains the topical agentic coding standards (`agents-*.md`) that form the shared baseline for all projects bootstrapped from `z-agentic-coding-standards/workspace-template/`. Standards here are versioned by the baseline date on the first line of this file. Any change to a baseline topic bumps this date.

## Baseline vs project-specific
Baseline standards use the `agents-baseline-<name>.md` naming and live in this template. Project-specific additions live in each project's own repo under `docs/agentic-instructions/agents-project-<name>.md` and are not tracked by the baseline version.

## Sync mechanism
Project workspaces mirror root files from `app/.root/` via `app/.root/copy-to-root.ps1` (one-way, recursive; edit `.root/`, re-run sync, commit). Topical standards are read in place from `app/docs/agentic-instructions/`; do not copy them into the project root.

## Establishing project-level standards
A project that needs its own standards creates `agents-project-<name>.md` in `<REPO_DIR>/docs/agentic-instructions/`, adds it to the project `AGENTS.md` index, and declares conformance via `<REPO_DIR>/STANDARDS_VERSION`. Project-specific standards never bump the baseline version and never cause drift against it.

## Checking conformance
Run `z-install/check-standards-version.ps1 <project-root> [...]` to compare each project's `STANDARDS_VERSION` against the baseline version and report up-to-date / out-of-date / not-declared / malformed / ahead.

## Onboarding a new project
Copy `workspace-template/` into the new project root, run the sync, set `<REPO_DIR>/STANDARDS_VERSION` to match the baseline version, then commit.
