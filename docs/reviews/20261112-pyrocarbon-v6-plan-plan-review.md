# plan-review — docs/plans/20261108-pyrocarbon-v6-plan.md

**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Apply mode:** apply
**Date:** 2026-11-12
**Plan slug:** `pyrocarbon-v6-plan`

**Reviewer artifacts:**

- A — `z-ai/glm-5.3-flash` (**Source:** subagent) → `docs/reviews/20261112-pyrocarbon-v6-plan-plan-review-A.md`
- B — `inclusionai/ling-3.1-flash` (**Source:** subagent) → `docs/reviews/20261112-pyrocarbon-v6-plan-plan-review-B.md`

**Cross-examination artifacts:**

- `docs/reviews/20261112-pyrocarbon-v6-plan-cross-A-on-B.md`
- `docs/reviews/20261112-pyrocarbon-v6-plan-cross-B-on-A.md`

**Provenance note:** The requested OpenRouter IDs (`z-ai/glm-5.3-flash`, `inclusionai/ling-3.1-flash`) were blocked by the account's OpenRouter guardrail (404, `model-ignored-by-guardrail`), and the configured OpenRouter fallbacks returned `content: null` after exhausting their token budget on reasoning. Per the user's correction, the same model names were run through CommandCode's native model routing as reviewer subagents. Both reviewer artifacts declare `**Source:** subagent` with the CommandCode model ID.

---

## 1. Verdict

The plan is structurally excellent — per-task interfaces, runnable verification commands, explicit deferrals — but **it cannot complete its own gate as written**. Reviewer B dry-ran the plan verbatim in a sandbox with the pinned dependencies: the build is blocked at Task 8, two of three lint configs crash, and 4 of the plan's own 12 Playwright tests are red. Reviewer A reached the same conclusion on the text alone and independently reproduced six of B's defects. The combined fix set is finite and local; this is a plan that needs a correction pass, not a redesign.

**Consolidated completeness: 6/10** (A: 7/10 authoring quality, revised to 6 in cross-exam; B: 5/10 gate-and-DoD completeness). The two scores measure different things; the union is the honest number.

| Dimension | A | B | Adjudicated |
|---|---|---|---|
| Completeness | 7/10 (→6 after cross-exam) | 5/10 | **6/10** — near-exhaustive steps, but DoD 4/5/7 have no verifying step and the combo matrix is materially incomplete |
| Feasibility | 8/10 (→4 after cross-exam) | not scored | **4/10** — the pipeline does not compile as written; A's original 8 was not defensible |
| Consistency | 6/10 (→5) | not scored | **5/10** — faithful to the spec's architecture, but reproduces the spec's token collision and contradicts spec decision R |
| Testability | 6/10 (→5) | not scored | **5/10** — exemplary structure, but several checks assert the wrong thing and four fail as written |

**Security/performance:** no material concerns in either review. JS is ~40 lines, no `innerHTML`/`eval`, storage is `try/catch`-guarded, generated Pug escapes values, and the committed `dist/` is ~11.35 kB CSS / 1.09 kB JS.

---

## 2. What the cross-examination changed

- A accepts B's build-blocking findings it could not reach without executing: the Task 8 `@use` path, the html-validate 11 schema rejection, the PowerShell `pug-lint` glob crash, and the unstyled `.c-sidebar`.
- A withdraws its F14 positive verdict ("inline `<style>` exemption already done, good"): `no-inline-style` targets `style` attributes, not `<style>` elements, and the `overrides` key aborts `lint:html` outright.
- A corrects the mechanism of the `--border-strong` collision: the `outline:` **shorthand** resets entirely (`outline-style: none`, no focus ring), rather than falling back to `medium`; the `border-width:` longhand does fall back to `medium`. There are five width-position consumers, not three (adds `nav.scss`).
- A corrects its own F3 timeline: `lint:pug` crashes before it can report, and `lint:html` is red from Task 16, so the violation never "passes locally and surfaces at Task 24".
- A concedes its F7 paragraph wrongly asserted the nav items meet the 44px floor; `.btn--sm` measures 35.04px. A also retires its pin-version concern (B verified all 12 pins resolve) and its `aria-pressed="false"` nit (light is the specified pre-JS state).
- B accepts A's six additional findings: the `;`-chained exit code, the `pages` contract mismatch, the one-position `--elevation-strategy`, the boilerplate-in-6-combos gap, the itemized raw-value list, and the `.gitignore`/`dist` repo facts.
- B concedes A's objections to two of its own remedies: `dist/tokens.css` would break Task 24's exhaustive five-name audit, and generating more CSS into a Pug `<style>` block contradicts B's own finding that Pug `<style>` escapes stylelint.
- Both reviews add a seventh AA failure the pair originally missed: `.btn--ghost:hover` is `#b34f00` on `#ffddbf` ≈ **4.05:1** in light, and the `.btn:disabled` opacity failure is **WCAG-exempt** (1.4.3) and should be documented, not "fixed".

