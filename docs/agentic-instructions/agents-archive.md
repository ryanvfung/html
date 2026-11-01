# agents-archive.md — archive rules, status, review gate
- Archive README (`docs/archive/README.md`) listing moved items (optional but browsable).
- Plan archive status (loose): `completed` / `cancelled` (evidence required) / `obsolete` (evidence required).
- Plan filename uniqueness: `YYYYMMDD-<slug>` no collision; same-day same-topic → `-v2`, `-v3`; keep slug readable.
- Shadow-copy audit (pre-commit hook): walks `.root/`, blocks on content drift or missing workspace-root mirror; fails open when `.root/` absent or not inside workspace; credential guard runs same hook; project lint/test in bottom slots.
- Auto-push hook (`post-commit`): best-effort, never-force (`git push -u`; `grep -E` pins no `-f`); exits 0; skip via `GIT_AUTOPUSH=0`; audit `push-log.txt` + `~pushlog.jsonl`; activate via `git config core.hooksPath .githooks`.
