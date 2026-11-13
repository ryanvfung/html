# Code Review — docs/plans/20261108-pyrocarbon-v6-plan.md
**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent

## Summary

The branch (32 commits, `origin/master...HEAD`, 45 files, 7,523 insertions) implements all 24 plan tasks: a three-tier token source in `v6/src/tokens/_tokens.scss`, the lint stack, reset/base and five component stylesheets, the cascade entry, `pyrocarbon.js` runtime toggles, the Vite build with `prebuild`/`postbuild`, the `gen-spec.mjs` parser plus its generated Pug/SCSS artifacts, the three Pug pages, the Tailwind `@theme` track, a 26-test Playwright suite, `DESIGN.md`/`README.md`, and the committed `dist/`.

Quality is high: no injection sink exists in shipped runtime code (only `textContent`/`dataset` writes), every generated artifact is reproducible, the constraint sweeps are clean, and the previously reported findings from the two earlier review passes are fixed **and now pinned by tests**. I found **no HIGH-severity damage**, but three defects worth fixing before this ships as the v6 reference:

1. the documented "set `data-theme`/`data-density` on `<html>`" standalone contract is **silently overwritten by the script on load** (measured);
2. `--text-tertiary` code line numbers / CLI prompts sit at **4.24:1 in the light theme** (below the AA 4.5 floor the project claims to ship), and the AA test does not look at them;
3. all three pages render with **no page gutter**: content is flush to x=0 while the nav is inset by 18px, and the centered footer is off-center by ~440px.

Note on artifact identity: this file path already held the pass-1 review, and `…-code-review-2.md` holds pass 2. Per the explicit instruction for this run the path is reused, so pass 1 has been superseded — its three findings and their resolution are preserved in "Prior findings status" below.

## Automated checks

Reported by the main session, then independently re-checked by me below: `npm run build` pass · `lint:ts` pass · `lint:css` pass · `lint:html` pass · `lint:pug` pass · `npm test` 26/26 pass.

Re-run first-hand by this reviewer, all from `v6/`:

| Check | Command | Result |
|---|---|---|
| Full lint chain | `npm run lint` | **pass** (ts → css → html → pug, no output, exit 0) |
| Test suite | `npm test` | **26 passed (5.8s)** |
| Generated artifacts current | re-ran `gen-spec.mjs` against a copy of `_tokens.scss` in the scratchpad | **byte-identical** to committed `_generated.pug` and `_spec-generated.scss` (`gen-spec: 94 tokens; overlay=rgba(22,20,19,0.55)`) |
| `dist/` current, not hand-edited | `npx vite build --outDir <scratch>` | `pyrocarbon.css` and `pyrocarbon.js` **byte-identical** to committed |
| Pages current | re-rendered all three pages with `pug.renderFile` into scratchpad | `boilerplate.html`, `spec.html`, `showcase.html` **byte-identical** |
| Tree clean after gates | `git status --short` | clean (26 tests rewrite `_generated.pug`; content identical) |
| Tailwind track (DoD 10) | `npx @tailwindcss/cli -i src/tokens/_tailwind-theme.css` | **resolves**: `--color-surface-canvas: var(--surface-canvas)`, `--spacing-4: var(--space-4)`, `.bg-surface-canvas`, `.p-4` all emitted |

Constraint sweeps I measured myself over all 31 non-generated files under `v6/` (excluding `node_modules`, `dist`, `package-lock.json`): raw hex appears only in `_tokens.scss` (36) and the lint-exempt `_spec-generated.scss` (23); **0** raw `px` in `padding|margin|gap|font-size` (incl. `-block/-inline` forms); **0** `!important` outside `reset.scss`; **0** `/5.2/` imports (one prose mention, `README.md:27`); **0** `bootstrap|jquery|tether`; **0** files touched outside `v6/` and `docs/`; **32/32** commit subjects carry the mandated ` — docs/plans/20261108-pyrocarbon-v6-plan.md` trailer.