---

## 3. Consolidated findings

### 3.1 Blocking — the gate cannot go green

| ID | Finding | Evidence | Confidence |
|---|---|---|---|
| P1 | **Task 8 `@use './tokens/tokens'` cannot resolve.** `index.scss` lives in `src/styles/`; tokens live in `src/tokens/`. | Static path check; B measured `Can't find stylesheet to import`; A accepts. Blocks Task 8 verify and Task 15 build. | HIGH (both) |
| P2 | **`.htmlvalidate.json` `overrides` is invalid for html-validate 11.19.0.** `SchemaValidationError: Property overrides is not expected to be here`; `lint:html` and `verify` are red from Task 16 onward. | B measured; A accepts. Also invalidates A's only positive verdict. | HIGH (both) |
| P3 | **`lint:pug` glob crashes on PowerShell.** `pug-lint "src/pug/**/*.pug"` → `Path src/pug/**/*.pug was not found`; pug-lint 2.7.0 does not expand globs and PowerShell does not for native commands. | B measured; A accepts. | HIGH (both) |
| P4 | **`--border-strong` is a width in Task 3 and a colour in Task 4.** The later equal-specificity `:root` block wins, so the colour shadows the width. `outline:` shorthands become invalid and reset to `none`; every interactive element loses its focus ring; `[aria-invalid]` border width and the sidebar current-page bar also break. | A reasoned; B measured runtime `--border-strong = #8a7f75` and `outline-style: none`; both converge on rename. | HIGH (both) |
| P5 | **4 of 12 Playwright tests fail on the plan's exact code:** 320px overflow **18px** on boilerplate/showcase; touch targets **35.04px** (`.btn--sm` nav toggle is the first `.btn`); focus-visible outline absent (P4); `touch targets` selector is order-dependent. | B measured; A accepts measurements. | HIGH (both) |

### 3.2 High — specification/DoD gaps

| ID | Finding | Evidence | Confidence |
|---|---|---|---|
| H1 | **Task 1 Step 4 expects 13 devDependencies; the JSON defines 12.** The first task's own gate fails a correct scaffold. | Both counted 12; B measured `node -e` prints `12`. | HIGH (both) |
| H2 | **`showcase.pug` raw inline HTML violates the Task 6 `disallowHtmlText` contract**, and Task 19 never runs pug-lint. | Both; B measured pug-lint exit 2 "HTML text must not be used". | HIGH (both) |
| H3 | **`gen-spec.mjs` `/^--(text|space)-/` leaks all seven semantic `--text-*` tokens into the type-scale section**, and ~60 tokens (semantic + density) appear on no section, so DoD 5 "every token" is unmet. | Both; B measured 7 leaked rows, 23 swatches/31 rows. | HIGH (both) |
| H4 | **The Tailwind track is not self-contained and its verify step asserts nothing.** `_tailwind-theme.css` never loads the token values; used alone it resolves `bg-surface-canvas` to nothing, `p-4` to 0, and `text-sm` to Tailwind's default 14px. The plan's probe grep matches zero lines because unused `@theme` keys are tree-shaken. The plan also declares `@layer tokens, reset, base, components, utilities;` but never wraps a rule in a layer, so unlayered component CSS beats Tailwind's layered utilities (measured `.btn.p-4` = 7px 12px). | Both; B measured; A accepts. | HIGH (both) |
| H5 | **No task creates the mandated branch.** Global Constraints mandates `feat/20261108-pyrocarbon-v6-plan`; the repo is on `master` and every commit would land there. | Both; repo state checked. | HIGH (both) |
| H6 | **DoD 7 (AA contrast) has no verifying step and the light theme fails.** Measured: nav brand **2.49:1**, links/form-error **4.34:1**, inline code **4.46:1**, syntax-tag **2.22:1**, syntax-comment **4.24:1**, dark selection **3.77:1**, ghost hover **4.05:1**. Task 22's DESIGN.md and Task 24 Step 5 self-certify "contrast checked" with no number. | A estimated 4.34; B measured the full set; exact agreement. | HIGH on the gap; value changes are a design decision (Section 10). |

