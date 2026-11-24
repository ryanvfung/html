# Plan Review — Reviewer B

- source: subagent
- model: z-ai/glm-5.3-flash (subagent replacement)
- date: 2026-11-08
- plan: docs/plans/20261108-pyrocarbon-v6-plan.md

## Summary

The plan is unusually disciplined: 24 right-sized tasks, per-task verification commands, pinned dependencies, and a Review Focus section that names the six failure modes a reader would hit. But several of its own verification steps cannot pass as written, one token name collides across tiers, the Tailwind track's stated consumption model is broken, and the headline "AA contrast" claim has neither a passing value nor a test. Findings below; completeness scored 7/10.

## Findings

1. **HIGH — Task 1 (Step 4):** The toolchain check expects `13` devDependencies, but the `package.json` in Step 1 lists exactly 12 (`@playwright/test`, `@tailwindcss/cli`, `@tailwindcss/vite`, `cross-env`, `html-validate`, `postcss-scss`, `pug`, `pug-lint`, `sass`, `stylelint`, `tailwindcss`, `vite`) — the first verification step in the plan fails on day one. **Fix:** change the expected count to `12` (or justify the missing 13th dependency).

2. **HIGH — Tasks 3 & 4:** `--border-strong` is declared twice with incompatible meanings — Tier 1 gives it `0.125rem` (a width), Tier 2 gives it `var(--neutral-5)` (a color). Custom properties are global, so one declaration silently wins and either every `border: var(--border-strong)` in components renders a color-as-width or the token display in `gen-spec.mjs` lies about the value. **Fix:** rename the Tier-1 width token (e.g. `--border-width-strong`) and update Tasks 9–12 consumers.

3. **HIGH — Task 20 vs Task 23:** `_tailwind-theme.css` contains only `@import "tailwindcss"` + the `@theme` block; it never loads `_tokens.scss`, yet the README tells consumers to "Import `src/tokens/_tailwind-theme.css`" and use `bg-surface-canvas` — every utility resolves against undefined custom properties. The in-file comment assumes "consumers import _tokens.scss" but no document says so. **Fix:** have README document both imports (or make the theme file `@import` the token layer) and add a compiled-output assertion in Task 20.