## Spec axis outcome

**findings (minor).** All 24 tasks are present and behave as the plan describes; nothing in the deferred set (alerts, cards, tables, badges, breadcrumbs, pagination, WCAG audit, visual regression) leaked in. The findings are deviations from the plan *text* that were never written back into the plan:

- `package.json:21-34` adds `typescript` 7.0.2 and `@types/node` 24.19.2 (12 devDependencies) plus `"lint:ts"` (`package.json:13`). Global Constraints say "Dependencies pinned exactly as listed in Task 1; no extras without a task that justifies them", and Task 1 Step 4 asserts `10` — the plan's own verification step is now false.
- `v6/.gitignore`, `v6/tsconfig.json`, the `--phantom-token` regression trap (`_tokens.scss:12`), the `spec.pug` `.form-group`/`name` wrapper, the `Theme: Light|Dark` toggle name, and the `(light theme values)` section heading are all post-hoc review fixes with no corresponding plan step.
- Consequence: a future implementer following the plan verbatim produces a different (worse) result than the merged branch. The plan should be amended in the same feature, not left drifting.

## Findings

### HIGH confidence

1. **Author-set `data-theme` / `data-density` on `<html>` are silently overwritten on load** — `v6/src/js/pyrocarbon.js:25-26` seeds from `localStorage` or `prefers-color-scheme` only and never reads the attribute already present, while `v6/README.md:21` ("Standalone use") tells consumers to "set `data-theme` and `data-density` on `<html>`". Measured: a copy of `boilerplate.html` with `<html data-theme="dark" data-density="compact">` loads as `theme=light`, `density=default`, `body` background `rgb(236, 234, 233)`, button 44px — both author choices discarded, and no test covers the documented path.
   *Fix:* seed with `root.dataset.theme || storage.get('pc-theme') || (darkQuery.matches ? 'dark' : 'light')` (same shape for density) and add a Playwright test that loads a page with the attributes pre-set.

2. **`--text-tertiary` on `--surface-sunken` is 4.24:1 in the light theme, below the AA floor the project claims** — `v6/src/styles/components/code.scss:9` paints code line numbers (and `:9`-adjacent `.o-cli-block::before` / `.o-cmd-block::before` prompts) with `--text-tertiary` over `pre`'s `--surface-sunken`; measured computed colours `rgb(105,96,89)` on `rgb(217,214,211)` = **4.24:1** (dark theme is 4.96:1). `v6/DESIGN.md:31` claims "AA contrast" ships in Phase 1, and the AA test (`v6/test/spec.spec.ts:119`) checks seven element pairs but no pseudo-elements, so nothing catches it.
   *Fix:* use `--text-secondary` (or a darker tertiary) for those glyphs, and extend the contrast test to `getComputedStyle(el, '::before').color`.

### MEDIUM confidence

3. **No page gutter: content is flush to the viewport edge and misaligned with the nav** — no `main`/container rule exists in `v6/src/styles/base.scss` or any component, and `boilerplate.pug:21`, `showcase.pug:20`, `spec.pug:10` render `main#main` with no wrapper. Measured at 1440px: `.site-nav` `padding-inline` = 18px with the brand link at x=18, while `main h1`/`h2` boxes are x=0, width 1440; at 320px `.combo` is x=0, width 320. The plan produced this, but for a page whose README billing is "a dependency-free starting point" and whose spec page is "the visual truth" it reads as unfinished.
   *Fix:* add `main { padding-inline: var(--space-4); }` (or a `.container` class) in `base.scss`.

4. **The centered footer is not centered** — `v6/src/styles/components/footer.scss:2-3` sets `text-align: center`, but `base.scss:7` caps every `p` at `max-width: var(--measure-body)` with no auto margins, so the paragraph box hugs the left edge. Measured at 1440px: footer 1440px wide at x=0, `p` box 561px at x=0 → glyph centre ≈280px instead of 720px.
   *Fix:* `.c-footer p { margin-inline: auto; }`.