### 3.3 Medium — correctness/verification gaps

| ID | Finding | Confidence |
|---|---|---|
| M1 | **320px nav overflow and touch-target floor.** The 40em query hides the list but never wraps/condenses the nav; nav toggles use `.btn--sm` (35.04px) below the 44px default floor. | A MEDIUM / B HIGH; measured, fix partly design choice |
| M2 | **`.c-sidebar` is never styled**, so the showcase's "two-column reading layout with a sticky contents rail" is actually one column. Not a DoD 6 failure; a prose-or-markup correction is available. | B HIGH defect / A MEDIUM severity |
| M3 | **`verify` includes Playwright while spec decision R says Playwright is opt-in.** Spec §13.4 also wants the spec page before the second component; the plan ships it at Task 18 without acknowledging the reorder. | B HIGH / A MEDIUM |
| M4 | **`npm run dev` serves no pages.** Vite has only a JS input; Pug pages render via `postbuild`, and `prebuild` never runs in dev. README advertises it without caveat. | Both MEDIUM |
| M5 | **Stylelint contract is weaker than spec §4/§9.** No `font-family` restriction; no `linear-gradient`-on-text or undeclared-custom-property rules; DoD 3's "no raw values" overclaims while `0.125em`/`2.5em`/`1.25rem` pass. | Both |
| M6 | **DoD 4 (boilerplate in 2 themes × 3 densities) is only weakly covered.** Theme and density are toggled independently; boilerplate is never exercised in all six combos. | A MEDIUM; B accepts |
| M7 | **Task 24 Step 3 audits are cwd-inconsistent and partly vacuous.** `git status --short 5.2` from a subdirectory detects nothing; `$LASTEXITCODE` does not reflect a cmdlet; DoD-10's `var(--` count passes at the boundary and proves nothing about resolution. | B MEDIUM |
| M8 | **Task 4 Step 3 grep can never match.** Dart Sass emits `[data-theme=light]` unquoted, so the quoted pattern finds nothing. | B HIGH / A accepts |
| M9 | **Task 17 Step 2's `rgba()` assertion is fine** (A rebutted B's "circular" charge; it is a property assertion against a known literal). The `clamp()` check greps the generated file, not the rendered page. | A/B disagreement resolved |

### 3.4 Low — polish and contract mismatches

