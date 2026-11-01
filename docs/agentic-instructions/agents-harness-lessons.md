# agents-harness-lessons.md — Promoted tier-1 harness lessons for the agentic instructions baseline

Promoted from the tier-1 harness store (`skills-opencode/lessons-learnt/store/harness.jsonl`). Each rule is keyed to its harness.jsonl record so the template stays traceable to the source lesson.

Notes:
- `pyyaml-preinstalled` is tier-2 and deliberately excluded from this baseline roster.
- `write-tool-fails-on-large-content-in-this-harness` is not added as a separate rule; it references `write-tool-payload-ceiling` instead.

## Promoted rules (13)

- Write/edit tools fail above ~500 chars; write a skeleton first, then fill in chunks. [source: write-tool-payload-ceiling]
- This environment's git wrapper auto-pushes every commit; treat every commit as published and verify remote state with `git ls-remote`. [source: harness-autopush-pushes-every-commit]
- `git add` of one file takes the whole file; add paths one by one, never `add .`, and check `git status` before committing. [source: path-scoped-git-add-sweeps-parallel-session-edits]
- A parser that drops unrecognised content makes "nothing to fix" look like "nothing read"; report 2+ field markers and files with content but zero entries. [source: silently-ignored-content-reads-as-clean]
- Independent substring checks miss drift; use one contiguous assertion over the full string and mutation-test the guard. [source: drift-guard-must-be-one-contiguous-assertion]
- Re-measure the target corpus as step 1 of any remediation plan; snapshots go stale within hours. [source: remediation-plans-built-on-a-snapshot-go-stale-fast]
- The prompt-injection guard applies only to tier 1 (loaded into agent context everywhere); never on a repo-owned tier — it false-positives on `override:`/`user:`. [source: injection-guard-belongs-only-on-the-global-tier]
- After a stash-pop conflict, `git grep` reads both conflict sides plus markers; inspect the file itself before concluding a revert. [source: git-grep-reads-conflicted-files-as-both-sides]
- One session's stash can auto-apply on another's commit; diff the stash against the committed result to prove nothing was lost. [source: parallel-session-stash-collisions-lose-track-of-ownership]
- A staleness check can only judge paths relative to the repo root; home-relative paths and slash-joined name lists are not paths. [source: prune-must-skip-paths-it-cannot-resolve]
- PowerShell 5.1 writes UTF-8 as GBK/UTF-16 by default; re-encode with Python `encoding="utf-8"`, never PowerShell Out-File. [source: powershell-cp936-encoding-damage]
- Read the target region before patching; re-read before writing large artifacts to avoid overwriting unintended content. [source: read-target-region-before-patching]
- Write a skeleton first, then fill in chunks — never emit a large artifact in one call. [source: externalize-first-write-discipline]
