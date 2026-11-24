# Plan Review — Reviewer A

- source: subagent
- model: minimax/minimax-m3.1-flash (subagent replacement)
- date: 2026-11-08
- plan: docs/plans/20261108-pyrocarbon-v6-plan.md

**Completeness: 6/10** — The plan pins an unusually good set of edge cases (storage throwing, comma-bearing token values, zero-JS default theme), but several DoD items have no verification path at all (contrast, boilerplate-in-6-combos, 768/1440px), and multiple steps whose "Expected" outputs are stated as facts are arithmetically or behaviorally wrong as written, so the executing agent will hit false gates or ship broken artifacts.

---

## Scope and assumptions (I lack full session context)

I am a replacement subagent with no session history. The following assumptions are load-bearing for this review; if any is wrong, downgrade the corresponding findings:

1. **`docs/designs/20261101-pyrocarbon-v6-design.md` is authoritative** for consistency checks. I treated its §12 DoD (items 1–14), §3 decision table (esp. **R**: Playwright opt-in), and §13 first principles as binding on the plan. If the design was superseded in-session, findings F11, F13, F17 are void.
2. **"Review Focus" (plan lines 28–35) = user-stated acceptance criteria.** I treat failure of any of them as plan failure, not as optional.
3. **I could not execute anything** (no PowerShell, no `npm install`, no Playwright). All verification-step findings are static analysis: line-by-line matching of each `Run:` command against the plan's own artifact definitions.
4. **Registry versions are unverified.** I assume `vite@8.3.6`, `stylelint@18.0.0`, `sass@1.108.1`, `@playwright/test@1.65.0`, `tailwindcss@4.3.5`, `pug@3.0.4`, `html-validate@11.19.0` exist and are mutually compatible (the plan only claims Node/npm were "verified", line 12).
5. **I did not read `/5.2/`** (read-only reference per plan line 15), so I cannot check "derived from v5.2's actual values" claims.
6. **Output path:** repo convention (`agents-commit-conventions.md` line 5) puts review entries in `docs/archive/reviews/`; I was explicitly instructed to write `docs/reviews/20261108-plan-review-A.md` and followed the instruction.
7. **Assume the plan file itself is committed by the plan skill** outside the 24 tasks — no task in the plan commits `docs/plans/…`, yet Global Constraints (line 19) make the plan an exception to the "stays inside `v6/`" rule.
8. External facts checked online: stylelint `color-no-hex` **does** exist as a core rule; html-validate `wcag/h30` only requires *any* non-whitespace link text (so `<a href="#main">link</a>` passes — not a finding); Tailwind v4 emits `@theme` variables **only when used** unless `@theme static`.

### What holds up (so this isn't a blanket panning)

