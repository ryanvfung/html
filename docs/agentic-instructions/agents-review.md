# agents-review.md — Fresh-eyes sub-agent review
- Spin up a subagent with minimal context using a cheap model to review your changes for fresh-eyes problems.
- Carve-out: skip sub-agent review for trivial/low-risk changes (e.g., typo fixes, single-line docs edits) to avoid overengineering per agents-scope.md.
- Model/cost bound: prefer the cheapest available model; one review subagent per change set; do not chain multiple reviewers unless findings conflict.
