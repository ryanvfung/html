# cross-A-on-B — docs/plans/20261108-pyrocarbon-v6-plan.md

**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent
**Reviewer:** A, critiquing Reviewer B's findings in `20261112-pyrocarbon-v6-plan-plan-review-B.md`

## 0. Stance change and method

I reviewed the plan from CSS-spec reasoning plus repo reads and ran **nothing** (`npm install`, Sass, Vite, Playwright all unexecuted — my review says so up front). B dry-ran the plan in a sandbox and measured. That asymmetry changes how I read B's file, so for this critique I re-read the design spec (`docs/designs/20261101-pyrocarbon-v6-design.md`) specifically against B's citations — §3-R, §4, §5, §11, §12 — since several of B's strongest claims are spec-fidelity claims and exactly one of them (B21) is a deviation I missed.

Net position: **B's measurements do not overturn any of my 14 findings, but they retire one of my arguments, correct the mechanism of my most severe finding, and add four defects of at least equal severity that I did not see — including one that blocks the build before any of my findings can even be reached.** I did not have a defect as severe as B11. My Feasibility score of 8/10 is not defensible.

---

## 1. Where I agree with B

### 1a. Independent convergence (same defect, same fix, no shared evidence)

These matter more than agreement after the fact: two reviewers using different methods landed on the same defect *and* the same remediation text.

| Mine | B's | Defect | Plan sections |
|---|---|---|---|
| F1 | B14 (core) / fix #7 | `--border-strong` declared as a width in Task 3 and a colour in Task 4; the later `:root` block wins | Task 3 Step 1 (line 200), Task 4 Step 1 (line 241), consumers Tasks 7/9/10/12 |
| F2 | B18 / fix #2 | Task 1 Step 4 expects `13` devDependencies; Step 1 defines 12 | Task 1 Step 1 (lines 102–107), Step 4 (line 123) |
| F3 | B13 (second half) / fix #5 | `showcase.pug` uses raw inline HTML in Pug text, violating `disallowHtmlText` from Task 6 | Task 6 Step 2 (line 360), Task 19 Step 1 (lines 1038–1039) |
| F4 | B3 / fix #14 | DoD item 7 (AA contrast, both themes) has no verifying step | Task 21 (no contrast test), Task 24 Step 3/Step 5 (lines 1370–1384) |
| F5 | B15 / fix #11 | The Tailwind track cannot resolve its own `var(--…)` references; the "no remap needed" comment is false | Task 20 Step 1 comment (lines 1107–1109), Task 23 README (line 1326) |
| F6 | B2 (first half) / fix #10 | `/^--(text\|space)-/` leaks all seven semantic `--text-*` tokens into the "type scale" section | Task 17 Step 1 (line 913) |
| F7 | B14 (overflow item) | 320px `scrollWidth <= clientWidth` fails against the plan's own nav | Review Focus #4 (line 33), Task 12 (lines 639–643), Task 16 (line 833), Task 21 (line 1156) |
| F8 | B22 / fix #9 | Global Constraints mandate a branch no task creates | Global Constraints (line 19), Task 1 Step 5 |
| F10 | B20 | Stylelint contract is weaker than spec §4/§9 (no `font-family` rule) | Task 6 Step 1 (lines 333–351) |
| F11 (`cross-env`) | B23 | Unused dependency violates Global Constraints line 21 | Task 1 Step 1 (line 105) |
| F12 | B7 | `npm run dev` serves nothing (JS-only Rollup input, no HTML entry) | Task 15 Step 1 (line 780), Task 23 (line 1315) |
| F13 (`reuseExistingServer`) | B29 | Stale preview can serve an old `dist/` | Task 21 Step 1 (line 1144) |

B's independent confirmation of the arithmetic in F2/B18 and the regex in F6/B2 is worth more than either of us alone: both were computed from the plan text with no tooling, and both came out identical.

### 1b. B's findings that are new and that I accept as correct

