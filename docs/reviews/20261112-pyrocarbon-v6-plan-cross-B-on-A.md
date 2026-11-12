# cross-B-on-A — docs/plans/20261108-pyrocarbon-v6-plan.md

**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent
**Reviewer:** B, critiquing Reviewer A's findings in `20261112-pyrocarbon-v6-plan-plan-review-A.md`

## 0. Stance

I dry-ran the plan (verbatim file set in a scratchpad sandbox, pinned deps installed, `npm run build`, the lint stack, the plan's 12 Playwright tests, plus ~10 extra browser measurements and WCAG computation). A read the plan and the design spec and executed nothing, and says so. A's review is therefore a reasoning review, and it holds up better than that method usually does: **six of A's findings are the same defects I measured independently, and four of the nine items in A's Section 9 are textually identical to mine.** Two of my findings exist only because A's approach cannot reach them (a path that doesn't resolve, a schema that rejects a key).

Where A and I genuinely part is on (a) the *consequence* of the defect we both found first, (b) the *timeline* of failures, (c) three claims A makes that measurement contradicts, and (d) scoring. I accept four items from A that are absent from my review, including one verify-step defect I should have caught, since it is exactly the class I claimed to audit.

---

## 1. Where I agree with A

### 1a. Independent convergence — same defect, same fix text

| A | Mine | Defect | Plan sections |
|---|---|---|---|
| F1 | B14 core / fix #7 | `--border-strong` is a width in Task 3 and a colour in Task 4; equal-specificity `:root`, later block wins | Task 3 Step 1 (line 200), Task 4 Step 1 (line 241) |
| F2 | B18 / fix #2 | Task 1 Step 4 expects 13 devDependencies; 12 exist | Task 1 Step 1 (lines 102–107), Step 4 (line 123) |
| F3 | B13 second half / fix #5 | `showcase.pug` inline HTML violates `disallowHtmlText` | Task 6 Step 2 (line 360), Task 19 Step 1 (lines 1038–1039) |
| F4 | B3 / fix #14 | DoD 7 has no verifying step; light accent fails AA | Task 4 Step 1, Task 21, Task 24 Step 5 (line 1384) |
| F5 | B15 | Tailwind track cannot resolve its `var(--…)` references; the "no remap" comment is false | Task 20 Step 1 comment (lines 1107–1109) |
| F6 | B2 first half / fix #10 | `/^--(text\|space)-/` leaks semantic `--text-*` into the scale section | Task 17 Step 1 (line 913) |
| F7 | B14 overflow item | 320px overflow against the plan's own nav | Review Focus #4 (line 33), Task 12 (lines 639–643) |
| F8 | B22 / fix #9 | No task creates the mandated branch | Global Constraints (line 19), Task 1 Step 5 |
| F10 | B20 | Stylelint contract weaker than spec §4 (no `font-family` rule) | Task 6 Step 1 (lines 333–351) |
| F11 (`cross-env`) | B23 | Unused dependency violates Global Constraints line 21 | Task 1 Step 1 (line 105) |
| F12 | B7 | `npm run dev` has no HTML entry, serves nothing | Task 15 Step 1 (line 780), Task 23 (line 1315) |
| F13 (`reuseExistingServer`) | B29 | Stale preview can mask a stale `dist/` | Task 21 Step 1 (line 1144) |

Why this matters: F1, F2, F3, F4, F5, F6 were each derived twice by different methods — arithmetic on the plan text by A, execution by me — and both times produced the same defect *and the same remediation*. For F2 the count is not arguable (12) and both reviews say so. For F3 our fixes are character-identical, including the non-obvious constraint that the syntax spans must be siblings-in-interpolation rather than sibling elements, because `.o-code-block > code > span` counter-increments per span (Task 11, lines 587–589). Two reviewers independently reaching that caveat is the strongest single signal in either review that the fix is correct.

For F4 the numeric agreement is exact: A estimated light `--text-accent` `#b34f00` on `#eceae9` at ≈4.34:1 and flagged ±0.05 uncertainty; I measured 4.34:1. That calibrates A's arithmetic, which is why I take A's other estimates seriously even where I disagree with the framing.

### 1b. A's findings I accept without amendment, including four I missed