5. **Nothing asserts that `dist/` and the generated artifacts are current** — `v6/test/spec.spec.ts:202-207` regenerates the token sections and asserts only "94 tokens" plus the absence of `phantom-token`; `dist/*.css`, `dist/*.js` and the three HTML pages are never compared with a build, and `npm run verify` re-builds before testing, so a stale committed `dist/` would still go green (I proved freshness only by hand: byte-identical rebuild of both assets and all three pages).
   *Fix:* add a post-build `git diff --exit-code -- dist src/pug/_generated.pug src/styles/_spec-generated.scss` step to `verify`.

6. **A browser test shells out and mutates tracked sources** — `v6/test/spec.spec.ts:202-207` runs `execSync('node scripts/gen-spec.mjs')` and then reads `src/pug/_generated.pug` by cwd-relative path. It rewrites two tracked files on every `npm test`; if generation ever drifted, the test would "repair" the files and still pass while the CSS served under test was the stale `dist/`. It also couples the e2e suite to `node` on `PATH` and to being launched from `v6/`.
   *Fix:* move it to a `node:test` unit test that runs the parser against a fixture string, or compare-then-restore.

7. **The token count is hardcoded in an unrelated assertion** — `v6/test/spec.spec.ts:204` `expect(out).toContain('94 tokens')`. Adding one token fails a test named "gen-spec ignores commented-out tokens" with a message that points nowhere.
   *Fix:* assert `/^\s*gen-spec: \d+ tokens/m` or diff against a regenerated copy.

8. **The Tailwind track is in no script and no test, so DoD 10 is unverified by the gate** — `_tailwind-theme.css` is not imported by the Vite build and `@tailwindcss/cli`/`tailwindcss` are never invoked by any npm script (`package.json:6-18`). It only works because of the manual probe in plan Task 20 Step 2; I re-ran that probe successfully, but nothing in `npm run verify` would notice if the mapping broke.
   *Fix:* add `"build:tailwind": "tailwindcss -i src/tokens/_tailwind-theme.css -o dist/tailwind.css"` to `verify`, or record it as manual-only in the README.

9. **`src/js/pyrocarbon.js` sits outside every static gate** — `v6/tsconfig.json:13` includes only the two configs and `test/**/*.ts`; there is no eslint config; `node --check` appears only as a plan step. The only checking of the 41-line runtime file is the behavioural Playwright suite.
   *Fix:* add `"allowJs": true, "checkJs": true` plus `src/js/**/*.js` to the tsconfig `include`.

10. **`gen-spec.mjs` interpolates token values into Sass source unescaped** — `v6/scripts/gen-spec.mjs:19` emits `.sw-${i} { --swatch: ${t.value}; }`. The Pug half is safe (`JSON.stringify` at `:14-15`), but a token value containing `;` or `}` produces silently broken CSS (or injected rules). Both sides are repo-controlled build-time inputs, so no runtime trust boundary is crossed — this is a robustness gap, not an exploit.
    *Fix:* validate values against `/^[#a-zA-Z0-9(),.%\s-]+$/` before interpolating, and fail the build otherwise.

11. **`spec.html` ships a build banner ahead of the doctype** — `gen-spec.mjs:20` emits the header as a buffered Pug comment and `spec.pug:1` includes the mixin file before `doctype html`, so `v6/dist/spec.html` begins `<!-- AUTO-GENERATED by scripts/gen-spec.mjs — do not edit.--><!DOCTYPE html>`. Standards mode survives (measured `document.compatMode === 'CSS1Compat'` on all three pages), but the doctype is no longer the first token and every published spec page carries a generator banner.
    *Fix:* emit `//-` (unbuffered) as the first line of the generated Pug.

12. **The plan's progress markers contradict its own tracking convention** — the plan still has 89 `- [ ]` and 0 `- [x]` checkboxes while 24 `<!-- section:N complete -->` markers record completion. A reader (or a fresh agent resuming the plan) cannot tell finished work from pending.
    *Fix:* tick the step boxes, or delete the checkbox convention in favour of the section markers.