- Review Focus #2 is genuinely addressed: the parser regex `([^;]+);` (line 904) captures `rgba()`/`clamp()` whole, and the `--surface-overlay` assertion (line 908) would catch regressions.
- Review Focus #5's scoping works: `[data-theme]`/`[data-density]` blocks fully re-declare every semantic/density property on the wrapper `div`, so spec combos can't inherit root values.
- Storage guard (Task 14) catches both method-call and identifier-access throws (`localStorage` is referenced *inside* the `try`), and the test stubs `Storage.prototype` — correct.
- Density orthogonality (Review Focus #3) holds: Task 5's blocks touch no color/primitive property.
- Task ordering, per-task commit discipline, and per-task single deliverable are well-formed.

---

## Findings — HIGH confidence

**F1. Token name collision: `--border-strong` is a width in Task 3 and a color in Task 4. [Completeness / Consistency / Feasibility]**
Task 3 (line 200) declares `--border-strong: 0.125rem;` (structural width); Task 4 (line 241) re-declares `--border-strong: var(--neutral-5);` (semantic color) in a later `:root` block, so the color wins by cascade. Consequences: `base.scss` `:focus-visible { outline: var(--border-strong) solid var(--focus-ring) }` (line 415) and `.btn:focus-visible` (line 491) substitute two colors → invalid at computed-value time → **`outline-style: none`, i.e. no focus ring anywhere**, which makes Task 21's focus test (line 1205) fail; `.form-control[aria-invalid] { border-width: var(--border-strong) }` (line 540) silently drops. `gen-spec.mjs`'s dedupe (line 906) keeps the *first* occurrence, so the spec page would even display the stale width and mask the bug. The root cause traces to design §4, which lists the same name in Tier 1 *and* Tier 2 — the plan inherits it unexamined. The failure surfaces 20 tasks late with a misleading symptom (a Playwright assertion failing far from its cause).
→ **Fix:** rename the Tier 1 token to `--border-width-strong` (or the Tier 2 one to `--border-color-strong`) in Tasks 3/4/9/10/11, and add a Task 4 step asserting width tokens still resolve to lengths after the semantic block is appended.

**F2. The Tailwind track is not self-contained — `var(--…)` references resolve to nothing for its documented consumer. [Feasibility / Completeness]**
Task 20's `_tailwind-theme.css` (lines 1087–1105) maps `--color-surface-canvas: var(--surface-canvas)` etc. but **never imports `_tokens.scss`**, so `--surface-canvas` is undefined unless the consumer also loads `pyrocarbon.css` — which README's Tailwind section (line 1326) explicitly does not instruct ("Import `src/tokens/_tailwind-theme.css`, then use utilities"). Every generated utility then invalidates at computed-value time (transparent/inherited). Plan line 8 claims the flow `_tokens.scss → _tailwind-theme.css`; Task 20 never implements that edge. DoD 10 is checked only by counting `var(--` occurrences (line 1372), which passes regardless.
→ **Fix:** add `@import "./_tokens.scss";` to the tailwind entry (the token file is plain CSS, so the Tailwind CLI can inline it), *or* require linking `pyrocarbon.css` in README, and verify with a real consumer page that `getComputedStyle` on a utility-using element resolves a color.

**F3. Task 20 Step 2's probe expectation will fail as written. [Testability / Feasibility]**
Line 1114–1115 expects `dist/tailwind-probe.css` to contain `--color-surface-canvas: var(--surface-canvas)` and `--spacing-4: var(--space-4)`. Tailwind v4 only emits `@theme` variables that are *used* by generated utilities (unless `@theme static`), and at Task 20 no file in `v6/` contains the candidate strings `bg-surface-canvas` or `p-4`. (Ironically, README written in Task 23 *does* mention those exact utilities — so a re-run after Task 23 might pass, but Task 20's own gate runs first.) The task will be rejected or the agent will burn cycles "fixing" a non-bug.
→ **Fix:** use `@theme static { … }`, or add a one-line probe HTML/CSS that uses each utility before running the CLI, or assert against the source file instead of compiled output.

**F4. Task 1 Step 4 expects `13` devDependencies; the package.json it just wrote has `12`. [Testability]**
Counting lines 103–106: `@playwright/test`, `@tailwindcss/cli`, `@tailwindcss/vite`, `cross-env`, `html-validate`, `postcss-scss`, `pug`, `pug-lint`, `sass`, `stylelint`, `tailwindcss`, `vite` = 12. The very first verification gate in the plan fails.
→ **Fix:** change expected to `12` — or, if the missing 13th is `typescript` (plausible given `vite.config.ts`/`playwright.config.ts` want typechecking), add it with a justification note per Global Constraints line 22.

**F5. Task 23 Step 2 expects five matches from a `Select-String` that returns four. [Testability]**
Line 1337: `Select-String -Path package.json -Pattern '"dev"|"build"|"lint"|"verify"|"preview"'` — without `-AllMatches`, Select-String returns one result per matching *line*. Matching lines: `"dev": "vite", "build": …` (1), `"preview": …` (2), `"lint": …` (3), `"test": …, "verify": …` (4). `lint:css`/`lint:html`/`lint:pug` lines don't match `"lint"` (the pattern requires a closing quote right after `lint`). Expected 5 ≠ actual 4. (With `-AllMatches` it *is* 5 — the author forgot the flag.)
→ **Fix:** add `-AllMatches` and count with `Measure-Object`, or change Expected to `4`.

**F6. The touch-target test (Task 21) fails against the plan's own markup and `--sm` token — and DoD 8 is genuinely violated. [Testability / Completeness]**
`test('touch targets …')` (lines 1188–1194) evaluates `document.querySelector('.btn')`, which in `boilerplate.pug` is the **header Theme button with `.btn--sm`** (line 833, before the main `button.btn` at line 846). `.btn--sm { min-height: calc(var(--control-height) - var(--space-2)) }` (line 497) ≈ 44 − 9 = **35px at default** (expect ≥44 → fail) and ≈ 48 − 9 = 39px after one click (expect ≥48 → fail). This isn't just a test bug: the header's theme/density toggles really are ~35px targets, contradicting design §11/§12 DoD 8 ("≥44px default, ≥48px comfortable") and DESIGN.md Task 22 ("44px default / 48px comfortable targets").
→ **Fix:** decide the contract first — either drop `--sm` from the header toggles (keep them ≥44), or redefine `--sm` to reduce padding/font only, then target `.btn:not(.btn--sm)` in the assertion if `--sm` stays sub-44.

**F7. 320px no-overflow assertion (Review Focus #3) is likely to fail on the header. [Feasibility / Risk]**
`.site-nav` (line 630) is `display: flex` with `gap: var(--space-4)` and **no `flex-wrap`**, holding brand link + Menu toggle + Theme + Density buttons. Flex items won't shrink below min-content (single words + padding): ≈ 89 + 66 + 47 + 58 = 260px content + 3×16 gaps + 32px inline padding ≈ **330–340px > 320px**. My width estimates carry ±10% error, but there is no wrap/hide strategy of any kind, so the plan's own pinned expectation (`scrollWidth <= clientWidth` at 320px, line 33/1156) has near-zero safety margin on `/boilerplate.html` and `/showcase.html` (spec page has no header and will pass, masking the pattern).
→ **Fix:** add `flex-wrap: wrap` to `.site-nav` (or hide the brand link / move toggles into the collapsible list below 40em) in Task 12, and pin the 320px test on a page-state that exercises the wrapped header.

**F8. WCAG AA contrast (DoD 7) has no verification step — and the plan's own token values fail it. [Completeness / Risk]**
No task computes contrast; Task 24 Step 5 reduces DoD 7 to the phrase "contrast checked" in a self-review checklist (line 1384). Computing ratios from the plan's literal values (WCAG 2.1 sRGB formula):
- Light `.site-nav`: `--text-on-brand` `#f8f7f7` on `--surface-brand` `#ff7700` ≈ **2.5:1** — fails even the 3:1 large-text floor. This is the site header on every page, light theme, i.e. the default rendering.
- Light links/form-error: `--text-accent` `#b34f00` on canvas `#eceae9` ≈ **4.34:1** — fails 4.5:1 for body-size text (marginal but real).
- Light syntax comments: `--syntax-comment` `#696059` on `--surface-sunken` `#d9d6d3` ≈ **4.2:1** — fails 4.5:1.
Dark theme values checked out fine. As planned, this ships broken and "verified" by checklist.
→ **Fix:** fix tokens (dark `--text-on-brand` on the orange brand surface; darken `--text-accent`), and add a mechanical check — a small Node script or Playwright step asserting computed foreground/background pairs against 4.5:1/3:1 — as a Task 21 test and a Task 24 DoD command.

---

## Findings — MEDIUM confidence

**F9. DoD 5 ("spec.html shows all tokens + all components in all 6 combos") is not met by Task 18. [Completeness]**
`gen-spec.mjs` emits only `--(orange|neutral)-` swatches and `--(text|space)-` rows (lines 912–913): font stacks, `--nav-height`, radii, borders, all surface/border/accent/shadow/syntax semantics and every density alias are absent from the spec page. The combo block (lines 967–976) renders only buttons and one input — no nav, footer, code/`kbd`/cli blocks, checkbox, select, textarea, or sidebar, though Task 18's interface claims to consume "component classes (Tasks 9–13)".
→ **Fix:** widen the parser filters to every declared token (group by tier), and add one representative instance of each Tier-1 component to the combo template; assert token-count-in-HTML ≥ token-count-in-source in Step 2.

**F10. DoD 4 (boilerplate renders correctly in 2 themes × 3 densities) has no test. [Testability]**
Task 21 toggles theme once and density once on `/boilerplate.html`; the 6-combo rendering test exists only for `/spec.html` (line 1196), which is a different document than DoD 4 names. Nothing renders `boilerplate.html` with `data-theme`/`data-density` set on `<html>` across all six pairs.
→ **Fix:** parametrize one test over the six attribute pairs (set on `<html>` via `page.evaluate` after load or via init script) asserting canvas color and `.btn` min-height per combo.

**F11. Two explicit design §13 first principles are violated without acknowledgment. [Consistency]**
§13.4: "Spec page early — should exist before the second component"; plan ships it at Task 18, after all five component tasks. §13.7: "Playwright assertions added as each component lands, not retrofitted at the end"; plan ships *all* tests at Task 21. The plan's "Task Right-Sizing" section (lines 67–75) argues its ordering but never mentions the deviation.
→ **Fix:** either move a spec-page smoke test + one component assertion earlier (Tasks 9–10), or add an explicit "deviations from design §13, accepted because …" note so a reviewer doesn't re-litigate it.

**F12. `npm run dev` cannot render the Pug pages it advertises. [Feasibility / Consistency]**
Vite config (Task 15) has no Pug plugin; pages are produced only by `postbuild` (Task 16). So `npm run dev` (README line 1314) serves a dist whose HTML never updates while editing `src/pug/*` — the design's §8 "Vite dev server with HMR" workflow is dead on arrival. Design said `vite-plugin-pug (or equivalent)`; "equivalent" was interpreted as postbuild-only with the dev-path consequence unstated.
→ **Fix:** document that dev iteration requires `npm run build` (watch) + preview, or add a Pug plugin/dev middleware; at minimum state the limitation in README's Commands section.

**F13. `verify` contradicts design decision R ("Playwright opt-in"). [Consistency]**
Plan line 100: `"verify": "npm run build && npm run lint && npm test"` — tests always run; design §3-R and §8 say build+lint always, Playwright opt-in (`npx playwright test`). This also makes `verify` require a browser install that README never mentions (see F23).
→ **Fix:** align with design (`verify` = build+lint, `test` opt-in) or amend design §3-R in the same PR and note it.

**F14. `showcase.pug`'s raw HTML-in-text likely fails the plan's own pug-lint config — and page tasks never run `lint:pug`. [Consistency / Testability]**
Line 1038: `span &lt;<span class="syntax-tag">section</span>&gt;` is raw HTML inside Pug text; Task 6 sets `disallowHtmlText: true` (line 360), which exists precisely to reject that pattern. Tasks 18 and 19 verify only `lint:html` (lines 985, 1066), so the violation surfaces at Task 24's full `verify` — after the showcase is "done".
→ **Fix:** run `npm run lint` (all three linters) in every page task's verify step; restructure the code sample to nested Pug tags (`span &lt;` + `span.syntax-tag` + `span &gt;`) instead of raw HTML.

**F15. The `@layer` cascade discipline is cosmetic. [Consistency / Feasibility]**
Line 146 declares `@layer tokens, reset, base, components, utilities;` and line 57 claims "layer order is declared at the top of `_tokens.scss`" — but no rule in `reset.scss`, `base.scss`, or any component file is wrapped in a layer. Everything is unlayered, so (a) ordering comes purely from `@use` order, and (b) unlayered styles beat layered ones, meaning a consumer's `@layer utilities` overrides can *never* take precedence over PyroCarbon's `.btn` etc. — surprising for a drop-in design system, and the claimed layer protection against override wars doesn't exist.
→ **Fix:** wrap each file's rules in its declared layer (`@layer reset { … }` etc.), and add a test asserting a layered consumer rule wins.

**F16. Lint contract is weaker than design §9 promises, with concrete holes. [Completeness / Consistency]**
Task 6 (lines 330–351) vs design §9: no `font-family` ban (§4 says "lint-enforced"); no `linear-gradient`-on-text rule (only `background-clip`); `custom-property-pattern` is a generic slug pattern, not the promised `--{tier}-{role}-{variant}`; "undeclared custom properties" unenforced. Additional holes I found: the px-ban regex `^(padding|margin|gap|font-size)(-(top|right|bottom|left|x|y))?$` misses **logical properties** (`padding-inline`, `margin-block-end` — which Task 10 itself uses, line 532) and `row-gap`/`column-gap`; and `lint:css` globs only `src/**/*.scss` (line 96), so `_tailwind-theme.css` is never linted.
→ **Fix:** broaden the property regex (or switch to `unit-disallowed-list: ['px']` scoped by property), add the missing rules from §9, and include `src/**/*.css` in the glob.

**F17. Design §9's pug-lint "no inline `style=` in source" was silently dropped. [Consistency]**
`.pug-lintrc.json` (line 360) omits `disallowInlineStyle` — because Task 17's generated swatches emit `style="--swatch:…"` (line 910) and would violate it. The plan changes the design contract without recording the change; a later reviewer reading §9 will expect the rule to exist.
→ **Fix:** amend design §9 to "no inline style in hand-written Pug; generated token swatches exempt", or switch swatches to `data-swatch` + CSS `attr()`-free mapping.

**F18. Zero-JS mobile navigation is impossible, and `aria-expanded` reports the wrong state on desktop. [Completeness / Accessibility]**
Below 40em, `.site-nav__list` is `display: none` (line 641) and only JS can reveal it — so the plan's own zero-JS ethos (Review Focus #1) doesn't extend to navigation: a JS-less mobile visitor gets a Menu button that does nothing. Separately, `aria-expanded="false"` is hard-coded (lines 828, 1021) while CSS *shows* the list above 40em — screen readers are told the menu is collapsed when it is visible. `applyDensity` also never updates any ARIA state (Task 14 line 725), so the density toggle is stateless for AT.
→ **Fix:** use `<details>`/`:has()`-based CSS fallback for the nav (baseline allows both), and initialize/`matchMedia`-sync `aria-expanded` (or only set `aria-expanded` when the toggle is actually displayed); give the density toggle `aria-pressed`/status text.

**F19. The runtime unconditionally clobbers the `data-theme`/`data-density` attributes README tells consumers to set. [Completeness / Undefined behavior]**
Task 14 line 727: `applyTheme(storage.get('pc-theme') ?? (darkQuery.matches ? 'dark' : 'light'))` runs on every load — a standalone consumer (README line 1323) who hardcodes `data-theme="dark"` and includes `pyrocarbon.js` gets it silently replaced by OS-light on first paint. Which source wins is undefined and undocumented.
→ **Fix:** respect an existing author-set attribute on first visit (only storage should override it), i.e. `storage.get(...) ?? root.dataset.theme ?? (OS …)`; document the precedence order in README.

**F20. Form states are incomplete for a system that claims "all states covered" (Task 24 Step 5). [Completeness]**
Task 10 (lines 531–548) styles focus, invalid, and hover-free default states only: no `:disabled`/`[disabled]`, no `readonly`, no `::placeholder`, no `select:disabled`, no `:focus-within` for grouped controls. Task 24's self-review requires "all states covered" but the plan never defines what the state matrix is — so the checklist is unfalsifiable.
→ **Fix:** enumerate the state matrix in Task 10's interface (enabled/hover/focus/disabled/readonly/invalid/placeholder), add the rules, and assert at least disabled+placeholder in Task 21.

---

## Findings — LOW confidence

**F21. Task 24's DoD audit covers only items 5, 9, 10, 14; items 13, 4, 6, 7, 8 have no command, and `dist/pyrocarbon.js` is skipped. [Testability]**
Step 3 (lines 1367–1373) greps `dist/*.css,dist/*.html` — not `pyrocarbon.js` — for bootstrap/jquery/tether, and audits nothing for DoD 13 ("no hardcoded hex in demo assets") or DoD 6 (≥3 layouts, countable in one command). DoD 3 is only implied via `lint`.
→ **Fix:** build a literal 1–14 → command-or-attestation table into Step 3; add `dist/pyrocarbon.js` to the grep paths and a `<section`/`hex in pug` check for DoD 13/6.

**F22. `cross-env@10.1.0` is installed but never used, violating Global Constraints line 22 ("no extras without a task that justifies them"). [Consistency]**
No script in Task 1 or later sets an env var. Note the README (line 1320) nonetheless says "`cross-env` is used only when setting env vars" — describing a tool that does nothing here.
→ **Fix:** drop the dependency (and the README sentence), or add the task/script that uses it.

**F23. Fresh-clone `verify` fails: README omits `npx playwright install chromium`, and `reuseExistingServer: true` can test stale dist. [Completeness / Risk]**
Task 21 Step 3 and Task 24 Step 2 install Chromium, but README's Commands list (lines 1312–1317) doesn't — a human following the README hits a missing-browser error. Also, `reuseExistingServer: true` (line 1144) plus `test` not depending on `build` means a stale long-running preview can serve old HTML to the suite.
→ **Fix:** add the browser-install prerequisite to README; note that `verify` must precede `npm test` or use a distinct port.

**F24. The "no console errors" test can flake on `/favicon.ico`. [Risk]**
Lines 1163–1169 push any `console` error of type `error` — browsers requesting a missing favicon log "Failed to load resource: 404" as a console error. None of the three pages ships a favicon (Tasks 16/18/19).
→ **Fix:** ship a tiny favicon in `dist/`, or filter favicon URLs from the assertion so real errors stay loud.

**F25. Dead tokens: `--elevation-strategy` (and `--shadow-card`) are defined but consumed nowhere. [Consistency]**
Task 4 defines both (lines 245–246); no component uses them (nav uses `--shadow-nav` directly; there is no card component in v6.0). DESIGN.md Task 22 nonetheless enshrines "`--elevation-strategy`" as a rule (line 1265) — constitution references a token no code reads.
→ **Fix:** either drop them from v6.0 (re-add with the card component in v6.1) or consume `--elevation-strategy` in the one place that has elevation (nav) via a documented mechanism.

**F26. The semantic tier smuggles raw hex that isn't in the primitive ramp, weakening "one value source". [Consistency]**
Task 4 introduces `#b34f00`, `#803c00`, `#b58900`, `#0f0d0c`, `#d9a441` (lines 238–264) that exist in neither the orange nor neutral ramp; `color-no-hex` is disabled for the whole file (line 348), so nothing forces Tier 2 to *alias* Tier 1 as design §4 implies ("role-based aliases"). The documented ramp is no longer the palette source of truth, and `gen-spec`'s swatch section can't show these values.
→ **Fix:** express them as `color-mix(in srgb, var(--orange-5) X%, …)` or ramp references (`--accent: var(--orange-…)`), or promote the missing shades into Tier 1 as documented primitives.

---

## Dimension summary

- **Completeness (basis for 6/10):** strongest on runtime edge cases (storage, parser, zero-JS default), weakest on verification coverage: DoD 4/6/7/8/13 lack commands, form state matrix undefined (F20), no-JS mobile nav undefined (F18), README prerequisites missing (F23).
- **Feasibility:** the core architecture (one token file → Vite dist + Tailwind block) is achievable with the stated stack, but three concrete mechanisms don't work as written: Tailwind track without token import (F2), Tailwind probe expectations vs v4 emission semantics (F3), dev server without Pug (F12). F1 makes focus rings silently non-functional.
- **Consistency:** divergences from design §3-R (F13), §4 (F1, F26), §9 (F16, F17), §13 (F11) — four of the five are unacknowledged in the plan.
- **Testability:** good property-test instincts (the Review Focus ↔ test mapping is genuinely clever), undermined by assertions that are wrong as written (F4, F5, F6), an at-risk viewport assertion (F7), and late gates (F14: `lint:pug` only at Task 24).
- **Risks:** most likely real-world failures are the light-theme header contrast (F8, ships broken by default), 320px overflow (F7), touch targets (F6), and an executing agent stalling at false-fail gates (F3/F4/F5) and having to reason past them — exactly the situation that produces rationalized "expected" outputs.
- **Security / performance:** no material concerns found. `gen-spec.mjs` injects token values via `JSON.stringify` (escaped, no `<` in values) so the generated Pug isn't an injection vector; no CDN/network calls ship (DoD 9 enforced); `localStorage` holds only two non-sensitive flags; all deps pinned; private package, no publish path. Perf: sticky-header `box-shadow` and `clamp()`-in-custom-props are negligible; spec page renders ~55 swatch/row items — fine. Only nit: `emptyOutDir: true` (Task 15) deletes tracked `dist/` before regenerating, so a mid-build Pug failure leaves deletions staged-able for an unwary `git add v6/dist` at Task 24 Step 4.

## Verdict

**Revise, then re-review.** The plan is executable in outline and most tasks are well-specified, but F1–F8 each independently produce a failed gate or a shipped defect. F1, F2, F6, F8 are correctness problems in the artifact itself; F3, F4, F5 are verification steps that will fail for reasons unrelated to the deliverable; F7 is a promised behavior with no supporting design. After those eight are fixed, the MEDIUM findings (esp. F9–F11, F13) should be resolved as explicit design-vs-plan decisions rather than left silent.

*External sources consulted:* [stylelint `color-no-hex`](https://stylelint.io/user-guide/rules/color-no-hex/), [html-validate `wcag/h30`](https://html-validate.org/rules/wcag/h30.html), [Tailwind v4 `@theme` only emits used variables (Stack Overflow)](https://stackoverflow.com/questions/79424838/unused-classes-and-variables-are-included-in-the-native-css-output-of-tailwind), [Tailwind discussion: `@theme static`](https://github.com/tailwindlabs/tailwindcss/discussions/18440).
