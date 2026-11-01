# agents-risk-tiers.md — T0–T3 risk-based dispatch

- Purpose: scale effort to risk so trivial questions don't burn a full funnel and architecture/contract changes don't skip review.

| Tier | Meaning | Dispatch | Example |
|------|---------|----------|---------|
| T0 | Minimal-read question | One quick read, no worker set, no gate | "What does this function return?" |
| T1 | Trivial change | One gate (verify + commit), minimal worker set | Typo fix, comment update |
| T2 | Contained change | Minimal worker set (implement → verify-code → commit), T2+ hard edge applies | Add a field, refactor one module |
| T3 | Architecture / contract / ambiguity | Full funnel (design → plan → implement → verify-code → ship → review) | New API endpoint, persisted-format change, cross-module refactor |

- Hard edge (T2+): anything that could alter behavior, interface, persisted format, security posture, or is spec-covered (covered by DESIGN.md/PLAN.md/spec) is T2 or higher, regardless of size.
- Ambiguity: if the tier is unclear after a quick read, treat as T2. Never downgrade a T3 to T2 to save effort.
- `implement` and `sitrep` should read the tier before dispatching work.
