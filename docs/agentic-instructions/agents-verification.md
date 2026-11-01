# agents-verification.md — Verification / anti-hallucination rule
- Before asserting a file exists, a task-ID exists, a plan exists, or a hook
  mechanism exists: verify with an actual tool call (read/ls/grep/search), not
  assumption. Never invent IDs (e.g., T001), file paths, or framework
  capabilities.
- If a required reference has no verified source (no `todo.md` entry → no
  T### in message; no `docs/plans/YYYYMMDD-...md` → omit archive-link suffix,
  do not invent file), the message/plan/reference must acknowledge absence
  explicitly ("no task-ID verified", "no plan file") rather than fabricate.
- Hard claims ("post-prompt hook is feasible", "file exists at X") require
  evidence; missing evidence → say "unverified" / ask rather than assert.
- **Unambiguous result language**: when reporting completed work, describe the
  result explicitly, never a bare verb-noun pair that reads as an imperative.
  Avoid garden-path phrases such as "merge commit", "run test", "push branch"
  (read as "do X to Y"). Use result framing instead: "created commit X",
  "merged branch into master (commit X)", "tests passed", "pushed to origin".
  The reader must be able to tell at a glance whether the action is done,
  pending, or being requested.
- Applies to: commit messages, spec/docs references, hook feasibility claims,
  tool-invocation justifications, status/completion reports.