4. **HIGH — Tasks 4 & 22:** Light theme sets `--text-on-brand: var(--neutral-10)` (#f8f7f7) on `--surface-brand: var(--orange-5)` (#ff7700) — roughly 2.7:1, failing WCAG AA, while `DESIGN.md` claims "AA contrast" ships in Phase 1 and DoD item 12 is discharged only by an agent self-review paste. Dark theme correctly uses near-black on the same orange, so the two themes disagree. **Fix:** set light `--text-on-brand` to a dark neutral and add one Playwright contrast assertion (Task 21) instead of a self-attestation.

5. **HIGH — Tasks 1 & 24 (cwd ambiguity):** Steps mix working directories without saying which: Task 1 Step 3 says "Run (in `v6/`)" but Step 5 runs `git add v6/package.json` (repo-root-relative), and Task 24 Step 3's `git status --short 5.2` executed from `v6/` fails outright with `pathspec '5.2' did not match any files` — so the "legacy untouched" DoD check cannot pass as written. **Fix:** annotate every command with its cwd and run the 5.2 check as `git status --short -- 5.2` from the repo root.

6. **MEDIUM — Task 5 vs Review Focus:** The Review Focus promises Task 5 "pins that `--orange-5` **and `--surface-canvas`** are unchanged across densities," but Step 2 only counts `--orange-5` occurrences; `--surface-canvas` is never checked anywhere in Task 5. **Fix:** add a second assertion that the compiled density blocks contain no `--surface-canvas`/`--orange-*` declarations.

7. **MEDIUM — Task 14/16 markup:** Task 14's interface claims the JS sets `aria-expanded`/`aria-pressed`, but only the theme button carries `aria-pressed`; the density button (Tasks 16, 19) has no state attribute and `applyDensity` never updates one — screen-reader users get no feedback that density changed. **Fix:** add `aria-pressed` to the density toggle in both pages and update it in `applyDensity`.

8. **MEDIUM — Task 14/21 (test gaps vs Review Focus):** Review Focus item 1 ("pages render light + default with zero JS") and theme persistence are never tested — no `javaScriptEnabled: false` context, no reload/`pc-theme` round-trip, and the `prefers-color-scheme: dark` initial branch is untested. **Fix:** add a zero-JS default-styled test and a persist-across-reload test to `test/spec.spec.ts`.

9. **MEDIUM — Task 12/14/21:** The mobile nav contract (`[data-open="true"]`, `aria-expanded`, the 40em breakpoint) is built across three tasks but has zero Playwright coverage — the one interactive component most likely to break at 320px ships untested. **Fix:** add a viewport-400px test that clicks `[data-nav-toggle]` and asserts the list becomes visible and `aria-expanded="true"`.

10. **MEDIUM — Task 6 (lint blind spot):** `lint:css` globs `src/**/*.scss` only, so `_tailwind-theme.css` — the entire Tailwind track from Task 20 — is never stylelint-checked; token-discipline rules (no hex, no px) don't apply to it. **Fix:** widen the glob to `src/**/*.{scss,css}` and verify Task 20's file passes.

11. **MEDIUM — Tasks 20 & 24 (circular DoD check):** DoD item 10 is verified by counting `var(--` **in the source file** `_tailwind-theme.css` — the same lines the task just wrote, so the check passes even if the compiled Tailwind output is empty. **Fix:** count `var(--…)` in the `dist/tailwind-probe.css` compiled output instead.

12. **MEDIUM — Task 15 (build fragility):** `emptyOutDir: true` deletes the tracked `dist/` on every `npm run build`; a Vite failure mid-build (Task 15 is the first build, before `postbuild` page rendering exists) leaves the working tree with deleted tracked artifacts and the plan specifies no recovery step. **Fix:** add a note that a failed build must be restored with `git checkout -- v6/dist` before retrying.

13. **MEDIUM — Task 1/README (standalone lint):** `npm run lint` runs `lint:html` against `dist/*.html`, which doesn't exist on a fresh clone before `npm run build`, yet README documents `npm run lint` as an independent command — it fails with a glob error for new contributors. **Fix:** document "run `npm run build` first" or make `lint` depend on `build`.

14. **LOW — Task 1/23:** `cross-env` is pinned as a dependency and README claims "cross-env is used only when setting env vars," but no task ever sets an env var — dead dependency and false documentation. **Fix:** drop `cross-env` from `package.json` (and the count in Task 1 Step 4) or add the usage it exists for.

15. **LOW — Task 18 vs Review Focus:** Review Focus item 6 says "Task 18 pins computed color inside two adjacent combos," but Task 18 only counts `data-theme=` occurrences; the computed-color assertion lives in Task 21 and compares light vs dark (not adjacent combos, not density leakage). **Fix:** move the assertion into Task 18 or correct the Review Focus attribution.

16. **LOW — Task 4 (dead tokens):** `--surface-overlay`, `--shadow-card`, and `--elevation-strategy` are produced by Task 4 but consumed by no component task (9–13) and aren't displayed by `gen-spec.mjs` — dead surface area that will drift unreviewed. **Fix:** defer them to the v6.1 tasks that use them (no modal/card exists yet).

17. **LOW — Task 18 (a11y consistency):** `spec.pug` ships without the skip link, header, and footer that boilerplate and showcase both include, so the "visual truth" page has a weaker landmark/keyboard baseline than the pages it's meant to demonstrate. **Fix:** reuse the boilerplate chrome (skip link + header + footer) in `spec.pug`.

## What holds up

Task ordering and interfaces are explicit and machine-checkable; the six Review Focus items map to real risks (comma-containing token values, localStorage throwing, 320px overflow) rather than boilerplate; Tasks 2–5 correctly split the token layer so a reviewer can reject one tier; the `try/catch` storage guard and its throwing-stub test are genuinely adversarial; deferred scope (alerts/cards/WCAG audit) is named instead of silently dropped.

## Completeness score: 7/10

Deductions: a verification step that cannot pass as written (Finding 1), a cross-tier token-name collision (Finding 2), a broken documented consumption model (Finding 3), an accessibility claim with a failing value and no test (Finding 4), and a broken DoD command (Finding 5) — five defects that would each surface mid-implementation, plus several Review Focus promises that the cited tasks don't actually pin (Findings 6, 15).
