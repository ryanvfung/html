# plan-review-A — docs/plans/20261108-pyrocarbon-v6-plan.md

**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent
**Model:** z-ai/glm-5.3-flash
**Reviewer:** A

## Reviewer stance and assumptions (I did not have the session context)

- I read the plan (1,385 lines) and the design spec it cites (`docs/designs/20261101-pyrocarbon-v6-design.md`, 333 lines), plus repo-level facts I could verify locally: branch is `master` and clean; root `.gitignore` covers `node_modules/` and `tmp/` (so `v6/node_modules` will not be committed and `v6/tmp/` from Task 6 is untracked — both fine); `dist/` is **not** gitignored (committed dist works); `5.1/`, `5.2/`, `5.3/` exist.
- I did **not** run `npm install`, Vite, Sass, or Playwright. Version-pin existence (vite 8.3.6, stylelint 18.0.0, @playwright/test 1.65.0, html-validate 11.19.0, tailwindcss 4.3.5, cross-env 10.1.0) is unverified by me — the plan only claims network access was verified, not the pins.
- Cascade/lint conclusions below are from CSS-spec reasoning and lint-config reading, not browser measurement. Anything I could not execute is tagged accordingly.

## Summary verdict

This is an unusually well-specified plan: per-task interfaces, runnable verification commands, review-focus edge cases, and explicit deferrals. But it was not dry-run. It contains at least one arithmetic error in a verify step, one token name collision that silently breaks a documented behavior (focus/error borders), one component that violates the lint contract the plan itself installs in Task 6, a Tailwind track whose core claim ("no remap needed") is wrong as written, and a Definition-of-Done item (AA contrast) with zero verification anywhere in 24 tasks. All are fixable in the plan text before implementation.

**Completeness: 7/10** — steps, interfaces, and verify commands are near-exhaustive, but DoD coverage has holes (contrast, boilerplate-in-6-combos), the spec page omits whole token tiers, and several verify steps assert wrong or too-weak expectations to catch the plan's own contract violations.

---

## Findings

### F1. HIGH — `--border-strong` is declared twice with incompatible types (width vs color); the width silently dies

- **Sections:** Task 3 Step 1 (lines ~200: `--border-strong: 0.125rem` as a Tier 1 structural constant), Task 4 Step 1 (line ~241: `--border-strong: var(--neutral-5)` as a Tier 2 border **color**).
- **Effect:** Both selectors are `:root`-specificity (0,1,0); Task 4's block comes later in source order, so `--border-strong` is *always* the color `var(--neutral-5)`. The Task 3 width value is unreachable. Consumers then disagree about which type they meant:
  - `base.scss` (Task 7), `button.scss` (Task 9), `forms.scss` (Task 10) use it as a **width**: `outline: var(--border-strong) solid var(--focus-ring)` and `border-width: var(--border-strong)` — substituting a color makes these declarations invalid at computed-value time; outline/border width falls back to `medium` (≈3px) instead of 0.125rem.
  - `code.scss` (Task 11, `kbd`) uses it as a **color**: `border: var(--border-hairline) solid var(--border-strong)` — works only because the color meaning won the cascade.
- **Root cause is inherited from the spec:** design §4 lists `--border-strong` under Tier 1 "structural constants" *and* under Tier 2 "borders" (`--border-default, --border-strong, --border-accent`). The plan faithfully reproduces a contradictory source document without noticing.
- **Suggested fix:** Rename the Tier 1 width to `--border-width-strong` (keep `--border-hairline`, which has no collision, or rename both to `--border-width-*` for symmetry) and update the outline/border-width consumers in Tasks 7/9/10. Keep the Tier 2 color name. Add a plan note that the spec's §4 contains the collision.

### F2. HIGH — Task 1 Step 4 expects `13` devDependencies; the JSON defines 12

- **Section:** Task 1 Step 4 (line ~123) vs Task 1 Step 1 (lines 102–107).
- Count: `@playwright/test, @tailwindcss/cli, @tailwindcss/vite, cross-env, html-validate, postcss-scss, pug, pug-lint, sass, stylelint, tailwindcss, vite` = **12**. The step as written fails a scaffold that matches the plan exactly — a false-failure gate on the very first task.
- **Suggested fix:** Change the expected value to `12` (or add the missing 13th dependency if one was intended — but see F11 on `cross-env` being unused).

