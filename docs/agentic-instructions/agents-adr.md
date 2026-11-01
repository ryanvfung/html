# agents-adr.md — Architecture Decision Record discipline

- Purpose: record choices that are hard to reverse, surprising, or a real trade-off. Not for routine decisions.
- Write an ADR only when all three apply:
  1. hard to reverse (changing it later would require migration, rework, or breaking changes), AND
  2. surprising (the choice is non-obvious or contradicts the apparent default), AND
  3. a real trade-off (there are genuine pros and cons on each side).
- Format: status / context / decision / consequences. One ADR file per decision, named `docs/adr/YYYYMMDD-<slug>.md`.
- Cross-reference: when `design` or `plan-writing` records a hard choice, link to the ADR from DESIGN.md/PLAN.md and note it in the glossary if it introduces new terminology.
- Out of scope: don't write ADRs for trivial or obviously-correct choices; they add noise without value.