- **Task 7 Step 3 swallows the first exit code.** `npx sass … > $null; npx sass … > $null` (line 423) — "Expected: exit 0" attests only the second command. This belongs in B25 and I did not have it; B25's list of "five verify steps that assert the wrong thing" becomes six. It is the same failure class as my B16 (vacuous audits), so its absence from my review is a real gap.
- **Task 16 Interfaces vs snippet mismatch.** Interfaces (line 811) promise "a `pages` array that Tasks 18–19 extend"; the snippet hardcodes `for (const name of ['boilerplate'])` (line 863), and Tasks 18/19 Step 2 are written as edits to a variable that does not exist. Correct, cheap to fix, absent from my review.
- **`--elevation-strategy` is a one-position switch.** I listed it among unconsumed tokens (B9); A's sharper point is that both themes resolve it to `shadow` (lines 245, 263) while Task 22's DESIGN.md codifies it as the switch (line 1265). That is a better statement of the defect than mine and I am adopting it.
- **Boilerplate is never exercised in 6 combos.** DoD 4 names `dist/boilerplate.html` explicitly (spec line 299) and only spec.html carries the matrix; boilerplate gets single-toggle tests (Task 21 lines 1172–1194). A's F9(d) is right, and my B26 lists coverage gaps without this one — the one DoD 4 actually requires.
- **A's itemized raw-value list** (F10c: `0.125em`/`0.25em`/`2.5em` in `code.scss`, `1.25rem` checkbox in `forms.scss`, `outline-offset: 0.125rem` ×3) is better evidence for the DoD 3 overclaim than my B20 phrasing ("raw em geometry"). I measured that stylelint passes those files; A read the files and said which lines. Both halves are needed and A supplied the second.
- **Repo facts I did not check**: root `.gitignore` covers `node_modules/` and `tmp/` (so Task 6's `v6/tmp/` leftover is untracked and harmless, corroborating my B13 discussion), and `dist/` is not gitignored (so committed `dist/` works as assumed). A verified these; I assumed them.

---

## 2. Where I disagree with A

### D1. A's F1 names the wrong *consequence*, at the point where consequence is the whole finding
A writes that substituting a colour makes the declarations "invalid at computed-value time; outline/border width falls back to `medium` (≈3px) instead of 0.125rem". For the `border-width:` **longhand** in `forms.scss` (line 540) that is exactly right: invalid at computed-value time → unset → initial → `medium`, i.e. a 3px error border where 2px was specified. For the `outline:` **shorthand** in `base.scss` (line 415), `button.scss` (line 491) and `forms.scss` (line 539) it is right about the width and wrong about the outcome: two colours in the shorthand make the whole declaration invalid, so *all* its longhands reset — measured, `outline-style` computes to `none`. There is no 3px ring; there is no ring.

That matters twice over. First, severity: A registered "3px instead of 2px, plus a dead declaration", which reads as cosmetic; the truth is that every interactive element loses its focus indicator, which is a spec §11 Phase-1 item (line 267) and the reason the plan's own `focus-visible` test goes red. Second, A's Section 9 #2 verify ("in a browser, `.btn:focus-visible` computed `outline-width` is `2px`, not `medium`") describes a pre-fix state that does not exist; the post-fix check should assert `outline-style: solid` **and** width 2px. A also omits `nav.scss` from the consumer list — `.c-sidebar__nav a { border-inline-start: var(--border-strong) solid transparent }` (line 636) is a second colour plus colour shorthand, so it dies too, and `[aria-current="page"]` (line 638) has no indicator bar. That is five consumers, not three.

### D2. A's F3 timeline is wrong, and it weakens A's own right-sizing argument
A: "Task 19 'passes' its local checks; the failure surfaces ~5 tasks later at the Task 24 full gate." Both halves are contradicted by measurement:

- `lint:pug` **cannot run at all** — `pug-lint "src/pug/**/*.pug"` exits with `Path src/pug/**/*.pug was not found` on PowerShell (B13). The pug violation is never *reported* anywhere; the script that would report it crashes. A's fix #3 ("add `npx pug-lint src/pug/showcase.pug` to Task 19 Step 3") patches one task while leaving the repo-wide gate broken, and it would not cover `_generated.pug`.
- Task 19 Step 3 does not run pug-lint, but it *does* run `npm run lint:html` (line 1066), and that is already red from Task 16 Step 3 onward because the html-validate config is invalid (B12). So Task 19 does not pass its local checks; it fails locally for a different reason.

A's conclusion — that a defect escapes the task that owns it and violates the plan's "independently verifiable" claim (lines 71–72) — is right, and my B28 says the same. But the mechanism is "the lint stack is broken from installation" (B12/B13), not "one page slips through one task's verify". An implementer following A's fix list would still hit a red gate at Task 16.

### D3. A's F7 contains an assertion that measurement directly contradicts
In the same paragraph that predicts 320px overflow, A states the four nav items are "all ≥44px min-height". Measured: the first `.btn` in the DOM is the nav's `button.btn.btn--sm` Theme toggle (Task 16 line 833), and `.btn--sm` is `calc(var(--control-height) - var(--space-2))` (Task 9 line 497) — computed **35.04px** at the Playwright default viewport. So A asserted the floor is met, in a paragraph whose subject is the nav, while the floor violation sat one line away in the same markup, and the plan's `touch targets meet density floors` test fails for exactly that reason (B14/B27). A also missed that the test's `querySelector('.btn')` is order-dependent (B27) and would keep measuring the nav toggle even after the height is fixed.

A's overflow estimate (≈375px min-content) also overshoots by ~4× (measured `scrollWidth` 338 vs 320 → 18px). Direction right, magnitude wrong, and the smaller error masked the larger: the bigger failure was not the overflow but the floor.

### D4. A's F14 is its only explicitly **positive** verdict, and it is wrong three ways
A: "The inline `<style>` on spec.html is exempted from `no-inline-style` — scope the exemption to exactly `dist/spec.html` (already done, good)."

1. `no-inline-style` targets `style` **attributes**, not `<style>` elements. The hand-written `<style>` block in `head` (Task 18, lines 955–960) never needed an exemption.
2. The exemption key does not exist in html-validate 11's schema — measured `SchemaValidationError: Property overrides is not expected to be here`. The config does not exempt anything; it aborts every `lint:html` run (B12). "Already done, good" is the single worst-verified claim in either review.
3. What actually needed exempting was the 23 generated `style="--swatch:…#331800"` attributes from `gen-spec.mjs` (Task 17 line 910), which A does not mention — so A never reaches the finding (B19) that the fix belongs at the generator, not the linter.

I concede the mirror image on my side: my B12 rests on a schema claim I verified by execution, and A was right that the mechanism's *intent* was sound. Intent does not survive `additionalProperties: false`.

### D5. A's F5 is right in substance and understated in three places — and its remedy breaks Task 24
A writes "Task 20's verify only checks the mapping lines exist in probe output". Measured: it matches **zero** lines, because Tailwind v4 tree-shakes `@theme` keys no scanned utility uses, and no page uses Tailwind utilities. The step fails; it does not merely under-verify. A also missed the half of B15 that matters architecturally: the plan declares `@layer tokens, reset, base, components, utilities;` (Task 2 line 146) and never wraps a rule in a layer, so `pyrocarbon.css` is unlayered author CSS that beats Tailwind's layered utilities (measured `.btn.p-4` padding `7px 12px` — component wins). A's fix (probe with token definitions included, assert a utility resolves to a `var(--…)`-rooted value) still proves nothing without a consumer page that *uses* a utility, because unused keys never emit.

Worse, A's fix #6 offers "the build emits a tokens-only `dist/tokens.css` that `_tailwind-theme.css` documents as a required import". Task 24 Step 1 audits `dist/` against an exhaustive five-name list (line 1360) and Step 3 re-audits `dist/*.css` (line 1369) — a sixth artifact contradicts the plan's own definition of its output. The zero-new-artifact route is what I proposed: document that the track requires `dist/pyrocarbon.css` (or emit tokens as part of the existing CSS) and fix the comment.

### D6. A's F11 hedges against a risk that measurement retired, with a remedy that violates the plan
A's "several pins are version-ambitious… if any pin doesn't resolve, Task 1 Step 3 fails with no fallback guidance" is worth raising when nothing is executed; I checked the registry and executed `npm install`: all 12 pins resolve and install. So the flag is closed — except the `cross-env` dead weight, which A correctly identifies and which I share (B23). A's suggested remedy, "accept `^` ranges for the risky ones", contradicts Global Constraints line 22 ("Dependencies pinned exactly… no extras without a task that justifies them") and Task 1's whole determinism argument. The right plan-text change is a pre-flight `npm view` line or nothing; not caret ranges.

### D7. A's `aria-pressed="false"` nit is not a defect
A writes that boilerplate's hardcoded `aria-pressed="false"` (Task 16 line 833) is wrong for OS-dark users because "the correct pre-JS state is unknowable". It is not unknowable — it is specified: Review Focus #1 (line 30) and Task 4 make the document default **light with zero JS**, and `--surface-canvas` resolves from `:root` with no attribute. Before `pyrocarbon.js` runs, light is the true state, so `aria-pressed="false"` is correct. The residual is a one-frame flash for OS-dark users between parse and `defer` execution, which is a known and acceptable trade for the zero-JS promise — not a wrong ARIA state. Withdraw.

### D8. A's F13 under-ranks the drift it found
A's `--text-on-brand` / `--surface-brand` note ("not in the spec §4 Tier 2 list… fine, but note it") is filed LOW as documentation drift. Measured, that token is the worst AA failure in the plan: `--text-on-brand` (`--neutral-10`) on `--surface-brand` (`#ff7700`) in `.site-nav` (Task 12 line 630) is **2.49:1**. And it is one token used against two different backgrounds — `--surface-brand` in the nav and `--accent` (`#b34f00`) in `.btn` (Task 9 line 484), the latter passing at 4.87:1. A found the token that causes my B3's worst number and ranked it LOW because it looked like a docs issue. A better review would have asked what each consumer of a new token sits on.

### D9. On scores
I hold 5/10 on completeness and A's 7/10 is defensible only on a different rubric (authoring quality), but A's **Feasibility 8/10 is not defensible on any rubric**: it grades "the build pipeline (prebuild→vite→postbuild), layered token cascade, and toggle contracts are sound" while the plan cannot compile at Task 8 (`@use` path, B11), the layer statement is inert (B15c), and three of four `verify` stages are red (B11/B12/B13). A also calls the cascade "layered" and the token layer "sound" while its own F1 shows the token layer kills every focus ring. Execution is not the only way to find these — the `@use` path is checkable by eye from the File Structure table (lines 48 and 57) — so this is a completeness-of-review gap, not a method limitation.

---

## 3. What A caught that I missed

The list in §1b: the `;`-chained exit code (sixth weak verify step for B25), the `pages` contract mismatch (new LOW), the one-position `--elevation-strategy` (sharper than B9), the boilerplate-in-6-combos gap (DoD 4, strengthens B26), the itemized raw-value list for DoD 3, and the repo facts about `.gitignore`/`dist`. Two more:

- **A's F9(c) spec-§13.4 argument is better framed than my B21.** I bundled the ordering deviation with the `verify`/opt-in deviation; A separates "the plan reorders deliberately but never acknowledges the deviation" from the §12 scope narrowing, which is the more actionable framing because Task Right-Sizing (lines 71–75) is where the acknowledgment belongs.
- **A's F13 `--text-on-brand`/`--surface-brand` drift note is the seed of my B3's worst pair** (§2 D8). I measured the failure; A found the token that shouldn't exist. Neither of us connected them in the original reviews, and the combined statement is stronger than either.

## 3a. Residual gaps in both reviews

- `.btn--ghost:hover` is `color: var(--text-accent)` on `background: var(--accent-subtle)` (Task 9 lines 495–496) = `#b34f00` on `#ffddbf` ≈ **4.05:1** in light — a seventh AA failure on a Tier-1 component that appears in neither B3's list nor A's F4.
- `.btn:disabled` `opacity: 0.55` (Task 9 line 492) drops effective contrast below AA, but WCAG 1.4.3 exempts inactive components. Both reviews should say "exempt, document it" so no implementer burns a cycle on it.
- Neither review checked `@tailwindcss/vite`'s contribution to the build. I noted it as idle (B23); A never mentions it, and Task 15 installs it (line 775) into a build whose only stylesheet import never imports `tailwindcss`.

---

## 4. Does A's evidence change my confidence?

| My finding | Effect |
|---|---|
| B14 core (border collision) | **Confidence unchanged (measured), scope corrected by A**: A found it independently; but A's consequence ("medium ≈3px") is right for `border-width:` and wrong for `outline:`, and A lists three consumers where I list five (A missed `nav.scss`). Adopt A's phrasing for the longhand, keep mine for the shorthand. |
| B18 / B2 / B3 / B13-second-half | **Confidence up** — independent arithmetic and text agreement on four separate defects. |
| B3 contrast | **Scope up**: A's `--text-on-brand` drift note explains *why* the nav pair fails at 2.49 — the token should not exist. A's `#a34700` (≈5.4) and my `#994700` (5.47) are equivalent; the correct fix is token splitting, which neither of us proposed first but A's drift note points at. |
| B25 (weak verify steps) | **Five → six**, adding Task 7 Step 3's swallowed exit code. |
| B26 (coverage gaps) | **Add DoD 4's boilerplate-in-6-combos** via A's F9(d). |
| B9 (unconsumed tokens) | **Sharpen** on `--elevation-strategy` as a degenerate switch per A. |
| B12, B13 (first half), B11, B1, B15(c), B17, B19 | Unchanged — A could not have found these without executing (or, for B11, without checking path resolution rather than cascade correctness), which is the one methodological point worth recording for the orchestrator. |
| B31 dirty tree | A reports a clean tree at `master` where I measured `D STANDARDS_VERSION` + untracked `docs/`. I will not claim A is wrong — the two reviews are new untracked files under `docs/reviews/`, so the tree demonstrably changed between reads. B31 is LOW either way and does not affect any fix. |

The one place A's evidence moved me *against* my own artifact: A's independent arrival at "the Tailwind track is not self-contained" supports my minimal remedy (document the dependency on `dist/pyrocarbon.css`) over A's `dist/tokens.css`, because A's own F5 makes the same architectural point without needing a new artifact — and Task 24 Step 1 forbids one. I am adopting A's framing of the defect and keeping my framing of the fix.

---

## 5. Disposition of A's 9 auto-apply fixes

**Accept as written:** #1 (13 → 12; identical to my #2), #4 (anchored filter + third section; identical to my #10 plus the semantic/density section I owe), #5 (branch Step 0; identical to my #9), #8's width parametrization (320/768/1440 per spec §12 line 290 — I had this only inside B26).

**Accept with amendment:**
- #2 (`--border-width-strong` + consumers): accept, with the two corrections in §2 D1 — five consumers (add `nav.scss` line 636), and the verify must assert `outline-style: solid` post-fix, since the pre-fix value is `none`, not `medium`.
- #3 (Pug interpolation): accept the markup half verbatim. Reject the added `npx pug-lint src/pug/showcase.pug` line as the remedy for the gate — the script itself must be fixed (my #4), and the per-task line would not lint `_generated.pug`.
- #6 (Tailwind): accept the comment correction and the "state the dependency" half; reject `dist/tokens.css` (contradicts Task 24 Step 1's five-name audit) and add the `@layer` wiring I found, plus a probe that actually consumes a utility.
- #7 (contrast test + darken accent): accept the test, and A's option to "document the exception" should be struck — DoD 7 is unconditional in both themes (spec line 302), so there is no exception to document. Scope the test to all measured failing pairs, including the nav pair from A's own drift note.
- #9 (`font-family` allowed-list, drop `cross-env`, README wording): accept the first two. Reject the third's "or add enforcement" option for case-sensitivity: no rule in the pinned stylelint/pug-lint stack enforces import case, so the honest fix is to soften the README claim (and note spec §8 line 219 makes the same unenforceable promise).

**Reject:** #2's verify phrasing (§2 D1), #6's `dist/tokens.css` (§2 D5), #9's "add enforcement" (§5), and A's F13 `aria-pressed` nit as a defect at all (§2 D7).

**Scores:** I stand at Completeness 5 (A's 7 measures authoring quality; mine measures whether the plan can complete its own gate and DoD — both are true statements, and the orchestrator should reconcile them rather than average them). I accept A's Consistency 6 as slightly generous and A's Testability 6 as fair. I reject Feasibility 8/10 outright (§2 D9).

## 6. Bottom line

A's review is the better *written* review and my review is the better *verified* one; the union is what should be applied, and the union is roughly: my #1–#18 as amended in §5, plus A's Task 7 Step 3 exit code, Task 16 `pages`, `--elevation-strategy`, and boilerplate-combos items. A's three substantive errors are all in the same direction — describing a defect correctly and then registering its consequence too lightly (F1 → "3px", F3 → "one task later", F14 → "already done, good") — and F14 is the one I would most want corrected before these reviews are used, because it is the only line in either review that tells an implementer that something is fine.