### F3. HIGH — `showcase.pug` violates the plan's own pug-lint contract, and Task 19's verify can't see it

- **Sections:** Task 6 Step 2 (`disallowHtmlText: true`), Task 19 Step 1 (lines 1038–1039: `span &lt;<span class="syntax-tag">section</span>&gt;` — raw inline HTML in Pug text), Task 19 Step 3 (runs only build + section-count + `lint:html` — **no `pug-lint`**), Task 24 Step 2 (`npm run verify` → `lint:pug` over `src/pug/**/*.pug`).
- **Effect:** Task 19 "passes" its local checks; the failure surfaces ~5 tasks later at the Task 24 full gate, violating the plan's own right-sizing claim that each task is "independently verifiable and independently rejectable" (§ Task Right-Sizing).
- **Suggested fix:** Use Pug interpolation — `span &lt;#[span.syntax-tag section]&gt;` — and add `npx pug-lint src/pug/showcase.pug` to Task 19 Step 3. (Do not use sibling spans: `.o-code-block > code > span` counter-increments per span, so siblings would corrupt the line numbering that Task 11's CSS implements.)

### F4. HIGH — DoD item 7 (WCAG AA contrast, both themes) has no verification anywhere, and the light-theme accent likely fails it

- **Sections:** Task 24 Step 3 audits DoD 9/5/14/10 only; Task 21's tests never compute contrast; Task 22's DESIGN.md and Task 24 Step 5 *claim* "AA contrast" and "contrast checked" without evidence.
- **Specific risk (arithmetic, not measured):** light theme `--text-accent: #b34f00` (Task 4) is used for body-size links (`base.scss`, Task 7) and `.form-error` text at `--text-sm` (Task 10) against `--surface-canvas: var(--neutral-9)` = `#eceae9`. WCAG relative-luminance math gives ≈ **4.34:1 < 4.5:1** — an AA fail for normal text. (Buttons are fine: `--text-on-brand` on `--accent` ≈ 4.9:1; dark-theme accent on canvas ≈ 8.6:1.) My luminance arithmetic could be off by ±0.05, which is exactly why a *verification step*, not my estimate, should own this.
- **Suggested fix:** Add a contrast assertion to Task 21 (compute WCAG ratio from computed styles for the text/canvas pairs in both themes), and either darken `--text-accent`/`--accent` in the light block (e.g. toward `#a34700`/`#994700`, which computes ≈5.4:1) or document the exception. Do not let Task 24 Step 5 self-certify item 7 without a number.

### F5. HIGH — Task 20's Tailwind track is not self-contained, and its "no remap needed" comment is wrong

- **Sections:** Task 20 Step 1 comment (lines 1107–1109: "`--font-display|body|mono`, `--radius-sm|card|input`, `--text-*` come from `_tokens.scss` under the names Tailwind v4 already looks up"), Task 23 README Tailwind section ("Import `src/tokens/_tailwind-theme.css`, then use utilities…").
- **Effect:** `_tailwind-theme.css` never imports the token values — the tokens live in `_tokens.scss`, which the CSS track cannot `@import`. A consumer importing only the theme file gets: (a) `--color-*`/`--spacing-*` utilities resolving to `var(--surface-canvas)` etc. that are **undefined**; (b) `--text-sm` and friends resolving to **Tailwind's own default theme values** (0.875rem, not the fluid `clamp()`), because `@import "tailwindcss"` ships a default `--text-*` namespace; (c) `--font-display`/`--font-body` undefined (Tailwind's defaults are `--font-sans/serif/mono`). The "same token source, no drift" architecture claim (plan header, design §5) silently breaks on this track. Task 20's verify only checks the mapping lines exist in probe output; Task 24's DoD-10 check (`var\(--` count ≥ 14) is satisfied by the mapping lines themselves and proves nothing about resolution.
- **Suggested fix:** State the dependency explicitly: the Tailwind track requires the token custom properties to be loaded (e.g., consumer loads `dist/pyrocarbon.css`, or the build emits a tokens-only `dist/tokens.css` that `_tailwind-theme.css` documents as a required import), amend README accordingly, and change Task 20 Step 2 to compile a probe that *includes* the token definitions and asserts a utility resolves to a `var(--surface-canvas)`-rooted value. Fix the comment so it doesn't claim something false.

