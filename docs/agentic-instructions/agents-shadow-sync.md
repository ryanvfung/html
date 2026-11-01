# agents-shadow-sync.md — .root mechanism + hook audit
- `.root/` one-way mirror; sync script self-locating via its own path; excludes secrets/temp/builds.
- Pre-commit hook (`<REPO_DIR>/.githooks/pre-commit`): activates via `core.hooksPath .githooks`; `chmod +x` on macOS/Linux (Git skips non-executable silently); shadow-drift audit blocks commit on drift/missing mirror; credential guard (same hook); lint/test slots at bottom. The hook locates the workspace root dynamically by finding a child with a real `.git` directory (the repo dir), so it works whether the repo is named `app/` (legacy) or `<workspace>_app/` (new).
- Post-commit hook (`app/.githooks/post-commit`): best-effort auto-push; POSIX `sh`; skips `GIT_AUTOPUSH=0`; never `-f`.
