# plan-review-B — docs/plans/20261108-pyrocarbon-v6-plan.md

**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent
**Model:** inclusionai/ling-3.1-flash
**Reviewer:** B

## 0. Reviewer stance, assumptions, and verification method

I had no session context. Assumptions I made (flagging per instructions):

- The design spec (`docs/designs/20261101-pyrocarbon-v6-design.md`) is the authority the plan must satisfy; I read it in full and checked the plan against its §3 locked decisions, §4 token rules, §5 output contract, §9 lint targets, §11 a11y scope, §12 verification/DoD, §13 first principles.
- Line numbers below refer to the plan file as read (1,385 lines).
- The npm registry in this timeline serves the exact pins (I verified all 12 pins exist: vite 8.3.6, stylelint 18.0.0, tailwindcss/@tailwindcss/* 4.3.5, html-validate 11.19.0, @playwright/test 1.65.0, pug 3.0.4, pug-lint 2.7.0, sass 1.108.1, postcss-scss 4.0.9, cross-env 10.1.0).
- **I dry-ran the plan.** I built the plan's exact file set (all 24 tasks' code, verbatim) in a throwaway sandbox under the session scratchpad (`v6sim/`), installed the pinned deps, and executed the plan's own verify commands, its full `npm run build`, its lint stack, its Playwright suite, plus ~10 extra browser measurements the plan never makes. The repo itself was not modified (reads and read-only git commands only). Where I applied a candidate fix in the sandbox to test it, I say so explicitly ("measured post-fix").
- I did not execute the plan's git/commit steps (sandbox is not the repo), did not run `npm run dev`, and did not run the Task 22/23 doc greps (trivially passing).

**What the dry-run proved green as written:** Sass partial compilation (Tasks 2–5), stylelint contract + failing-fixture proof (Task 6), all component SCSS lint-clean, `node --check` on the ESM JS (Task 14), Vite build with stable unhashed artifact names (Task 15), prebuild/postbuild lifecycle ordering, Pug rendering of all three pages with correct attribute counts (`data-theme=` ×6, `<section` ×3, `field-light-compact` present), gen-spec comma/`clamp()`/`rgba()` capture (Task 17), localStorage persistence round-trip, throwing-storage toggle behavior, spec-combo color isolation, zero-JS light default (structurally), `prefers-color-scheme: dark` application, mobile nav toggle + `aria-expanded`, and `Select-String` audits for bootstrap/jquery/tether (no matches — note Select-String is a cmdlet and does not set `$LASTEXITCODE`, so the plan's exit-code-based expectations on that command are meaningless; use `-Quiet`).

**What the dry-run proved red as written:** the full `npm run verify` gate fails at three of four stages, and 4 of the plan's own 12 Playwright tests fail. Details in the findings. With the Section 9 fixes applied, the same gate goes fully green (22/22 including my measurement tests).

## Score

**Completeness: 5/10** — The per-task structure, interfaces, and runnable verify commands are exemplary, but the plan as written cannot complete its own gate (broken `@use` path blocks the build; two lint configs crash; 4/12 Playwright tests red; Tailwind track non-functional), and DoD items 4, 5, 7, 8 have no verifying step — several of those gaps are measured, not predicted. (With Section 9 applied I would rate it 8/10.)

## Findings

Confidence tags: HIGH = verified by execution or arithmetic on measured values; MEDIUM = strong structural evidence, not executed; LOW = judgment/consistency note.

### 1. Completeness — gaps, edge cases, undefined behaviors

**B1 [HIGH] — Task 12 (lines 628–643) never styles `.c-sidebar`; Task 19 (line 1032) consumes it.** File Structure (line 55) promises sidebar styling; only `__title`/`__nav` children exist. Measured on the built showcase: `nav.c-sidebar` computes `display:block; position:static; width:1280px` (= full main width) — the "two-column reading layout with a sticky contents rail" (Task 19 Interfaces, line 1003) does not exist; DoD 6 is unmet. *Fix: add a `.c-sidebar` grid rule (e.g. `minmax(0,14rem) minmax(0,1fr)` ≥40em, sticky `__nav` rail) and make the showcase section the grid container with rail and content as siblings (needs a markup tweak — see Section 9 note).*

**B2 [HIGH] — DoD 5 / spec §5 "every token and every component state in all 6 combos" is not delivered and not audited.** Measured: `_generated.pug` contains 23 swatches + 31 rows; the scales filter `/^--(text|space)-/` (Task 17, line 913) leaks all 7 semantic `--text-*` tokens into the type-scale section (measured: `--text-primary`…`--text-on-brand` appear as "scale" rows) while ~60 tokens (`--surface-*`, `--border-*`, `--accent*`, `--shadow-*`, `--syntax-*`, all 8 density aliases) appear on no section. The 6 combos render only 2 button variants, 1 label+input, 1 link, 1 inline code — no select/textarea/checkbox/file/error state, no ghost/disabled buttons, no `pre`/`kbd`/`o-code-block`/`o-cli-block`/`o-cmd-block`, no nav/sidebar/footer. No task audits DoD 5 beyond a `data-theme=` count. *Fix: anchor the scale regex, add a semantic+density section, extend combo markup to the Tier-1 set (or explicitly re-scope DoD 5 in the plan).*

**B3 [HIGH] — DoD 7 (AA contrast, both themes) has no verifying step, and measured values fail.** Task 24 Step 5 (line 1384) self-certifies "contrast checked" with no number. Measured (WCAG math + in-browser computed colors): light nav brand text `--text-on-brand` on `--surface-brand` = **2.49:1** (FAIL; the nav bar, not the button — buttons pass at 4.87 because `--accent` is #b34f00), light links/form-error `--text-accent` #b34f00 on canvas = **4.34:1** (FAIL), light inline-code `--text-code` = 4.46:1 (FAIL), light `--syntax-tag` #b58900 on sunken = **2.22:1** (FAIL — the spec's §10 "#b58900 fix" merely tokenized the failing value), light `--syntax-comment` = 4.24:1 (FAIL), dark selection = 3.77:1 (FAIL). Task 22's DESIGN.md (line 1278) would ship a false "AA contrast" constitution claim. *Fix: add a Playwright contrast assertion for the key pairs in both themes, and adjust the measured-failing token values (candidates in Section 9 #14).*

**B4 [HIGH] — No step pins the zero-JS light default (Review Focus #1, line 30).** Task 4 "pins" it by compiling and grepping selectors (line 270); every Playwright test loads JS. Measured: the promise is structurally true (no-JS context → body bg `rgb(236,234,233)`, no attributes) — but nothing in 24 tasks would catch a regression. *Fix: add a `javaScriptEnabled:false` test (Section 9 #12).*

**B5 [MEDIUM] — Density toggle has no state affordance.** Task 14 sets `aria-pressed` only for theme buttons (line 724); density buttons get none (measured: `aria-pressed: null`), the label never changes, and a 3-state cycle has no visible current value. Undefined behavior for users; unpinned by tests. *Fix: set `aria-pressed` per option or expose current density in the label; add an assertion.*

**B6 [MEDIUM] — Mobile nav has no close semantics and no layout mitigation.** `[data-open]` menu never closes on link click or Escape (Task 14, lines 733–741); masked on navigation-reload but undefined for same-page anchors. And the 40em media query (Task 12, lines 639–643) hides the list but never wraps/condenses the nav itself — the cause of B9's 320px failure. *Fix: Escape/close-on-outside-click + the wrap rules in Section 9 #8.*

**B7 [MEDIUM] — `npm run dev` serves nothing useful** (JS-only Rollup input, Task 15 line 780; pages render only via postbuild into `dist/`). README (Task 23, line 1315) advertises `npm run dev` without this caveat; `prebuild` never runs in dev so `_generated.pug` can go stale. *Fix: one README line + dev caveat.*

**B8 [MEDIUM] — Showcase form submit is an undefined accident** (Task 19, lines 1042–1050): no `action`/`novalidate`, submit button, JS ceiling forbids form JS (spec §3-H) → native validation then GET navigation with query string. *Fix: `novalidate` + static error demo, or document the native behavior.*

**B9 [LOW] — Tier-1 components ship with zero page coverage:** `.btn--ghost`, `.btn:disabled`, `select`/`textarea`/file styling, `o-cli-block`/`o-cmd-block`, `--surface-overlay`, `--elevation-strategy`, `--shadow-card`, `--text-inverse` are defined/styled but rendered on no page and asserted nowhere. *Fix: cover in spec page combos (B2) or mark reserved in DESIGN.md.*

**B10 [LOW] — Plan never restates the 14-item DoD it audits** (Task 24 references items by number; the list lives only in the external spec §12), and never mentions the repo closing sequence (todo A→B, plan archive to `docs/archive/plans/`, review-gate entry per `agents-commit-conventions.md`). *Fix: DoD checklist table in the plan header; one closing-sequence note.*

### 2. Feasibility — does the approach work? (all measured in sandbox)

**B11 [HIGH] — Task 8 Step 1 (line 446): `@use './tokens/tokens'` is a broken path.** `index.scss` lives in `src/styles/`; tokens live in `src/tokens/`. Measured: `npx sass src/styles/index.scss` → `Error: Can't find stylesheet to import` → Task 8 verify fails, Task 15 build fails, the whole pipeline is blocked until an implementer debugs it. *Fix: `'../tokens/tokens'`. Post-fix the Task 8 order assertion (layer statement → tokens → reset) passes.*

**B12 [HIGH] — Task 6 Step 2 (line 357): `.htmlvalidate.json` is invalid for html-validate 11.19.0.** Measured: `SchemaValidationError: Property overrides is not expected to be here` (v11 schema is `additionalProperties:false`; no `overrides` key) → `lint:html` exits 1 on every run → `lint` and `verify` always red. The `overrides` entry was written to exempt `dist/spec.html`'s 23 generated inline `style="--swatch:…"` attributes — a mechanism that does not exist in v11. *Fix: delete `overrides`; eliminate the inline styles at the source (class-based swatches, Section 9 #3).*

**B13 [HIGH] — Task 1 `lint:pug` script (line 98) crashes on PowerShell.** Measured: `pug-lint "src/pug/**/*.pug"` → `Error: Path src/pug/**/*.pug was not found` (pug-lint 2.7.0 does not expand globs internally; quoted globs are not expanded by PowerShell for native commands). This breaks `lint`/`verify` on the plan's own Windows-first constraint, and it silently lints nothing. Separately measured: `pug-lint src/pug/showcase.pug` exits 2 — "HTML text must not be used" at lines 30–31 (raw `<span class="syntax-tag">` in Pug text) — so even with a working glob, Task 19's page violates the Task 6 contract; Task 19's own verify (line 1066) runs no pug-lint, so the failure surfaces only at the Task 24 gate. *Fix: explicit file list in the script; Pug interpolation for the syntax spans (Section 9 #4, #5).*

**B14 [HIGH] — 4 of the plan's own 12 Playwright tests fail on the plan's exact code** (Task 21 vs Tasks 3/4/12/16):
- `no horizontal scroll at 320px` fails on **boilerplate and showcase**: measured overflow **18px** (nav `scrollWidth` 338 vs 320) — Review Focus #4's flagship promise is broken by the plan's own nav (no wrap, `--space-4` gaps, four items).
- `touch targets meet density floors` fails: measured `.btn` min-height **35.04px** — the test's `querySelector('.btn')` resolves to the nav's `btn--sm` Theme toggle (first `.btn` in DOM), and `.btn--sm` = `--control-height − --space-2` = 36px class — below the spec §11 / DoD 8 floor of 44px that the persistent nav controls themselves violate (Task 16 line 833, Task 19 line 1025).
- `focus-visible outline present` fails: measured computed `outline-style: none` after keyboard Tab — because Task 3's `--border-strong: 0.125rem` (width) is shadowed by Task 4's `--border-strong: var(--neutral-5)` (color) (lines 200 vs 241; later equal-specificity `:root` block wins; runtime measured `--border-strong` = `#8a7f75`). Every `outline: var(--border-strong) solid …` (base line 415, button line 491, forms line 539) is invalid CSS and **drops entirely** — no focus ring; `.form-control[aria-invalid] border-width` (line 540) and `.c-sidebar__nav a border-inline-start` (line 636) also break; only `kbd`'s border-color (line 584) accidentally works. *Fix: rename the width token to `--border-width-strong` (5 consumer files), add mobile nav wrap, use full-size nav toggles — all three verified green post-fix (focus ring computes `solid 2px rgb(179,79,0)`, overflow 0, `.btn` 44px).*

**B15 [HIGH] — Task 20's Tailwind track does not work as specified, and its own verify step fails.** Measured: (a) Task 20 Step 2's grep patterns match **zero** lines of the probe output — Tailwind v4 tree-shakes `@theme` keys that no scanned utility uses, and no page uses Tailwind utilities, so nothing emits; (b) the track never imports the token values (it references `var(--surface-canvas)` etc. defined only in `_tokens.scss`), so used alone it computes to **nothing**: measured `bg-surface-canvas` → `rgba(0,0,0,0)`, `p-4` → `0px` (via `--spacing-4`→`var(--space-4)` undefined), `text-sm` → **Tailwind's default 14px** (the track emits `--text-sm: 0.875rem` — the fluid clamp never arrives), and `font-display`/`rounded-card` utilities **do not exist** (no `--font-display`/`--radius-card` keys) — the comment at lines 1107–1109 ("already-conforming namespaces need no remap") is factually wrong on all three namespaces; (c) when both tracks load, `pyrocarbon.css` is entirely **unlayered** (measured: exactly one `@layer` occurrence in dist — the bare order statement; no rule is ever wrapped in a layer, despite the File Structure's "layer order is declared" claim, line 57), and unlayered author CSS beats Tailwind's layered utilities: measured `.btn.p-4` padding = **7px 12px** (component wins; the utility is dead). This contradicts spec §3-A/§5 ("same token source… thin integration layer"). *Fix: emit/import a token CSS for the track (or document the hard dependency on `dist/pyrocarbon.css`), use `@theme inline`, correct the comment/README, wrap pyrocarbon rules in the declared `@layer` (or delete the statement), and make Step 2 compile a probe with real utility usage (Section 9 #11).*