- **B11 — `@use './tokens/tokens'` from `src/styles/index.scss` cannot resolve.** The plan's own Task 8 Step 2 verify compiles that file, so the pipeline is dead at Task 8 and Task 15 cannot produce `dist/`. I reasoned at length about the cascade, layer order, and specificity but never checked whether the path *resolves*. This is the single most consequential fact in either review and it is mine to have missed: `index.scss` is in `src/styles/`, `_tokens.scss` is in `src/tokens/`.
- **B12 — `.htmlvalidate.json` `overrides` rejected by html-validate 11's schema.** I cannot independently confirm the v11 schema, but B's error string is specific and consistent with html-validate's strict config schema, and B's remedy (remove inline `style=` at the source, fix #3) is right regardless of schema details. This also invalidates something I explicitly praised; see §5.
- **B13 — `pug-lint "src/pug/**/*.pug"` crashes on PowerShell (no internal glob expansion, PowerShell doesn't expand globs for native commands).** Concrete, Windows-specific, and squarely inside the plan's own "PowerShell-native" constraint (Global Constraints, line 21). My F3 assumed this script runs.
- **B1 — `.c-sidebar` is never styled.** Confirmed by reading Task 12 Step 1: the block styles `.c-sidebar__title` and `.c-sidebar__nav` only, while File Structure (line 55) advertises `sidebar (c-sidebar)` and Task 19 (lines 1029–1037) promises "a two-column reading layout with a sticky contents rail". I reviewed those exact lines for F3 and F7 and read past it.
- **B14's touch-target half — `.btn` min-height 35.04px.** This is the item that most damages my F7. I wrote, in the same paragraph where I predicted 320px overflow, that the four nav items are "all ≥44px min-height". They are not: Task 16 (line 833) and Task 19 (line 1025) use `button.btn.btn--sm`, and `.btn--sm` is `calc(var(--control-height) - var(--space-2))` (Task 9, line 497) = 35–36px. My own paragraph contains the opposite of the measurement.
- **B15(c) — the plan declares `@layer tokens, reset, base, components, utilities;` (Task 2, line 146) and then never wraps a single rule in a layer.** I flagged the Tailwind track's loadability but not this: unlayered author CSS outranks Tailwind's layered utilities, so a `.btn.p-4` consumer gets the component's padding. That defeats spec decision I line 62 ("thin integration layer") more thoroughly than the missing token import does.
- **B4 — the zero-JS light default is unpinned by any test.** Review Focus #1 (line 30) is the plan's first headline promise; Task 4's "pinning" is a `Select-String` on compiled CSS (line 270), and every Playwright test loads JS. Structural truth is not a regression test.
- **B17 — `data-theme="light"` never matches because Dart Sass emits unquoted attribute selectors.** I reasoned about the cascade (which the token blocks satisfy) and did not reason about Sass's serializer. Empirical fact, correct.
- **B21 — `verify` = build + lint + **test** (Task 1, line 100; Task 24 Step 2) contradicts spec decision R (line 70: "Build + lint always run. Playwright opt-in") and §8 (line 217).** I read the spec and cited §12 and §13.4 but missed R. Spec-fidelity deviations are the category I claimed to cover; this one is mine.
- **B19 — Task 18's hand-written `<style>` block (lines 955–960) sits outside the stylelint contract**, and the 23 generated `style="--swatch:…"` attributes are what forced the html-validate exemption. Correct, and it explains B12's origin.
- **B2's second half — spec §5 (line 110) and DoD 5 (line 300) require "every token and every component state in all 6 theme×density combos".** My F6 scoped this to "the spec page omits whole token tiers". B is right that the combo markup (lines 965–977) renders only 2 button variants, 1 label+input, 1 link, 1 inline code — no `select`/`textarea`/`checkbox`/file, no `.form-error`, no `o-cli-block`/`o-cmd-block`, no nav/sidebar/footer. My framing was under-scoped against the spec's own wording.

---

## 2. Where I disagree with B

### D1. B's B2 is spec-correct, but B's own fix set does not close it — and B's "22/22 green" does not include it
B ranks B2 HIGH ("DoD 5 is not delivered") and cites spec §5/DoD 5 accurately. But B's Section 9 fix #10 only anchors the scales regex. Nothing in B's auto-apply set adds a semantic/density section, and nothing extends the combo markup. B's closing claim — "a re-run of the entire `npm run verify` gate with Section 9 fixes 1–14 applied (22/22 green)" — is a statement about 12 plan tests plus B's own additions, **not** about DoD 5 or DoD 6. So B's strongest completeness finding survives B's own remediation, which is an internal inconsistency in B's artifact. Either B should have written the semantic/density section as a fix (it is 15 lines of generator code) or downgraded B2 to "re-scope DoD 5 in the plan text" — which is what Task Right-Sizing (lines 71–75) already does for alerts/cards/tables.

My F6 computed the same defect and proposed the same two-part fix (anchor the filter, add a third section). I still think that is the right scope, and B2's HIGH severity is right for the token half. The component-state half is a scope argument, not a defect: DoD 5 as literally written would make `spec.html` a 6× matrix of every component state, which is a v6.1 artifact. The plan should say so out loud rather than be graded against it.

### D2. B1's severity rests on a DoD reading I do not share
B says "DoD 6 is unmet". DoD 6 (spec line 301) is "`dist/showcase.html` demonstrates **≥ 3 realistic layouts**". `showcase.pug` has three `<section>`s; the documentation one being single-column does not make it a non-layout. What is actually violated is the **plan's own prose** — Task 19 Interfaces/Step 1 (line 1003, line 1031: "A two-column reading layout with a sticky contents rail") and File Structure line 55 — not DoD 6. That distinction matters for the fix: a plan-text correction ("single-column doc layout") is available and cheap; B's remedy (restructure the section so the sidebar and a content wrapper are grid siblings) is MEDIUM confidence by B's own tag and cannot be auto-applied. I agree the defect is real and that `.c-sidebar` is missing; I disagree that it is a DoD failure, and I would rank it below B3 and B11.

### D3. B14's attribution of the 320px fix is not isolated
B's fix #8 bundles (a) `flex-wrap` + condensed gaps under 40em and (b) promoting the nav toggles from `.btn--sm` to `.btn`, then reports "Measured post-fix: 320px overflow 18px → 0 on boilerplate and showcase". Both changes are correct, but only (a) can plausibly move `scrollWidth`; (b) *increases* the nav's min-content width (taller buttons, same labels). Presenting a single post-fix number for a bundled patch is the same class of unverifiable claim B correctly criticises in the plan (Task 24 Step 5's self-certification). B should report overflow with (a) alone, because the next implementer will apply (b) for the touch-target reason and may then be surprised.

### D4. B5's remedy is semantically wrong for the control it targets
B5 says the density button has no state affordance and suggests "set `aria-pressed` per option". `aria-pressed` is a boolean on a single toggle button; the density control is a 3-state cycler (`densityOrder = ['compact','default','comfortable']`, Task 14 line 723). Setting `aria-pressed` true/false would tell AT "pressed/not pressed" about a control with three values — actively misleading, and the plan only ever sets it on theme buttons (line 724), which *is* a boolean. The correct fix is a value-bearing affordance: `aria-label`/visible text updated to the current density, `aria-live` announcement, or a `<select>`; none of which is `aria-pressed`. B's observation is valid (MEDIUM is fair); the proposed fix is not.

I also note this is not a Phase-1 a11y item: spec §11 (lines 265–274) lists landmarks, `label for`, skip link, `:focus-visible`, reduced motion, AA contrast, touch targets, and non-colour error states. Toggle state semantics are not on the list, so B5 is a quality improvement, not a DoD gap.

### D5. B25's "circular" charge against Task 17 Step 2 is wrong
B calls the `rgba()` assertion "the generator's own stdout echoing its own parse — circular". It is not. Review Focus #2 (line 31) names the failure mode precisely: a regex that stops at the first comma. The generator parses a **known literal** (`--surface-overlay: rgba(22,20,19,0.55)`, Task 4 line 238) and fails closed (`throw new Error('gen-spec: rgba value not captured')`, line 908); if the regex truncated at the comma, stdout would read `overlay=rgba(22` and the step's expectation (`overlay=rgba(22,20,19,0.55)`, line 922) would not match. That is a property assertion on a pure function against a fixture with a published expected value — the *opposite* of circular. B's second half (the `clamp()` check greps `_generated.pug` but never the rendered page) is fair; it is also true that if `_generated.pug` is right, `spec.pug`'s `small= JSON.stringify(...)` will render it, so the risk is low.

### D6. B16's dirty-tree evidence is not what B says it is
B16 and B31 assert the worktree is dirty (`D STANDARDS_VERSION`, untracked `docs/plans/`, `docs/reviews/`, `.review-tmp/`). I ran `git status` myself at review time and recorded branch `master`, clean tree — which is why my F8 says "locally verified as master". One of us is wrong, or the tree changed between reads (both reviews are new untracked files under `docs/reviews/`, so at least part of B's observation is an artefact of the review process itself). This does not matter much because Task 24 Step 3's expectation is tolerant ("only regenerated `dist/` and `_generated.pug` entries, **or clean**", line 1373) — but B's inference "Task 24's git-status expectation is unachievable regardless of v6 work" is not supported, and the genuinely vacuous part of that step (a `git status --short 5.2` run from `v6/` detects nothing) stands on its own without the dirty-tree claim.

### D7. B8 and B6 are over-weighted
Both are MEDIUM. Neither is a spec or DoD violation: spec decision H (line 61) caps JS at toggles, `localStorage`, and `prefers-color-scheme` sync — it says nothing about form submission, and a demo form without `action` navigating to itself (B8) is ordinary static-page behaviour. B6's "no close semantics" is the weaker claim: the toggle is a `<button>` with `aria-expanded` (Task 14, lines 736–740) that closes the panel on a second click, so a keyboard dismissal path exists and WCAG 2.1.1 is not violated; what is missing is Escape and close-on-navigate. Both belong as LOW polish notes, not MEDIUM.

### D8. B10 and B30 are outside the plan's remit
The 14-item DoD lives in spec §12 and the plan audits it by number in Task 24 Step 3; restating it is convenience, not a defect. Archive/closing-sequence and repo-hook notes belong to `ship` and to the repo's agent conventions, not to an implementation plan whose stated execution skill is `implement` (line 3).

---

## 3. What B missed that I caught

- **Task 7 Step 3 swallows the first exit code**: `npx sass … > $null; npx sass … > $null` (line 423) — "Expected: exit 0" only proves the second command. This is the same class of defect as B16/B17/B25 (verify steps that cannot fail correctly) and B's five-item list in B25 omits it.
- **Task 16 Interfaces promise a `pages` array** (line 811) that Tasks 18–19 extend, but the snippet hardcodes `for (const name of ['boilerplate'])` (line 863). A contract the later tasks are told to edit does not exist; Task 18 Step 2 and Task 19 Step 2 are written as line edits against a variable that isn't there.
- **Spec drift with a measurable consequence I under-ranked**: Task 4 (lines 240–243) introduces `--text-on-brand` and `--surface-brand`, neither of which appears in spec §4 Tier 2 (line 89 lists text roles without `on-brand`, and has no `--surface-brand`). B's B3 measures the consequence (nav brand text 2.49:1) but never connects it to the token that isn't supposed to exist. The root cause is that one token, `--text-on-brand`, is used against **two different backgrounds**: `--surface-brand` (`#ff7700`, `.site-nav`, Task 12 line 630) and `--accent` (`#b34f00`, `.btn`, Task 9 line 484). B's fix #14 retargets it to `--neutral-0`, which satisfies the worse background but turns every button's label near-black. The correct fix is two tokens (`--text-on-brand` on the saturated brand surface, `--text-on-accent` on `--accent`), which is a plan-text change in Task 4 plus Task 9. That is the one place where my finding content is strictly more useful than B's.
- **`--elevation-strategy` is a degenerate switch**: both themes resolve it to `shadow` (lines 245, 263). B9 lists it as unconsumed; it is worse than unconsumed — it is a two-position token with one position, which invites a future "elevation strategy" that no component can honour. Task 22's DESIGN.md then codifies "One elevation strategy per component class (`--elevation-strategy`)" (line 1265), so the constitution documents a knob that does nothing.
- **Boilerplate is never exercised in 6 combos** (my F9d). DoD 4 is specifically "*`dist/boilerplate.html`* renders correctly in 2 themes × 3 densities" (spec line 299). Spec.html carries the matrix; boilerplate — the artifact DoD 4 names — has only single-toggle tests (Task 21 lines 1172–1194). B26 lists missing coverage but not this one, and it is the one DoD 4 actually requires.

## 3a. Residual gaps in both reviews

- `.btn--ghost:hover` sets `color: var(--text-accent)` on `background: var(--accent-subtle)` (Task 9, lines 495–496). In light that is `#b34f00` on `#ffddbf` (Task 4, line 243) ≈ **4.05:1** — a seventh AA failure that neither B3's list nor my F4 caught, on a Tier-1 component. B's `#994700` candidate (5.05:1 on that surface) happens to fix it.
- `.btn:disabled` uses `opacity: 0.55` (Task 9, line 492), which drops effective contrast far below AA — but WCAG 1.4.3 exempts inactive components, so this should be *documented as exempt*, not fixed. Neither of us said so, and an implementer reading B3's "AA in both themes" may try to "fix" it.
- Neither review checked whether `@tailwindcss/vite` does anything at all. B's B23 touches it ("idle in the measured build"); I never mention it, and Task 15 Step 1 installs it into `vite.config.ts` (line 775) for a build whose only stylesheet import never imports `tailwindcss`.

---

## 4. Effect of B's measured evidence on my confidence

| My finding | Direction | Why |
|---|---|---|
| F1 `--border-strong` collision | **Confidence up, mechanism corrected** | B measured runtime `--border-strong = #8a7f75`. My "width falls back to `medium` (≈3px)" is right for the `border-width:` longhand in `forms.scss` (invalid at computed-value time → initial → `medium`) but wrong in effect for the `outline:` *shorthand*: two colours in the shorthand reset **all** its longhands, so `outline-style` computes to `none` and the focus ring does not exist at all. I registered it as a 3px-vs-2px cosmetic regression plus a dead declaration; it is a missing focus indicator on every interactive element, and it is why Task 21's `focus-visible` test fails (B14). Severity: high → higher. |
| F2 | Unchanged HIGH | Two independent counts agree at 12. |
| F3 | **Conclusion holds, argument retired** | B13 shows `lint:pug` crashes before it can report anything, so my "surfaces ~5 tasks later at the Task 24 full gate" timeline is wrong: the gate never runs clean, and Task 19's own `lint:html` (line 1066) is already red via B12. The markup defect and fix are unchanged. |
| F4 | **Confidence up, scope up** | My `#b34f00` on `#eceae9` estimate of 4.34 matches B's measurement to two decimals, which validates the other ratios B reports. But B found five more failing pairs, including the worst one (nav brand 2.49:1). DoD 7 cannot be closed by darkening `--text-accent` alone; my fix #7 was too narrow. |
| F5 | **Confidence up, characterization understated** | I wrote "Task 20's verify only checks the mapping lines exist in probe output". B measured zero matches: the step *fails*, because Tailwind tree-shakes unused `@theme` keys. Plus the `@layer` half I missed. |
| F6 | **Confidence up, scope understated** | B measured 7 leaked rows and 23 swatches/31 rows; and spec §5 line 110 makes the combo requirement explicit, so my F6 under-read the spec. |
| F7 | **Real, but imprecise and incomplete** | My ≈375px min-content estimate vs measured 338px `scrollWidth` (18px overflow): right direction, ~4× magnitude, and I missed the deterministic `.btn--sm` failure in the same paragraph. |
| F8, F10, F12, F13 | Unchanged | Converged or corroborated. |
| F9 | Strengthened | B21 adds spec decision R; B26 adds persistence, `prefers-color-scheme`, nav-toggle coverage. |
| F11 | **Largely retired** | B verified all 12 pins resolve. My "version-ambitious" concern was hedged and is now closed. Only the `cross-env` dead-weight point survives. |

**Revised scores: Completeness 7 → 6** (DoD 5/6/7 gaps are larger than I stated, and three of them are B's). **Consistency 6 → 5** (the build path is wrong, `lint:pug` cannot run, and the plan contradicts spec decision R). **Feasibility 8 → 4**: I scored a pipeline "sound" that does not compile at Task 8 and whose three lint configs/kills cannot all pass. **Testability 6 → 5**: not only do several checks assert too little (my list, B's list), four of the twelve fail as written.

---

## 5. Disposition of B's 18 fixes

**Accept as written:** #1 (`../tokens/tokens`), #2 (12), #4 (explicit pug-lint file list), #5 (Pug interpolation, no sibling spans), #6 (unquote the attribute pattern), #7 (`--border-width-strong` + consumers), #9 (branch Step 0), #10 (anchored regex), #12 (zero-JS test), #15 (cwd pinning + real pathspec + resolution assertion instead of var-count), #18 (drop `cross-env`, correct README).

**Accept with amendment:** #8 — keep both edits, report the overflow number for the `flex-wrap` half alone (D3); and state the touch-target reason precisely, i.e. `.btn--sm` is a legitimate variant (Task 9 line 475 "Produces") that must not be used in default-density nav chrome, not a variant that violates the floor at every density (spec line 272 scopes the floor to default/comfortable). #11 — right diagnosis; add the wrap-rules-in-`@layer` half (B15c) and note `@tailwindcss/vite` should be removed from `vite.config.ts` if the track stays outside the Vite build. #14 — accept the failing ratios, split the token instead of retargeting it (§3), and document the `:disabled` exemption (§3a). #17 — accept, but move the spec page CSS into a linted stylesheet *and* have `gen-spec.mjs` own the generated declarations, not a Pug `<style>` (see #3). #16 — finding accepted, remedy correctly not auto-applied; also correct Task 19's prose or the markup, but do not call it a DoD 6 failure (D2).

**Reject as written:** #3. B19 is B's own finding that CSS living in a Pug `<style>` block escapes the stylelint contract — and fix #3 responds to the html-validate crash by generating **more CSS into a Pug `<style>` block**, nested inside a mixin whose only call site is inside `<main>` (line 964), i.e. emitting `<style>` in the body. The consistent remedy is for `gen-spec.mjs` to also emit a generated **SCSS** partial (e.g. `src/styles/_spec-generated.scss` with `.sw-0 { --swatch: #331800; } …`) that `index.scss` `@use`s, leaving `_generated.pug` to emit only `span.sw-N`. That removes the inline attributes, keeps every declaration under stylelint, and honours B19 at the same time.

**Not reached / out of scope:** #13 (`--surface-canvas` count in Task 5) is fine but trivial; B10/B30 items (§2 D8).

## 6. Bottom line

B's dry-run is the more valuable review of the two and I would ship B's fixes before mine, with the two exceptions above (#3 and the token split in #14). Four of my findings are unchanged in substance (F2, F8, F10, F12), one is retired (F11), one had a wrong consequence (F1), one under-read the spec (F6), and one was understated twice over (F4, F5). Conversely B's own artifact has three internal inconsistencies it should not survive review with: B2 HIGH with a fix set that does not close it, fix #3 contradicting B19, and a 5/10 completeness score whose remediation claim ("22/22 green") measures the plan's test suite rather than the DoD it grades.
