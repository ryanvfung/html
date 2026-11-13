# Code Review — docs/plans/20261108-pyrocarbon-v6-plan.md
**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md (branch diff cdc138e...feat/20261108-pyrocarbon-v6-plan)
**Source:** subagent

## Automated-check evidence (counts measured by this reviewer)

Ripple checks (grep over `v6/`, excluding `node_modules/`, `package-lock.json`, `dist/` unless noted):

| Check | Expected | Measured |
|---|---|---|
| `bootstrap\|jquery\|tether` references | 0 | **0** (also 0 inside `dist/` — spot-grep of a pattern known to hit dist confirmed the exclusion glob was live) |
| `!important` outside `src/styles/reset.scss` | 0 | **0** — all 4 occurrences are on `reset.scss:10` (reduced-motion block); no other file in `v6/src` |
| Raw `px` in `padding|margin|gap|font-size` declarations (incl. `-top/right/bottom/left/x/y/block/inline…` forms) | 0 | **0** |
| Raw hex in `v6/src/styles/**` | only `_spec-generated.scss` | **23 occurrences, 100% in `_spec-generated.scss`** (lint-exempt, generated) — 0 in reset/base/spec/components/index |
| Imports of `/5.2/` | 0 | **0** — only prose mentions in `README.md:27` ("`/5.2/` retained"); no `@use`/`@import`/`url()` reference in any source |
| `.gitignore` for `v6/test-results/` | — | **MISSING** — no `v6/.gitignore` exists; root `.gitignore` line 3 covers only `node_modules`; `v6/test-results/` is present, untracked, and unignored (`git status --short` → `?? test-results/`) |