**B16 [MEDIUM] — Task 24 Step 3's audit commands are cwd-inconsistent and partly vacuous.** Measured: `git status --short 5.2` run from a subdirectory exits 0 with no output (detects nothing) while sibling commands in the same step use `v6/`-relative paths (`src/tokens/…`) — the step cannot run from one cwd. The "expected: only regenerated dist… or clean" is false in the current tree (measured: `D STANDARDS_VERSION`, untracked `docs/plans/`, `docs/reviews/`, `.review-tmp/`; the plan file itself is untracked). The DoD-10 audit (`var(--` count ≥ 14) passes exactly at the boundary (measured: 14) and proves nothing about resolution. *Fix: pin cwd per command; use `git diff --name-only master...HEAD -- 5.2`; assert utility resolution instead of var-count.*

**B17 [MEDIUM] — Task 4 Step 3 (line 270) grep can never match.** Measured: Dart Sass serializes attribute selectors unquoted (`[data-theme=light]`), so the pattern `data-theme="light"` finds nothing; the step's "Expected: light selector, dark selector" silently produces only the two `--accent:` lines. *Fix: drop the quotes in the pattern.*

**B18 [MEDIUM] — Task 1 Step 4 (line 123) expects 13 devDependencies; the JSON defines 12.** Measured: `node -e` prints `12`. The scaffold's own verify step fails as written. *Fix: expect 12.*