### F6. HIGH — `gen-spec.mjs` filter bug pollutes the scales section, and semantic tokens never appear on the spec page at all

- **Section:** Task 17 Step 1, `const scales = tokens.filter((t) => /^--(text|space)-/.test(t.name))` (line ~913).
- **Effect 1:** The regex prefix-matches every semantic `--text-*` token (`--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`, `--text-accent`, `--text-code`, `--text-on-brand`) into the "Type and space scales" list, mixed in with the type scale. Task 17 Step 2's verify (checks only `--space-16` and `--orange-5`) cannot catch this.
- **Effect 2:** Nothing else surfaces semantic tokens: swatches filter to `orange|neutral` only, scales to `text|space`. So `--accent*`, `--surface-*`, `--border-*`, `--shadow-*`, `--syntax-*`, `--selection-*`, `--focus-ring`, `--control-*`, `--pad-card`, `--gap-grid`, `--leading-*`, `--measure-body` appear in **no** generated section. Design §5 and DoD item 5 say spec.html "shows all tokens"; as planned it shows roughly half of them.
- **Suggested fix:** Anchor the scale filter to the actual type-scale names (e.g. `/^--text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/`), and add a third generated section for semantic + density tokens (name + current light-theme value is acceptable, or one row per theme). Update Task 17's verify to assert a semantic token (e.g. `--accent`) is present and `--text-primary` is *absent* from the scales section.

### F7. MEDIUM — 320px no-horizontal-scroll assertion (Task 21) plausibly fails on the planned boilerplate nav; no mobile-nav layout decision exists

- **Sections:** Review Focus #4 (line 33), Task 16 Step 1 (nav: brand link + `Menu` toggle + `Theme` button + `Density` button, all ≥44px min-height), Task 12 (`site-nav` is `display: flex` with `--space-4` gaps, no `flex-wrap`), Task 21 Step 2 (`scrollWidth <= clientWidth` at 320px).
- **Effect:** At 320px, min-content widths of the four items plus three 1rem gaps plus inline padding plausibly exceed 320px (rough estimate ≈375px with Segoe UI fallback metrics). Flex items don't shrink below min-content and text won't wrap by default → horizontal overflow → the flagship property test fails on a page that matches the plan exactly. This is a prediction, not a measurement (I ran no browser) — but the plan contains no mitigation (no wrap, no condensed mobile gaps, no brand collapse), so the risk is unhandled either way.
- **Suggested fix:** Decide the mobile nav now: e.g. `@media (max-width: 40em) { .site-nav { gap: var(--space-2); padding-inline: var(--space-2); flex-wrap: wrap; } }` or hide the brand text at ≤20em; add the 320px assertion *on boilerplate* to Task 16's own verify so the failure lands in the task that owns the markup.

### F8. MEDIUM — No task creates the branch the Global Constraints mandate

- **Sections:** Global Constraints (line 19: "branch `feat/20261108-pyrocarbon-v6-plan`"), Task 1 Step 5 (commits to whatever branch is current — locally verified as `master`).
- The branch name matches the repo convention (`<type>/YYYYMMDD-slug`, per `AGENTS.md` → agents-branch-naming), but nothing switches to it. Every task then commits to the wrong branch.
- **Suggested fix:** Add Task 1 Step 0: `git switch -c feat/20261108-pyrocarbon-v6-plan`.

### F9. MEDIUM — Verification scope silently narrowed vs the spec