Additional verification performed directly by this reviewer (not re-running the orchestrator's suite):

- **Generated-artifact fidelity:** ran `gen-spec.mjs` logic in the session scratchpad against a byte-exact copy of the committed `v6/src/tokens/_tokens.scss`; output is **byte-identical (`fc /b`) to committed `v6/src/pug/_generated.pug` and `v6/src/styles/_spec-generated.scss`**. Stdout: `gen-spec: 94 tokens; overlay=rgba(22,20,19,0.55)` (matches orchestrator evidence). The committed generated files are current with sources.
- **`dist/` spot checks:** exactly 5 files (`boilerplate.html`, `pyrocarbon.css`, `pyrocarbon.js`, `showcase.html`, `spec.html`); `pyrocarbon.css` 12,876 bytes (12.87 kB), begins `@layer theme;@layer tokens{…}`, contains `.sw-22`, `.combo`, `[data-theme=dark]`, `.btn`; `pyrocarbon.js` 1,383 bytes (1.38 kB), contains `pc-theme` and `matchMedia`; `dist/spec.html`: `data-theme=` ×**6**, `data-density=` ×**6**, `style="` ×**0**, `<style` ×**0**; `dist/boilerplate.html` contains skip link, `pyrocarbon.css` link, `pyrocarbon.js` script. Matches Task 18/24 expectations.
- **Legacy untouched:** `git diff --name-only master...HEAD -- 5.2` → empty; 0 commits touch `5.2` (DoD 14).
- **Commit format:** `git log` shows every commit as `<verb>: <summary> — docs/plans/20261108-pyrocarbon-v6-plan.md` (Global Constraint honored).

## Review scope, method, and assumptions

- Reviewed the full committed diff `git diff cdc138e...HEAD -- v6 ":(exclude)v6/package-lock.json" ":(exclude)v6/dist"` (29 new files, 1,048 insertions; captured to file and read in full), the complete plan (1,544 lines), the prior review (`docs/reviews/20261113-pyrocarbon-v6-plan-code-review.md`), and directly read `dist/pyrocarbon.css`, `dist/*.html`, `_generated.pug`, `_spec-generated.scss` rather than trusting shell-rendered diffs.
- Method: task-by-task comparison of diff against plan snippets; grep ripple sweeps; scratchpad re-run of the generator with byte comparison; control-character scan of all 29 new files; targeted correctness reasoning on the JS, the generator, and the Playwright suite. No source files were modified.
- **Assumptions (no prior session context):**
  1. Orchestrator-reported results (`npm run verify` exit 0; Playwright 22/22 in 7.9s; stylelint/html-validate/pug-lint clean; vite build OK) are taken as reported and were **not** re-run.
  2. "Fresh `npm run build` left the worktree clean" is corroborated by my byte-identical regeneration of both generated files and by `git status` showing only `?? test-results/`.
  3. The three known deviations (`calc()` visually-hidden margin, `_tailwind-theme.css` comment wording, component-local `em`/`rem` geometry in `code.scss`/`forms.scss`) are accepted per the review brief and are not re-raised as findings.
  4. Node 24.15.0 is the runtime (per plan assumptions) — `import.meta.dirname` in `vite.config.ts`, the build scripts, and `gen-spec.mjs` requires Node ≥ 20.11; fine here, would break on older Node.

## Findings

1. **[MEDIUM confidence] Playwright artifacts are untracked and unignored** — `v6/test-results/` exists in the worktree (`git status` → `?? test-results/`) and there is no `v6/.gitignore` (root `.gitignore` covers only `node_modules`); any failed Playwright run also writes `playwright-report/`, so local failures will repeatedly pollute `git status` and invite accidental commits of binary traces. The plan never tasks a `.gitignore` (Task 1 creates only `package.json`/`.gitattributes`), so this is a plan omission surfaced by the diff, not an implementation deviation. *Fix: add `v6/.gitignore` containing `test-results/` and `playwright-report/`.* (Verification scope: `git check-ignore -v`, `git status --short`, directory listing — measured above.)

2. **[LOW confidence] The "all six combos" test under-asserts the density axis** — `v6/test/spec.spec.ts:1157-1174` ("boilerplate renders in all six theme/density combos") asserts only light≠dark background plus `dataset.theme`/`dataset.density` round-trips — attributes the test itself just wrote, so 4 of 6 iterations verify nothing computed (density backgrounds are identical by design). The matrix is de-facto covered elsewhere (`density toggle changes control height`, `touch targets meet density floors`), but the named test is weaker than its title and than Review Focus item 6's intent. Plan-faithful: the plan's Task 21 test does exactly this. *Fix: inside the loop, also assert `getComputedStyle(main .btn).minHeight` differs per density.*

3. **[LOW confidence] `gen-spec.mjs` parser is comment-blind** — `v6/scripts/gen-spec.mjs:9` matches `(--[a-z0-9-]+):\s*([^;]+);` over the whole file including `/* */` comments; a future comment like `/* --accent: #b34f00; was… */` would emit a phantom token row and a phantom `.sw-N` class into two committed generated files. Currently safe (no comment contains `--name:`; verified). *Fix: strip comments (`source.replace(/\/\*[\s\S]*?\*\//g, '')`) before matching.*

4. **[LOW confidence] Spec page token table shows only light values** — the dedupe in `v6/scripts/gen-spec.mjs:10-11` keeps the first occurrence, so the "Semantic and density tokens" section of the six-combo "visual truth" page always displays the light-theme value (e.g. `--surface-canvas → var(--neutral-9)`, `--accent → #b34f00`); the 19 semantic tokens re-declared in the dark block never show their dark values anywhere (`gen-spec` output verified). Plan-faithful — Task 17 defines exactly this behavior — so this is a design limitation to record, not a deviation. *Fix (future plan): list per-theme values or label the section "(light theme values)".*

5. **[LOW confidence] Nav toggle wiring ignores its own `aria-controls` pairing** — `v6/src/js/pyrocarbon.js:31-32` binds `document.querySelector('[data-nav-toggle]')` and the first `.site-nav__list` globally, while the markup (`boilerplate.pug:13`, `showcase.pug:14`) already emits `aria-controls="site-nav-list"` / `"showcase-nav"`. All three pages have exactly one nav so behavior is correct today; a page with two navs would leave the second toggle dead. *Fix: iterate `querySelectorAll('[data-nav-toggle]')` and resolve each list via `aria-controls`.*

6. **[LOW confidence] Dark-OS first visit paints light, then flips (FOUC)** — with JS enabled, empty storage, and `prefers-color-scheme: dark`, `pyrocarbon.js:24` applies `data-theme="dark"` only when the deferred module runs, so first paint is light and then snaps dark. This is the direct consequence of the accepted "zero-JS renders light" decision (Review Focus item 1) and of keeping the application logic out of inline scripts; recording as a known edge, not a defect. *Fix: none needed for v6; document the behavior in `DESIGN.md` if it ever matters.*

7. **[LOW confidence] No typecheck exists for the two TypeScript configs** — `vite.config.ts` and `playwright.config.ts` are TS but the project has no `tsconfig.json` and no `tsc` invocation (verified by directory listing and `package.json` scripts); Vite uses esbuild and Playwright transpiles its own config, so type errors in these files can never fail any gate. Stated per the review contract. *Fix (optional): add a minimal `tsconfig.json` + `tsc --noEmit` step, or accept and document.*

8. **[LOW confidence] `index.scss` import style inconsistency (plan-dictated)** — `v6/src/styles/index.scss:10` is the only `@use` with an explicit `.scss` extension (`'./spec.scss'` vs the nine extension-less siblings). The plan's Task 18 specifies `@use './spec.scss';` verbatim, so the implementation is faithful; flagging purely as a consistency note for future plans. *Fix: drop the extension in a later pass.*

9. **[LOW confidence] `forms.scss` is the only new file without a trailing newline** — measured across all 29 new files; `v6/src/styles/components/forms.scss` ends without `\n`. Purely cosmetic; the `.gitattributes` LF policy is unaffected. *Fix: add a final newline.*

10. **[LOW confidence] `nav.scss` indentation diverges from sibling component files** — `v6/src/styles/components/nav.scss` indents two spaces inside `@layer components` while button/forms/code/footer/spec use zero indentation. The plan's own Task 12 snippet is indented, so this is plan-faithful; stylelint does not enforce formatting here. *Fix: normalize in a follow-up cosmetics pass.*

11. **[LOW confidence] AA contrast helper is format-fragile** — `v6/test/spec.spec.ts:1177` (`parse`) assumes `rgb(r, g, b)` numeric triplets and first-match element selectors; a future migration to `color(srgb …)` or non-sRGB computed values would silently mis-parse, and `check('code','code')`-style selectors depend on DOM order. All seven checked pairs currently resolve to plain `rgb()` triplets and the test passes (orchestrator evidence). *Fix: assert the computed value matches `/^rgb\(/` before parsing, or pin selectors to elements inside `main`.*

No HIGH-confidence findings. No correctness, security, or performance defect was found in the shipped code: the runtime JS writes only `textContent`/`dataset` (no HTML injection sink), stored `localStorage` values flow only into `dataset` attributes (self-XSS at worst, same-origin), Pug renders build-time static content with `=` escaping, `gen-spec` stringifies values through `JSON.stringify` so a hostile token value cannot escape the emitted Pug string literal, and all build work is bounded by the committed sources.

## Spec fidelity

**Outcome: pass.** The diff implements Tasks 1–24 faithfully and nothing beyond them:

- **Tokens (Tasks 2–5):** `_tokens.scss` matches the plan's snippets content-for-content — primitives, fluid type/space scales, `:root, [data-theme="light"]` + `[data-theme="dark"]` semantic blocks, and the three density blocks, with the `--border-width-strong` collision rename as planned. Density blocks re-declare no colors or primitives (orthogonality constraint holds).
- **Lint stack (Task 6):** `.stylelintrc.mjs`/`.htmlvalidate.json`/`.pug-lintrc.json` match verbatim, including the `_spec-generated.scss` hex override that sanctions the 23 generated hex values.
- **Reset/base/components (Tasks 7–13):** all match; the only base-level change is the accepted `calc(var(--border-hairline) * -1)` visually-hidden margin.
- **Runtime (Task 14), build (Tasks 15–17), pages (Tasks 16, 18, 19), Tailwind track (Task 20):** verbatim, with only the accepted `_tailwind-theme.css` comment wording difference; `build-pages.mjs` pages array reaches `['boilerplate', 'spec', 'showcase']` cumulatively as planned; `index.scss` `@use` order matches the cumulative task order.
- **Tests (Task 21), docs (Tasks 22–23), gate (Task 24):** config and suite match the plan; `DESIGN.md`/`README.md` match; `dist/` regenerated and byte-consistent (generated sources verified byte-identical; dist spot checks above all meet Task 18/24 expected counts).
- **Global Constraints:** all verified — no bootstrap/jquery/tether (0), no `!important` outside `reset.scss` (0), no raw px in the disallowed properties (0), no hex outside `_tokens.scss` + the sanctioned generated file (0), no `/5.2/` imports (0), `dist/` tracked and not hand-edited (regenerates identical), work confined to `v6/` plus plan/review docs, commit format honored, `.gitattributes` present.
- **Review Focus items:** (1) zero-JS default light — pinned by the `zero-JS default` test (JS-disabled context asserts no `data-theme` and `rgb(236, 234, 233)`); (2) comma/`clamp()` capture — pinned by the `overlay.value.includes(',')` assertion in `gen-spec.mjs:12-13` plus full `clamp()` values verified in regenerated output; (3) density/color orthogonality — structural in `_tokens.scss` (verified by reading) and by the single-occurrence check in the generator's input; (4) 320px overflow — `no horizontal scroll` tests at 320/768/1440 × 3 pages, including showcase's deliberately unbreakable token string; (5) throwing storage — both accessors wrapped in try/catch (`pyrocarbon.js:5-6`) and the test stubs throwing `Storage.prototype`; (6) combo leak — `.combo` re-scopes `--surface-canvas`/`--text-primary` (`spec.scss`) with attributes on the wrapper, tested at spec.html (weakness noted in Finding 2 re: adjacency).
- **Scope:** nothing out of scope observed; deferred components (alerts, cards, tables, badges, breadcrumbs, pagination) are correctly absent.

## Text integrity

Read directly (not from shell-rendered diffs): **no stray control characters, no U+FFFD/replacement chars, no mojibake, and no corrupted references** in any of the 29 new files (programmatic scan for C0/C1 controls, DEL, U+FFFD across all 29 files → 0 suspects). The only non-ASCII characters are intentional and correctly encoded: `—` (em-dash, incl. the generated "— do not edit." headers, which `gen-spec.mjs` itself emits), `·` (`README.md` structure line), and `…` (`DESIGN.md` `hsl(0 0% …)` example). `forms.scss` lacks a trailing newline (Finding 9). No broken cross-references found (README commands match `package.json` scripts; DESIGN/README class and token names match shipped CSS).

## Prior findings status

All three prior LOW findings (docs/reviews/20261113-pyrocarbon-v6-plan-code-review.md) remain **unfixed and still valid**; I add mechanism corrections and plan-fidelity context:

1. **Theme toggle announced state — agree in substance, refine the mechanism claim.** `aria-pressed` *is* the announced state (a screen reader announces "Theme, pressed/unpressed"), so "no announced state" overstates it; the real, still-valid gap is that the accessible/visible name stays static `"Theme"` so users cannot learn *which* theme is active, and the control is asymmetric with the density control's label + `aria-label` + live-region treatment. Plan-faithful: Tasks 14/16 specify exactly this markup and behavior.
2. **Spec combo inputs lack `.form-group` — agree.** `spec.pug:23-24` (label + input as direct `.combo` children) diverges from the `forms.scss` `.form-group` pattern used in `showcase.pug:37-41`; also note the combo inputs carry no `name` attribute. Plan-faithful: Task 18's own markup omits the wrapper.
3. **spec.pug omits skip link/header/footer chrome — agree, with the same split as the prior review.** Task 18 defines the chromeless page, so the implementation is faithful; the gap is in the plan. The documentation half of the prior suggestion (record the inspection-only role in README/DESIGN) remains the right minimal fix.

**Completeness score: 8/10** — every planned task is implemented and verifiably current (generated artifacts and dist byte-check clean), with zero correctness/security defects found; the score is held at 8 rather than higher by the missing test-artifact ignore (Finding 1), the under-asserting six-combo test (Finding 2), and the generator robustness/dark-value display limitations (Findings 3–4), all of which are cheap, well-scoped follow-ups.