- **Task 7 Step 3** `npx sass …; npx sass …` swallows the first exit code (A).
- **Task 16 Interfaces** promise a `pages` array that Tasks 18–19 extend; the snippet hardcodes `['boilerplate']` (A).
- **Task 5 Step 2** pins `--orange-5` but not the promised `--surface-canvas` density invariance (B).
- **`--elevation-strategy` is a one-position switch** (both themes = `shadow`) codified by DESIGN.md (A; B adopts).
- **`--surface-overlay`, `--shadow-card`, `--text-inverse`, `--surface-brand`/`--text-on-brand`** are undocumented drift from spec §4 or unconsumed in v6.0.
- **Density toggle has no state affordance**; `aria-pressed` is the wrong semantic for a 3-state cycler (B; A's correction).
- **Mobile nav has no Escape/close-on-navigate semantics** (B, over-weighted as MEDIUM; LOW polish).
- **Showcase form submit** has no `action`/`novalidate`, so it does a native GET navigation (B, LOW).
- **Task 21** `reuseExistingServer: true` and no `strictPort` can silently test a stale `dist/` (both).
- **README overclaims** "Imports must match file case exactly (lint-enforced)" — no configured rule enforces it — and omits `npx playwright install chromium` and the DESIGN.md link (both).
- **`cross-env` is unused** and `@tailwindcss/vite` is idle in the measured build (both).
- **Boilerplate `aria-pressed="false"` is correct pre-JS** (A's nit withdrawn by cross-exam).
- **Plan pins:** all 12 resolve on the registry (B verified); A's version-ambition concern is retired.
- **Dirty-tree observation (B31):** non-actionable; the tree changed between reviewer reads because the review files themselves are new untracked files.
- **DoD list not restated in the plan; archive/closing-sequence and repo-hook notes** belong to `ship`/repo conventions, not this plan (B; A's scope objection accepted).

---

## 4. Section 9 — High-confidence fixes (auto-apply eligible)

These are the cross-model HIGH fixes the heavy bar permits applying automatically. In this run, **fixes 1–11 were applied**; fix 12 is held because making it pass requires the `--text-on-brand` token split in Section 10, which is a design decision.

1. **Correct the devDependency count.** The Step 1 JSON defines 12 devDependencies, not 13.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 1 Step 4 (line 123)`
   - Change: expected output `13` → `12`.
   - Verify: `node -e "console.log(Object.keys(require('./package.json').devDependencies).length)"` prints `12` on a scaffold matching Task 1 Step 1.

2. **Rename the Tier-1 width token to stop the colour shadowing it.** Rename `--border-strong: 0.125rem` to `--border-width-strong` and update every width-position consumer; keep Task 4's colour `--border-strong`.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 3 Step 1 (line 200)`; consumers `Task 7 (line 415)`, `Task 9 (line 491)`, `Task 10 (lines 539–540)`, `Task 12 (line 636)`
   - Change: `--border-strong: 0.125rem` → `--border-width-strong: 0.125rem`; replace the five width-position `var(--border-strong)` uses (three `outline:` shorthands, `[aria-invalid] border-width`, sidebar `border-inline-start`) with `var(--border-width-strong)`; leave `kbd`'s colour use and Task 4's colour token untouched; add a note that spec §4 contains the same collision.
   - Verify: after Task 10, a focused `.btn` computes `outline-style: solid` and `outline-width: 2px`; `[aria-invalid="true"]` border width is 2px; `getComputedStyle(document.documentElement).getPropertyValue('--border-strong')` is the colour and `--border-width-strong` is `0.125rem`.

3. **Fix the stylesheet import path.** `index.scss` is in `src/styles/`; the tokens partial is in `src/tokens/`.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 8 Step 1 (line 446)`
   - Change: `@use './tokens/tokens';` → `@use '../tokens/tokens';`
   - Verify: `npx sass --no-source-map src/styles/index.scss` exits 0; `npm run build` emits `dist/pyrocarbon.css` and `dist/pyrocarbon.js`.

4. **Remove the invalid html-validate `overrides` key and stop emitting inline styles.** html-validate 11 rejects `overrides`; the swatch `style="--swatch:…"` attributes are what the key was trying to exempt.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 6 Step 2 (line 357)`, `Task 17 Step 1 (lines 909–914)`, `Task 18 Step 1 (lines 955–960)`
   - Change: delete the `"overrides"` array from `.htmlvalidate.json`. In `gen-spec.mjs`, stop emitting `style="--swatch:…"`: emit a generated SCSS partial (e.g. `src/styles/_spec-generated.scss`) containing `.sw-0 { --swatch: #331800; } …`, `@use` it from `index.scss`, and emit `span.sw-N` in `_generated.pug`. Keep `spec.pug`'s `.token-swatch span { background: var(--swatch); }`.
   - Verify: `(Select-String -Path dist/spec.html -Pattern 'style="' -AllMatches).Matches.Count` prints `0`; `npm run lint:html` exits 0; `npx stylelint "src/styles/**/*.scss"` exits 0.

5. **Fix the PowerShell-fragile `lint:pug` script.** pug-lint 2.7.0 does not expand globs.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 1 Step 1 (line 98)`
   - Change: `"lint:pug": "pug-lint \"src/pug/**/*.pug\""` → an explicit file list `"pug-lint src/pug/boilerplate.pug src/pug/showcase.pug src/pug/spec.pug src/pug/_generated.pug"` (or a Node glob wrapper).
   - Verify: `npm run lint:pug` exits 0 on PowerShell.

6. **Fix `showcase.pug`'s inline HTML.** Use Pug interpolation, not sibling spans (the `.o-code-block` line counter increments per `span`).
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 19 Step 1 (lines 1038–1039)`
   - Change: `span &lt;<span class="syntax-tag">section</span>&gt;` → `span &lt;#[span.syntax-tag section]&gt;`; same for the closing-tag line.
   - Verify: `npx pug-lint src/pug/showcase.pug` exits 0.

7. **Anchor the spec generator's scale filter and cover the missing tiers.** The current prefix regex swallows semantic roles and omits semantic/density tokens.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 17 Step 1 (line 913)`
   - Change: `tokens.filter((t) => /^--(text|space)-/.test(t.name))` → `tokens.filter((t) => /^--text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(t.name) || /^--space-\d+$/.test(t.name))`; add a third generated section listing the remaining semantic and density tokens (name + value).
   - Verify: after `node scripts/gen-spec.mjs`, `_generated.pug` contains `--text-primary` zero times in the scales section and contains `--accent` and `--control-height` at least once.

8. **Create the mandated branch before the first commit.**
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Global Constraints (line 19)`, `Task 1 (new Step 0)`
   - Change: add `git switch -c feat/20261108-pyrocarbon-v6-plan` before Task 1 Step 1.
   - Verify: `git branch --show-current` prints `feat/20261108-pyrocarbon-v6-plan` before the first commit.

9. **Unquote the attribute-selector grep.** Dart Sass serializes attribute selectors unquoted.
   - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
   - Section: `Task 4 Step 3 (line 270)`
   - Change: pattern `data-theme="light"|data-theme="dark"` → `data-theme=light|data-theme=dark`.
   - Verify: the command returns four lines (light selector, dark selector, two `--accent:` lines).

10. **Pin the zero-JS light default with a test.** Review Focus #1 is currently only structurally true.
    - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
    - Section: `Task 21 Step 2 (add test after line 1220)`
    - Change: add a `browser.newContext({ javaScriptEnabled: false })` test that loads `/boilerplate.html`, asserts `document.documentElement.dataset.theme` is undefined, and asserts `getComputedStyle(document.body).backgroundColor === 'rgb(236, 234, 233)'`.
    - Verify: `npm test` passes the new test.

11. **Correct the Tailwind track's self-containment claim and its vacuous verify.** The track references token properties it never loads.
    - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
    - Section: `Task 20 Step 1 comment (lines 1107–1109)`, `Task 20 Step 2 (lines 1114–1116)`, `Task 23 (line 1326)`
    - Change: replace the "already-conforming namespaces need no remap" comment with the truth — the track's `var(--…)` references resolve only when the token custom properties are loaded; consumers must load `dist/pyrocarbon.css` (or a tokens-only CSS) alongside; unmapped `--text-*`/`--font-*`/`--radius-*` names fall back to Tailwind defaults. Change Step 2 to compile a probe **with a consumer page using** `bg-surface-canvas` and `p-4` (unused `@theme` keys are tree-shaken), and assert `--spacing-4: var(--space-4)` and `.bg-surface-canvas` emit. Apply the same correction to the README.
    - Verify: the probe emits the expected mapping and utility lines; the README no longer claims self-containment.

12. **Add a contrast assertion; do not self-certify DoD 7.** The token values themselves are a design decision (Section 10).
    - File: `docs/plans/20261108-pyrocarbon-v6-plan.md`
    - Section: `Task 21 Step 2 (add test)`, `Task 24 Step 5 (line 1384)`
    - Change: add a Playwright test that computes WCAG ratios from computed styles for the text/canvas and brand pairs in both themes (primary, accent, nav brand, button label, syntax tag/comment, ghost hover), asserts ≥ 4.5 for normal text, and prints the ratios; Task 24 Step 5 must paste those numbers instead of self-certifying.
    - Verify: the test fails on the current tokens (measured: nav brand 2.49, link 4.34, syntax-tag 2.22) and passes after the Section 10 token changes.

---

## 5. Section 10 — Surfaced for a decision (not auto-apply eligible)

These fixes are valid but involve a design tradeoff, reviewer disagreement on confidence, or a scope decision. User decides.

1. **Contrast token changes.** **Resolved in pass 2.** Measured failures and candidate fixes: light `--text-accent` `#b34f00` → `#994700` (4.34 → 5.47:1); split `--text-on-brand` into a nav token on `--neutral-0` and a button token on `--accent` (nav 2.49 → 6.58:1; buttons 4.87 → 6.58:1) rather than retargeting one overloaded token; `--syntax-tag` `#b58900` → `#994700` (2.22 → 4.55:1); `--syntax-comment` `--neutral-4` → `--neutral-3` (4.24 → 5.3:1); dark `--selection-bg/fg` to `--orange-4`/`--neutral-0` (3.77 → 5.57:1). Also: fix `.btn--ghost:hover` (4.05:1) and **document** `.btn:disabled` opacity as WCAG-exempt.
2. **320px overflow and touch targets.** **Resolved in pass 2.** Add `.site-nav { flex-wrap: wrap; gap: var(--space-2); padding-inline: var(--space-2); }` in the `40em` query; promote nav toggles off `.btn--sm` (35.04px) to a size that meets the 44px default / 48px comfortable floor; change the touch test selector to `main .btn`. Report the overflow number for the wrap change alone (the height change increases nav min-content width).
3. **`.c-sidebar` layout.** **Resolved in pass 2.** Either add a grid rule and restructure `section#layout-doc` so the rail and content are siblings (B's measured fix), or correct the plan's prose to "single-column documentation layout". This is not a DoD 6 failure.
4. **Inert `@layer` statement.** **Resolved in pass 2.** Decide whether to wrap component rules in the declared layers (so Tailwind utilities can override them) or delete the `@layer tokens, reset, base, components, utilities;` statement. Related: decide whether `@tailwindcss/vite` stays in `vite.config.ts` when the main track never imports `tailwindcss`.
5. **DoD 5 scope.** **Resolved in pass 2.** Either expand the spec page to all Tier-1 component states across six combos (a v6.1-sized artifact) or explicitly re-scope DoD 5 in the plan text, as Task Right-Sizing already does for alerts/cards/tables.
6. **Spec-fidelity deviations.** **Resolved in pass 2.** `verify` includes Playwright while spec decision R says opt-in — split `verify`/`verify:full` or amend the spec. Parametrize the overflow test over `320/768/1440` (spec §12). Add a boilerplate-in-6-combos test (DoD 4). Acknowledge the spec-page-last ordering against §13.4.
7. **Stylelint contract.** **Resolved in pass 3 for the `font-family` guard**; the raw `em`/`rem` geometry policy is documented as intentional, and the spec page CSS now lives in the linted `spec.scss`.
8. **Density control semantics.** **Resolved in pass 3**: the cycler exposes its current value through the button label plus a polite live region; no `aria-pressed` on a 3-state control.
9. **Dev server and regeneration.** **Resolved in pass 2.** Document that `npm run dev` is CSS/JS-only and pages require `build` + `preview`, or add a dev middleware; note that `prebuild` does not run in dev so `_generated.pug` can go stale; note the committed-`dist/` diff noise.
10. **Dependencies and README.** **Resolved in pass 2.** Drop the unused `cross-env`; decide on `@tailwindcss/vite`; correct the README's "lint-enforced" case-sensitivity claim, add `npx playwright install chromium`, and link DESIGN.md as the persistent contract.

---

## 6. Apply log

- **Backups:**
  - `docs/plans/20261108-pyrocarbon-v6-plan.md.bak.20261112-230716`
  - `docs/plans/20261108-pyrocarbon-v6-plan.md.bak.20261112-233331-checkpoint2`
  - `docs/plans/20261108-pyrocarbon-v6-plan.md.bak.20261112-234304-checkpoint3`
- **Result:** pass 1 `11 applied / 1 surfaced / 0 failed`; pass 2 `all three approved bundles applied / 2 surfaced / 0 failed`; pass 3 `2 applied / 0 surfaced / 0 failed`.
- **Pass 1 (Section 9):** devDependency count; `--border-width-strong` rename across five consumers; `../tokens/tokens` import; html-validate `overrides` removal plus generated-SCSS swatches; explicit `lint:pug` file list; Pug interpolation in `showcase.pug`; anchored scale filter plus semantic/density section; feature-branch Step 0; unquoted attribute grep; zero-JS test; Tailwind dependency/probe correction.
- **Pass 2 (approved bundles):** contrast assertion plus the `--text-on-brand`/`--text-on-nav` split and measured token values (all 32 computed pairs pass AA/3:1); 40em nav wrap and full-size nav toggles; `.c-sidebar` grid + sticky rail and showcase `.doc-layout` restructure; every stylesheet wrapped in its declared `@layer`; `@tailwindcss/vite` + `cross-env` removed (10 pinned deps); DoD 5 re-scope; 320/768/1440 overflow tests and boilerplate six-combo test; `font-family` allowed-list; Task 5 density-invariance assertion; dev-server/`prebuild` caveats; README corrections; Task 24 cwd/pathspec/`$LASTEXITCODE` audit fixes; spec-ordering and em/rem policy notes.
- **Pass 3 (final surfaced items):** the density control now exposes its current value through the button's visible/accessible label plus a `[data-density-status]` polite live region (no `aria-pressed` on a 3-state cycler), with a Playwright assertion; the spec page's CSS moved to `src/styles/spec.scss` under `@layer components`, loaded via `index.scss`, with the inline `<style>` block removed.
- **Surfaced, not applied:** none.
- **Clean-tree exception:** the plan is untracked (`docs/plans/` is untracked), so `git status --short -- <plan>` was non-empty. The apply proceeded on the user's explicit "proceed to make fixes" instruction with the three backups above as rollback sources; under the skill's default clean-tree rule the apply would have aborted.
- **Read-back:** `var(--border-strong)` now appears only as the Task 4 colour (light/dark) and the `kbd` border colour; no width-position consumer remains. `@use './tokens/tokens'`, `style=${q(...)}`, the html-validate `overrides` key, and the raw `<span class="syntax-tag">` markup are all gone. Every fenced SCSS/CSS block in the plan is brace-balanced.
- **Execution evidence:** Sass 1.108.1 compiles the concatenated token tiers, all five component blocks, `base.scss`, and `spec.scss`; Pug 3.0.4 renders boilerplate/spec/showcase (spec has zero `<style>` and zero `style="`; boilerplate carries `data-density-status` and `Density: Default`); all four JS snippets pass `node --check`; a dry run of the rewritten `gen-spec.mjs` emits the scale, semantic/density, and swatch outputs; the contrast calculation reports `32/32 pass`.

## 7. Verification gate (this run)

- Reviewer A file exists with `**Target:**` and `**Source:** subagent`; model `z-ai/glm-5.3-flash`.
- Reviewer B file exists with `**Target:**` and `**Source:** subagent`; model `inclusionai/ling-3.1-flash`.
- Both cross-exam files exist with `**Target:**` and `**Source:** subagent`.
- This consolidated file has `**Apply mode:** apply` and Section 9.
- Plan file was edited in place; backup exists at the path above; read-back checks passed.
- No outstanding surfaced items; all three passes are applied and verified.