- **Sections:** design §12 vs Task 21; design §13.4 vs Task 18.
- (a) Spec requires "no horizontal scrollbar at **320/768/1440px**"; the plan tests 320px only. (b) Spec's Playwright scope includes "expected elements visible"; no such assertion exists. (c) Spec §13 says the spec page should exist "before the second component" as the visual truth the agent iterates against; the plan builds it at Task 18, *after all five components* — the plan's Task Right-Sizing section reorders deliberately but never acknowledges this deviation from the spec's stated first principles. (d) DoD item 4 ("boilerplate renders correctly in 2 themes × 3 densities") is only weakly covered: theme and density toggles are tested independently on boilerplate; no test exercises boilerplate under all six combos the way spec.html does.
- **Suggested fix:** Parametrize the overflow test over `[320, 768, 1440]`; add one combo-loop test for boilerplate; add a one-line note in Task Right-Sizing explaining why spec-page-last was chosen despite §13.4 (and either accept the loss of "iterate against it" or move a minimal spec page earlier).

### F10. MEDIUM — Lint contract is weaker than both the spec and the plan's own claims

- **Sections:** Task 6 vs design §4/§9 and DoD 3.
- (a) Spec §4: "No `font-family` outside the token file. Lint-enforced." Task 6's stylelint config has **no** `font-family` restriction — nothing stops `font-family: 'Comic Sans'` in a component. (b) Spec §9 lists "undeclared custom properties" and "linear-gradient on text" as targets; both absent (the latter only partially via `background-clip: text`). (c) DoD 3 claims "no raw values in component CSS (stylelint passes)" — but the configured rules only ban **px** in spacing/font-size; the plan's own component snippets contain raw values that pass: `code.scss` `padding: 0.125em 0.25em`, `min-inline-size: 2.5em`; `forms.scss` `inline-size/block-size: 1.25rem`; `outline-offset: 0.125rem` in three files. Either these are acceptable (then DoD 3's wording overclaims) or they need tokens (then the snippets are wrong).
- **Suggested fix:** Add `declaration-property-value-allowed-list` pinning `font-family` to `var(--font-*)`; decide the raw-value question explicitly and either tokenize the em/rem geometry or soften DoD 3's wording to "no raw px"; note the two intentionally-dropped spec lint rules so the deviation is recorded.

### F11. MEDIUM — Dependency pins unverified; `cross-env` is dead weight

- **Sections:** Task 1 Steps 1/3; Global Constraints line 21.
- The plan verifies network access but not that each exact pin exists. Several are version-ambitious for the plan's date (`vite@8.3.6`, `stylelint@18.0.0`, `html-validate@11.19.0`, `@playwright/test@1.65.0`, `cross-env@10.1.0` — cross-env was on v7 for years). If any pin doesn't resolve, Task 1 Step 3 fails with no fallback guidance. Separately, `cross-env` violates the plan's own rule ("cross-env **only when an env var is set**") because no task ever sets one.
- **Suggested fix:** Add a Task 1 pre-step: `npm view <pkg>@<version> version` for each pin (or accept `^` ranges for the risky ones); drop `cross-env` (or drop the constraint line).

### F12. LOW/MEDIUM — `npm run dev` serves nothing useful

- **Sections:** Task 1 scripts; Task 15 config (JS entry only, no HTML input); Task 23 README ("`npm run dev` — Vite dev server").
- Pug pages render only via `postbuild` into `dist/`; the Vite dev server has no HTML entry, so visiting it 404s. A human following README gets a blank server. Also, `prebuild`/`postbuild` lifecycle means `dev` never runs `gen-spec.mjs`, so dev-time `_generated.pug` can go stale.
- **Suggested fix:** Document in README that `dev` is CSS/JS-only and pages require `npm run build` + `preview`; or add a root `index.html` entry; or render pages in dev via a tiny middleware.

### F13. LOW — Assorted smaller defects

- **Task 16 Interfaces** claim `build-pages.mjs` has "a `pages` array that Tasks 18–19 extend"; the snippet hardcodes `['boilerplate']` inline — cosmetic contract mismatch. Fix: name the variable `pages`.
- **Task 7 Step 3** chains two sass runs with `;` — the first command's exit code is swallowed; "Expected: exit 0" only proves the second. Fix: run separately or use `&&` semantics (`if ($?)` in PowerShell).
- **Task 6 Step 3** deletes the fixture file but leaves `v6/tmp/` behind (harmless — root `.gitignore` covers `tmp/` — but the step should remove the directory for cleanliness).
- **Task 4** adds `--text-on-brand` and `--surface-brand`, which are **not** in the spec §4 Tier 2 list (undocumented drift; also spec §4 omits `--text-tertiary`'s consumer). Fine, but note it in DESIGN.md's token philosophy or the spec drift goes unrecorded.
- **`--elevation-strategy`** (Task 4) and **`--surface-overlay`** are defined but consumed by nothing in Tier 1 (no modal/dialog). `--elevation-strategy` in both themes is the constant `shadow` — a switch with one position. Document as reserved (design defers dialogs) or cut from v6.0.
- **Task 23 README** claims "Imports must match file case exactly (lint-enforced)" (spec §8) but no configured lint enforces case sensitivity — overclaim; and README omits the spec §6.2 requirement to link DESIGN.md as the persistent contract.
- **Task 21** `reuseExistingServer: true` can serve a stale `dist/` if a previous preview is left running — prefer `false` in a plan that commits dist.
- **boilerplate.pug** hardcodes `aria-pressed="false"` on the theme button; correct pre-JS state is unknowable (OS-dark users get a wrong state until hydration). Minor; consider `aria-pressed` managed purely by JS plus `hidden`-until-js, or accept and document.

### F14. Security / performance

- No concerns of substance. JS surface is small, uses no `innerHTML`, wraps `localStorage` in `try/catch` (Task 14 matches Review Focus #5), and the generated Pug escapes values via `=` output. Performance: the Tailwind probe compiles the full default framework once per Task 20 run — negligible. Committed `dist/` will create noisy diffs on every regeneration (Task 24) — accepted by design, worth one README sentence. The inline `<style>` on spec.html is exempted from `no-inline-style` — scope the exemption to exactly `dist/spec.html` (already done, good).

---

## Score

**Completeness: 7/10** — Excellent per-step specificity and genuinely good edge-case review-focus items, undercut by unverified arithmetic (F2), an inherited-but-undetected token collision (F1), DoD items with no verifying step (F4, F6, F9), and a Tailwind track whose loadability is unaddressed (F5).

## Consistency: 6/10 — generally faithful to the spec's architecture, but reproduces the spec's `--border-strong` contradiction (F1), deviates from spec §13 ordering and §12 verification scope without acknowledgment (F9), and installs a lint contract its own snippets then violate (F3, F10).

## Feasibility: 8/10 — the build pipeline (prebuild→vite→postbuild), layered token cascade, and toggle contracts are sound; main feasibility risks are the 320px nav geometry (F7) and the Tailwind track's missing token source (F5).

## Testability: 6/10 — nearly every task ships a runnable check (exemplary), but several checks assert the wrong thing or too little: F2 (wrong count), F3 (wrong tool at the wrong task), F4/F6/F9 (missing checks), Task 24 Step 5 self-certification of contrast.

---

## Section 9 — High-confidence fixes (auto-apply eligible)

Each entry: **File** = `docs/plans/20261108-pyrocarbon-v6-plan.md` (plan text; all changes are plan edits, not implementation).

1. **CONFIDENCE: HIGH**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 1, Step 4 (line ~123)
   - **Change:** Change expected output `13` → `12` (the JSON in Step 1 defines exactly 12 devDependencies).
   - **Verify:** `node -e "console.log(Object.keys(require('./package.json').devDependencies).length)"` prints `12` on a scaffold matching Task 1 Step 1.

2. **CONFIDENCE: HIGH**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 3 (declaration + Interfaces), Tasks 7/9/10 (consumers)
   - **Change:** Rename the Tier 1 width `--border-strong: 0.125rem` to `--border-width-strong` (update Task 3 Interfaces list, and the `outline:` uses in `base.scss`, `button.scss`, `forms.scss` snippets; Task 11's `kbd` keeps the Tier 2 color). Leave Task 4's `--border-strong: var(--neutral-5)` as is.
   - **Verify:** After Task 10, grep `src/styles` for `var(--border-strong)` used in a width/border-width position → 0 matches; in a browser, `.btn:focus-visible` computed `outline-width` is `2px` (0.125rem), not `medium`.

3. **CONFIDENCE: HIGH**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 19, Step 1 (lines 1038–1039) and Step 3
   - **Change:** Replace the raw inline HTML with Pug interpolation: `span &lt;#[span.syntax-tag section]&gt;` and `span &lt;/#[span.syntax-tag section]&gt;`; add `npx pug-lint src/pug/showcase.pug` to Task 19 Step 3. Do not use sibling spans (breaks `.o-code-block` line counters).
   - **Verify:** `npx pug-lint src/pug/showcase.pug` exits 0; Task 24's full-gate `lint:pug` passes without new findings.

4. **CONFIDENCE: HIGH**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 17, Step 1
   - **Change:** Anchor the scale filter: `const scales = tokens.filter((t) => /^--text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(t.name) || /^--space-\d+$/.test(t.name));` and add a third generated section (name + value rows) for the remaining semantic and density tokens so DoD 5 ("shows all tokens") is attainable.
   - **Verify:** After `node scripts/gen-spec.mjs`, `_generated.pug` contains `--text-primary` zero times and contains `--accent` and `--control-height` at least once.

5. **CONFIDENCE: HIGH**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 1 (new Step 0) — Global Constraints compliance
   - **Change:** Add `git switch -c feat/20261108-pyrocarbon-v6-plan` before Task 1 Step 1 (branch currently `master`).
   - **Verify:** `git branch --show-current` prints `feat/20261108-pyrocarbon-v6-plan` before the first commit.

6. **CONFIDENCE: HIGH** (gap is certain; exact remedy needs a decision)
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 20, Step 1 comment; Task 23 README Tailwind section
   - **Change:** Correct the false comment: the track's `var(--…)` references resolve only when the token custom properties are also loaded. State the requirement (consumer loads `dist/pyrocarbon.css` alongside, or build emits a tokens-only CSS that the track documents as a required import) in Task 20 and in the README "Tailwind v4 use" section; note that unmapped `--text-*`/`--font-*` names otherwise fall back to Tailwind defaults.
   - **Verify:** A consumer page loading the theme track without the token CSS demonstrably resolves `bg-surface-canvas` to nothing (repro note added), and with the token CSS resolves to `var(--surface-canvas)`-rooted color.

7. **CONFIDENCE: MEDIUM** (value change is a design decision; the missing check is certain)
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 4, Step 1; Task 21, Step 2; Task 24, Step 5
   - **Change:** Add a Playwright/unit contrast assertion computing the WCAG ratio for (`--text-primary`, `--text-accent` on `--surface-canvas`) in both themes; darken light `--text-accent`/`--accent` (candidate `#a34700`, ≈5.4:1) if the assertion fails. Do not let Task 24 Step 5 self-certify DoD 7 without this number.
   - **Verify:** Contrast test passes in both themes; `--text-accent` on `--neutral-9` computes ≥ 4.5:1.

8. **CONFIDENCE: MEDIUM**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 21, Step 2 (overflow test); Task 12/16 (nav)
   - **Change:** Parametrize the no-horizontal-scroll test over `[320, 768, 1440]` (spec §12) and add a mobile-nav mitigation to Task 12 (e.g. condensed gaps/`flex-wrap` under `40em`) so the 320px assertion is designed-for rather than hoped-for.
   - **Verify:** `npm test` green at all three widths on `/boilerplate.html`.

9. **CONFIDENCE: MEDIUM**
   - **File:** docs/plans/20261108-pyrocarbon-v6-plan.md
   - **Section:** Task 6, Step 1; Task 23 README
   - **Change:** Add `declaration-property-value-allowed-list` pinning `font-family` to `/^var\(--font-/` (spec §4's "no font-family outside token file, lint-enforced"); either drop the unused `cross-env` dependency or add the task that sets an env var; reword README's "lint-enforced" case-sensitivity claim or add enforcement.
   - **Verify:** A fixture with `font-family: Arial` fails `npm run lint:css`; `npm run lint` green on the plan's own snippets.