**B19 [MEDIUM] — Task 18's spec page styles live in a hand-written `<style>` block** (lines 955–960) — outside the stylelint token contract (no rule covers Pug style blocks; `no-style-tag` is not enabled), and the generated swatches' 23 inline `style` attributes are what forced the impossible html-validate override (B12). *Fix: move page CSS into `src/styles/spec.scss` under the lint contract; class-based swatches (Section 9 #3).*

### 3. Consistency — vs the spec and repo conventions

**B20 [HIGH] — Stylelint contract is weaker than the spec's own §4/§9 mandates** (Task 6 vs design §4 "No font-family outside the token file. Lint-enforced", §9 "linear-gradient on text", "undeclared custom properties", "`@layer` discipline"): none of these rules exist in `.stylelintrc.mjs` (lines 333–351). Measured: stylelint passes the plan's own component SCSS (exit 0) — including raw `em` geometry (`0.125em`, `2.5em`, `1.25rem` checkbox) that DoD 3's wording ("no raw values in component CSS") arguably covers. Also the installed `--border-strong` collision (B14) is a spec-inherited contradiction (spec §4 lists `--border-strong` as both a Tier-1 structural constant and a Tier-2 border color) that the plan reproduces without noticing. *Fix: add `declaration-property-value-allowed-list` pinning `font-family` to `var(--font-*)`; decide the em/rem question explicitly; rename the width token (Section 9 #7); record the dropped spec lint rules.*

**B21 [MEDIUM] — Spec decision R ("Playwright opt-in") vs the plan's `verify` script** (line 101): `verify` = build + lint + **test**, and Task 24 makes it the gate — Playwright is mandatory in the plan, optional in the spec. Also spec §13.4 wants the spec page to exist "before the second component"; the plan ships it at Task 18 and never acknowledges the deviation (its Task Right-Sizing section justifies task order generally but not this specific reorder). *Fix: align `verify` with the spec (split `verify` from `verify:full`) or amend the spec; one sentence in Task Right-Sizing.*

**B22 [MEDIUM] — Branch never created.** Global Constraints (line 19) mandate `feat/20261108-pyrocarbon-v6-plan`; measured repo state: only `master` exists; no task runs `git switch -c`. Every one of the 24 commits lands on `master`. (Repo conventions per `agents-branch-naming.md` otherwise match the name format.) *Fix: Task 1 Step 0.*

**B23 [LOW] — Dead dependency violates the plan's own constraint:** `cross-env` (line 105) is used by no script (Global Constraints line 21 permits it only when an env var is set; line 22 forbids unjustified extras). `@tailwindcss/vite` is also idle in the measured build (the plugin only processes CSS importing `tailwindcss`; the main track never does) — keep it only if the track is meant to move inside the Vite build, which the plan never does. *Fix: drop `cross-env`; decide the plugin.*

**B24 [LOW] — README overclaims** (Task 23, line 1320): "Imports must match file case exactly (lint-enforced)" — no configured lint enforces case sensitivity (Windows hazard the spec §8 calls out). README also omits the spec §6.2 requirement to link DESIGN.md as the persistent contract, and omits `npx playwright install chromium` (Task 21 Step 3 is manual; a fresh clone's `npm test` fails without it). *Fix: correct the sentence; add the install note.*

### 4. Testability — can each step be verified?

**B25 [HIGH] — The plan's verify steps are mostly runnable (exemplary), but five of them assert the wrong thing or nothing:**
- Task 4 Step 3: quoted-attribute pattern never matches (B17).
- Task 1 Step 4: wrong count (B18).
- Task 5 Step 2 (line 309) vs Review Focus #3 (line 32): promises to pin `--surface-canvas` unchanged across densities but only greps `--orange-5` (count 1) and `control-height` (3 matches). The color-orthogonality half is unpinned. *Fix: add the `--surface-canvas` count assertion (Section 9 #13).*
- Task 17 Step 2 (line 923): the "rgba assertion" is the generator's own stdout echoing its own parse — circular; and the `clamp()` check greps the generated file but never the rendered page.
- Task 24 Step 3: vacuous git pathspec + `$LASTEXITCODE` misuse on cmdlet output (B16).

**B26 [MEDIUM] — Test coverage gaps vs the plan's own Review Focus:** no test for the density button's pressed state (B5), nav toggle behavior (measured working, but unpinned), 768/1440 widths (spec §12 requires 320/768/1440; only 320 is tested), "expected elements visible" (spec §12), persistence round-trip (measured working, unpinned), `prefers-color-scheme` initial application (measured working, unpinned), and the no-JS default (B4). The 6-combo leak test pins only `.combo` colors, not the interaction of a global toggle with the combos (and spec.html has no toggles — measured: `[data-theme-toggle]` absent from spec.html by design, so a global-flip leak test is impossible as specified). *Fix: parametrize widths; add the missing assertions (Section 9 #12, #18).*

**B27 [MEDIUM] — Task 21's `touch targets` test selector `.btn` is order-dependent:** it measures the first `.btn` in the DOM (the nav toggle), not a main-content button — the failure mode that produced the 35.04px measurement (B14). Even post-fix, assert on an explicit main-content selector. *Fix: `main .btn`.*

### 5. Risks — what could go wrong, specifically

**B28 [HIGH] — The single highest-risk sequence is Tasks 6→16→24:** the lint stack is installed first (Task 6) and its html-validate config crashes on arrival (B12); the first page (Task 16) then cannot pass its own Step 3 `npm run lint:html`; the failure re-surfaces at the Task 24 gate after 8 more tasks of unlinted HTML. An implementer following the plan verbatim hits a hard stop at Task 16 Step 3 with no diagnostic path in the plan. *Fix: Section 9 #3.*

**B29 [MEDIUM] — Committed `dist/` + `emptyOutDir` + `prebuild`/`postbuild` ordering is sound (measured), but `vite preview` has no `strictPort`** (Task 1 line 95) and Playwright uses `reuseExistingServer: true` (Task 21 line 1144): a stale preview on 4173 serves the previous build and the suite passes against old artifacts silently. *Fix: `strictPort: true`; `reuseExistingServer: !process.env.CI`.*

**B30 [MEDIUM] — Regeneration noise and the shadow-sync hook:** `dist/` + `_generated.pug` are committed and regenerated (Task 24) — noisy diffs by design (accept, but README should say so). The repo's pre-commit hook runs a shadow-drift audit on `.root/` (verified: current tree has no blocking drift; the `.opencode/opencode.json` exclusion covers the only differing file) and post-commit auto-pushes with `-u` — 24 task commits will attempt 24 pushes; on a fresh branch the first push sets upstream, subsequent ones are fast. Not blocked, but the plan never mentions hooks, and the implement skill's worktree flow must satisfy the propose-guard mutation gate (plan is silent on both). *Fix: one "repo hooks" note in Global Constraints.*

**B31 [LOW] — Stale-tree assumption.** Plan Assumptions (line 11) claim a clean tree at authoring; measured now: `D STANDARDS_VERSION` (uncommitted), `docs/plans/` and `docs/reviews/` untracked (the plan file itself included), `.review-tmp/` untracked. Task 24's "git status clean" expectation (line 1373) is unachievable regardless of v6 work. *Fix: baseline the audit against the branch point (B16).*

### 6. Security / performance

**B32 [LOW] — No material security concerns.** Runtime JS is ~40 lines, no `innerHTML`, no `eval`, no network calls; `localStorage` access is try/catch-guarded (measured: toggles work with throwing storage); generated Pug escapes values via `=` output; `pug.renderFile` consumes no user input; namespaced storage keys (`pc-theme`/`pc-density`). The only note: `dist/` is committed and `emptyOutDir:true` wipes it on every build — a concurrent editor with dist open loses files (accepted by design). Performance: measured dist CSS 11.35 kB (3.13 kB gzip), JS 1.09 kB; fluid `clamp()` scales and one shadow language are cheap; the 6-combo spec page measured no overflow at 320px and no console errors. The Tailwind probe (Task 20) compiles the full default framework once per run — negligible.

---

## Section 9 — High-confidence fixes (auto-apply eligible)

Each entry was applied in the sandbox dry-run and re-verified by execution, unless noted. File for all entries: `docs/plans/20261108-pyrocarbon-v6-plan.md` (plan-text edits only).

1. **CONFIDENCE: HIGH**
   - **File/Section:** Task 8, Step 1 (line 446)
   - **Change:** `@use './tokens/tokens';` → `@use '../tokens/tokens';`
   - **Verify:** Measured pre-fix: `npx sass --no-source-map src/styles/index.scss` → `Can't find stylesheet to import`. Post-fix: exits 0; `npm run build` emits `dist/pyrocarbon.css` (11.35 kB) + `dist/pyrocarbon.js`; Task 8's three-match order assertion holds.

2. **CONFIDENCE: HIGH**
   - **File/Section:** Task 1, Step 4 (line 123)
   - **Change:** Expected `13` → `12` (the Step 1 JSON defines exactly 12 devDependencies).
   - **Verify:** Measured: `node -e "…devDependencies).length"` prints `12`.

3. **CONFIDENCE: HIGH**
   - **File/Section:** Task 6, Step 2 (line 357) and Task 17, Step 1 (lines 909–914)
   - **Change:** (a) Delete the `"overrides"` array from `.htmlvalidate.json` (html-validate 11 schema rejects it — measured `SchemaValidationError`). (b) In `gen-spec.mjs`, stop emitting inline `style="--swatch:…"`: emit a `style.` block with per-index classes (`.sw-0 { --swatch: #331800; } …`) and `span.sw-N` in each swatch row; `spec.pug`'s existing `.token-swatch span { background: var(--swatch); }` consumes it unchanged. Replacement swatch code: `const swatchStyle = swatchTokens.map((t, i) => \`    .sw-${i} { --swatch: ${t.value}; }\`).join('\n');` and `const swatch = (t, i) => \`      li.token-swatch\n        span.sw-${i}\n        code= ${q(t.name)}\n        small= ${q(t.value)}\`;` with `swatchTokens.map(swatch)` and the `style.\n${swatchStyle}` block as the mixin's first child.
   - **Verify:** Measured post-fix: `npm run lint:html` exits 0 on all three dist pages; `(Select-String dist/spec.html 'style="' -AllMatches).Matches.Count` = 0; swatches still render with correct colors.

4. **CONFIDENCE: HIGH**
   - **File/Section:** Task 1, Step 1 (line 98)
   - **Change:** `"lint:pug": "pug-lint \"src/pug/**/*.pug\""` → `"lint:pug": "pug-lint src/pug/boilerplate.pug src/pug/showcase.pug src/pug/spec.pug src/pug/_generated.pug"` (pug-lint 2.7.0 does not expand globs; quoted globs crash on PowerShell — measured).
   - **Verify:** Measured post-fix: `npm run lint:pug` exits 0 (after fix #5); pre-fix it crashed with `Path src/pug/**/*.pug was not found`.

5. **CONFIDENCE: HIGH**
   - **File/Section:** Task 19, Step 1 (lines 1038–1039)
   - **Change:** `span &lt;<span class="syntax-tag">section</span>&gt;` → `span &lt;#[span.syntax-tag section]&gt;`; same for the closing tag line. (Do not use sibling spans — `.o-code-block > code > span` counter-increments per span.)
   - **Verify:** Measured: `npx pug-lint src/pug/showcase.pug` exits 0 post-fix (was exit 2, "HTML text must not be used"); rendered `pre` content equivalent; html-validate green.

6. **CONFIDENCE: HIGH**
   - **File/Section:** Task 4, Step 3 (line 270)
   - **Change:** Pattern `data-theme="light"|data-theme="dark"` → `data-theme=light|data-theme=dark` (Dart Sass emits unquoted attribute selectors — measured).
   - **Verify:** Measured post-fix: the command returns 4 lines (light selector, dark selector, two `--accent:` lines) as the step expects.

7. **CONFIDENCE: HIGH**
   - **File/Section:** Task 3, Step 1 (line 200); consumers in Task 7 (line 415), Task 9 (line 491), Task 10 (lines 539–540), Task 12 (line 636)
   - **Change:** Rename the Tier-1 width `--border-strong: 0.125rem` → `--border-width-strong` and update the five width-position consumers (`base.scss`/`button.scss`/`forms.scss` outlines and `aria-invalid` border-width, `nav.scss` sidebar `border-inline-start`). Keep Tier-2 color `--border-strong` (Task 4 line 241); `kbd` (Task 11 line 584) is its only correct consumer. Note in the plan that spec §4 contains the collision.
   - **Verify:** Measured: pre-fix runtime `--border-strong` = `#8a7f75` (color won), focus outline computed `none` (declaration invalid, dropped), plan's focus test failed. Post-fix: focused control computes `outline: solid 2px rgb(179,79,0)`; `[aria-invalid]` input gets 2px border; plan's focus-visible test passes.

8. **CONFIDENCE: HIGH**
   - **File/Section:** Task 12, Step 1 (lines 639–643); Task 16 (line 833) and Task 19 (line 1025) nav markup
   - **Change:** (a) In the 40em media query add `.site-nav { flex-wrap: wrap; gap: var(--space-2); padding-inline: var(--space-2); }`. (b) Change the nav Theme/Density toggles from `button.btn.btn--sm` to `button.btn` (full-size; `btn--sm` = 36px violates the spec §11/DoD 8 floor the nav itself must meet).
   - **Verify:** Measured post-fix: 320px overflow 18px → 0 on boilerplate and showcase; first `.btn` min-height 35.04px → 44px; comfortable 48px; plan's two 320px tests and touch-target test pass.

9. **CONFIDENCE: HIGH**
   - **File/Section:** Task 1 (new Step 0, before line 88)
   - **Change:** Add `git switch -c feat/20261108-pyrocarbon-v6-plan` (Global Constraints line 19 mandates the branch; measured repo has only `master`).
   - **Verify:** `git branch --show-current` prints the feature branch before the first commit.

10. **CONFIDENCE: HIGH**
    - **File/Section:** Task 17, Step 1 (line 913)
    - **Change:** Anchor the scales filter: `tokens.filter((t) => /^--text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(t.name) || /^--space-\d+$/.test(t.name))`.
    - **Verify:** Measured: pre-fix the generated file contains 7 leaked semantic `--text-*` rows; post-fix zero, and the 8 type-scale + 16 space rows remain.

11. **CONFIDENCE: HIGH**
    - **File/Section:** Task 20, Step 1 comment (lines 1107–1109), Step 2 (lines 1114–1116); Task 23 README Tailwind section (line 1326)
    - **Change:** Replace the false "already-conforming namespaces need no remap" comment with the measured truth: the track's `var(--…)` references resolve only when the token custom properties are also loaded; state that consumers must load `dist/pyrocarbon.css` (or a tokens-only CSS emitted alongside) with the theme track; note unmapped `--text-*`/`--font-*`/`--radius-*` names otherwise fall back to Tailwind defaults (measured: `text-sm` = 14px default, `font-display`/`rounded-card` utilities absent). Change Step 2 to compile a probe **with a consumer page using the utilities** (unused `@theme` keys are tree-shaken — measured zero matches otherwise) and assert `.bg-surface-canvas` and `--spacing-4: var(--space-4)` emission. Apply the same correction to the README paragraph.
    - **Verify:** Measured: probe with usage emits `--spacing-4: var(--space-4)` and `.bg-surface-canvas`; README no longer claims self-containment.

12. **CONFIDENCE: HIGH**
    - **File/Section:** Task 21, Step 2 (add test after line 1220)
    - **Change:** Add a zero-JS test: `const ctx = await browser.newContext({ javaScriptEnabled: false });` → goto `/boilerplate.html` → assert `document.documentElement.dataset.theme` is undefined and `getComputedStyle(document.body).backgroundColor === 'rgb(236, 234, 233)'`.
    - **Verify:** Measured values satisfy it (Review Focus #1 is currently unpinned).

13. **CONFIDENCE: HIGH**
    - **File/Section:** Task 5, Step 2 (line 309)
    - **Change:** Add the Review Focus #3 promise: `(npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern '--surface-canvas:' -AllMatches).Matches.Count` → expected `1` (primitives/semantics never re-declared under density).
    - **Verify:** Measured count is 1.

14. **CONFIDENCE: HIGH** (value changes are design decisions, but the failing ratios and the passing replacements are measured)
    - **File/Section:** Task 4, Step 1 (light block, lines 236–248); Task 21, Step 2 (add contrast test); Task 22 (line 1278)
    - **Change:** Light theme: `--text-accent: #b34f00` → `#994700` (links/errors 4.34 → 5.47:1); `--text-on-brand: var(--neutral-10)` → `var(--neutral-0)` (nav brand 2.49 → 6.58:1; buttons 4.87 → 6.58:1); `--syntax-tag: #b58900` → `#994700` (2.22 → 4.55:1 on sunken); `--syntax-comment: var(--neutral-4)` → `var(--neutral-3)` (4.24 → 5.3:1). Dark theme: `--selection-bg: var(--orange-3)` → `var(--orange-4)`, `--selection-fg: var(--neutral-10)` → `var(--neutral-0)` (3.77 → 5.57:1). Add a Playwright test computing WCAG ratios from computed styles for (text-primary, text-accent, nav brand, button on-brand) in both themes, asserting ≥ 4.5.
    - **Verify:** Measured in-browser pre-fix: navBrand 2.49, link 4.34 (both FAIL). Post-fix ratios computed from the same luminance math: 6.58 / 5.47 / 4.55 / 5.3 / 5.57 (all pass AA).

15. **CONFIDENCE: MEDIUM**
    - **File/Section:** Task 24, Step 3 (lines 1370–1373)
    - **Change:** Pin cwd per command (git checks from repo root, `Select-String` from `v6/`); replace the vacuous `git status --short 5.2` with `git diff --name-only master...HEAD -- 5.2` (expect empty); replace the DoD-10 var-count with an assertion that a Tailwind utility resolves to a `var(--…)`-rooted value in the probe.
    - **Verify:** Measured: subdir `git status --short 5.2` exits 0 with no output (detects nothing); current worktree has pre-existing noise (`D STANDARDS_VERSION`, untracked `docs/`).

16. **CONFIDENCE: MEDIUM** (needs a column-width/markup decision — not auto-applied)
    - **File/Section:** Task 12, Step 1 (add `.c-sidebar` rule); Task 19, Step 1 (line 1029–1037 markup)
    - **Change:** Add `.c-sidebar { display: grid; gap: var(--gap-grid); }` with `@media (min-width: 40em) { .c-sidebar { grid-template-columns: minmax(0, 14rem) minmax(0, 1fr); } .c-sidebar__nav { position: sticky; top: calc(var(--nav-height) + var(--space-4)); } }`, and restructure `section#layout-doc` so the sidebar and a content wrapper are the grid's two children (currently the section's h2/p/pre are siblings of the nav, so no rail is possible).
    - **Verify:** Measured pre-fix: sidebar `display:block; position:static; width=main width` (no rail). Post-fix: two columns ≥40em, sticky rail.

17. **CONFIDENCE: MEDIUM**
    - **File/Section:** Task 18, Step 1 (lines 955–960); Task 21, Step 2
    - **Change:** Move the spec page's hand-written `<style>` block into `src/styles/spec.scss` (brought under the stylelint token contract); parametrize the overflow test over `[320, 768, 1440]` (spec §12); add assertions for nav-toggle `aria-expanded`/`data-open` and the density button's pressed state.
    - **Verify:** `npm run lint:css` covers the new file; Playwright reports all three widths.

18. **CONFIDENCE: LOW**
    - **File/Section:** Task 1, Step 1 (lines 102–107); Task 23 (line 1320)
    - **Change:** Drop the unused `cross-env` pin (and either justify or drop `@tailwindcss/vite`, which is idle in the measured build); correct README's "lint-enforced" case-sensitivity claim; add `npx playwright install chromium` to the README onboarding steps.
    - **Verify:** `npm prune`-clean install; README grep no longer overclaims.

---

*Evidence trail: sandbox dry-run of all 24 tasks' code in the session scratchpad (`v6sim/`), including the plan's verbatim verify commands, a full `npm run build`, the lint stack, the plan's Playwright suite (4/12 red as written), 10 additional browser measurements, a WCAG contrast computation, and a re-run of the entire `npm run verify` gate with Section 9 fixes 1–14 applied (22/22 green). The repository was not modified.*