### LOW confidence

13. **`--phantom-token` test fixture lives in the production token source** — `v6/src/tokens/_tokens.scss:12` is a `//` comment containing `--phantom-token: #123456;` so that `gen-spec` can prove it strips comments. Shipped design-token sources should not carry trap data; any comment-blind consumer (I hit this with my own scan) sees a 96th token.
    *Fix:* move the trap into a fixture file consumed by a parser unit test.
14. **Persisted values are never validated** — `pyrocarbon.js:25-26` writes whatever `localStorage` holds straight into `dataset`; an unknown value (e.g. `pc-theme=blue`) matches no CSS block (falls back to `:root` light) and `applyDensity` prints the raw string as a label (`:16`).
    *Fix:* coerce to `['light','dark']` / `densityOrder` with a default.
15. **A mis-typed `aria-controls` kills the nav toggle silently** — `pyrocarbon.js:32-35` returns early with no fallback and no warning; nothing in the lint stack validates that `aria-controls` points at a real id.
    *Fix:* fall back to the nearest `.site-nav__list` and warn once in dev.
16. **Tokens and classes that no page ever renders** — `--elevation-strategy` is declared (`_tokens.scss:56,72`) and promised by `DESIGN.md:18` ("one elevation strategy per component class") but no rule reads it; `--shadow-card`, `--text-inverse`, `--surface-overlay` are equally unread; `.btn--ghost`, `.btn--sm`, `.o-cli-block`, `.o-cmd-block`, `.syntax-string|comment|keyword` are shipped but appear on none of the three pages, so DoD 5's "Tier-1 component states rendered by the three pages" is only partly met.
    *Fix:* exercise them on `showcase.pug`, or drop the unused ones from the shipped surface.
17. **Swatch classes are index-keyed** — `gen-spec.mjs:14,19` map tokens to `.sw-0…sw-22`; inserting one colour token renumbers every swatch in two generated files, making diffs unreadable.
    *Fix:* key by token name (`.sw-orange-0`).
18. **The AA test's selector list is hand-maintained** — `test/spec.spec.ts:119-150` covers 7 pairs and no pseudo-elements; `small` (`--text-secondary`), `.form-error` and the code line numbers are outside it (the last one is Finding 2).
    *Fix:* derive the pair list from the token roles and include `::before` colours.
19. **Dark-OS first visit repaints** — with JS enabled, empty storage and `prefers-color-scheme: dark`, the page paints light then flips (`pyrocarbon.js:25` runs after the deferred bundle loads). Now documented in `DESIGN.md:9`; recording it as a known, accepted trade-off of the zero-JS-light decision, not a defect.

**No HIGH-severity correctness or security defect was found**: the runtime writes only `textContent`/`dataset`, Pug renders build-time static content through `=` escaping, `JSON.stringify` protects every generated Pug string, and the only unescaped path (Finding 10) takes input from a repo file, not from user data. Performance is not a concern (12.87 kB CSS, 1.56 kB JS, all toggles are O(2) DOM writes).

## Verification scope

Every "verified / green / covered" claim and the assertion that actually carries it:

| Claim | Covering evidence | Status |
|---|---|---|
| Build passes (`prebuild` → `vite build` → `postbuild`) | report + my scratch-outDir rebuild, byte-identical to `dist/` | covered |
| `dist/` and generated files are current | no assertion in the suite; established only by my manual rebuild/diff | **not covered** (Finding 5) |
| Lint stack passes | `npm run lint` (re-run, clean) | covered |
| 26 tests pass | `npm test` (re-run, 26 passed) | covered |
| "AA contrast" (DESIGN.md:31) | 7 selector pairs in `spec.spec.ts:119`; measured failure for `--text-tertiary` | **partially covered** (Finding 2) |
| Zero-JS renders light | `zero-JS default renders light with no theme attribute` (`spec.spec.ts:86`) | covered |
| Storage throwing does not break toggles | `toggles work when storage throws` (`spec.spec.ts:76`) — theme only; density path unasserted | partially covered |
| No horizontal scroll at 320/768/1440 | 9 tests generated at `spec.spec.ts:10` | covered |
| All six theme×density combos | `boilerplate renders in all six theme/density combos` (`spec.spec.ts:95`) now asserts per-density control height | covered |
| Theme/density controls expose current value | `theme control exposes the current value` (`:152`), `density control exposes the current value` (`:43`) | covered |
| Nav toggles are per-list | `each nav toggle controls only its own list` (`:175`) | covered |
| `gen-spec` ignores comment tokens | `gen-spec ignores commented-out tokens` (`:202`) | covered |
| Tailwind track resolves (DoD 10) | no test; I verified by hand with `@tailwindcss/cli` | **not covered in the gate** (Finding 8) |
| Standalone attribute contract (README.md:21) | no assertion; measured broken | **not covered** (Finding 1) |
| No bootstrap/jquery/tether (DoD 9), `/5.2/` untouched (DoD 14), commit format | plan's manual greps only; I verified each by hand (0 / 0 / 32 of 32) | not covered in the gate |
| `pyrocarbon.js` is type/lint clean | no gate applies to it at all | **not covered** (Finding 9) |

## Text integrity

Direct reads (not shell-rendered diffs) of all 31 `v6/` files and the 8 changed `docs/` files: **no control characters (C0/C1, DEL, U+FFFD, zero-width or BOM), no mojibake, no corrupted references**. Non-ASCII characters are intentional and consistent (`—`, `·`, `…`, `→`, `≈`, `≠`). All 31 `v6/` files end with a newline (the pass-2 complaint about `forms.scss` is fixed). `git ls-files --eol` reports `i/lf` for every changed file, so the CRLF working-tree copies of `docs/plans/*` and the `20261112-*` review files are an autocrlf artifact, not repo state — not a finding.

## Prior findings status

From pass 1 (`…-code-review.md`, superseded by this file): theme toggle text/`aria-pressed` — **fixed** in `pyrocarbon.js:13` and pinned by `spec.spec.ts:152`; spec combo fields lacking `.form-group`/`name` — **fixed** in `spec.pug:23-25` and pinned by `spec.spec.ts:165`; spec page chrome/role — **fixed** by documenting the inspection-only role in `README.md:6`.

From pass 2 (`…-code-review-2.md`): missing `test-results/` ignore — **fixed** by `v6/.gitignore`; the six-combo test under-asserting density — **fixed** by the per-density `controlHeights` assertion at `spec.spec.ts:95`; comment-blind parser — **fixed** by the strip at `gen-spec.mjs:5` plus the `phantom-token` test; light-only token table — **fixed** by the "(light theme values)" heading at `gen-spec.mjs:20`; nav toggle ignoring `aria-controls` — **fixed** at `pyrocarbon.js:31-41` and pinned by `spec.spec.ts:175`; no typecheck for the TS configs — **fixed** by `tsconfig.json` + `lint:ts`; `index.scss` `.scss` extension — **fixed**; `forms.scss` missing newline — **fixed**; `nav.scss` indentation — **fixed**; AA helper format-fragility — **partially fixed** (the `^rgb\(` guard at `spec.spec.ts:121` is in; the coverage gap remains, Finding 18).

## Completeness score

**7/10.** Task coverage is complete and provably reproducible (every generated artifact and all five `dist/` files rebuild byte-identically), the constraint contract holds, and the two earlier review passes were genuinely closed out with tests. The score is held at 7 by one functional bug in the documented consumption contract (Finding 1), one measurable AA miss on a claimed attribute (Finding 2), two visible layout defects on the "visual truth" pages (Findings 3-4), and the fact that neither `dist/` freshness, the Tailwind track, nor `pyrocarbon.js` is inside any automated gate (Findings 5, 8, 9).
