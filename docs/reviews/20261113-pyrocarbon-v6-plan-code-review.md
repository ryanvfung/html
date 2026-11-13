# Code Review — docs/plans/20261108-pyrocarbon-v6-plan.md
**Target:** docs/plans/20261108-pyrocarbon-v6-plan.md
**Source:** subagent

## Automated-check evidence (provided by orchestrator)
- `npm run verify` in `v6/` → exit 0: `vite build` ok, `stylelint` ok, `html-validate` ok, `pug-lint` ok, Playwright 22/22 passed.
- Ripple sweep: 0 `bootstrap`/`jquery`/`tether` refs; 0 `/5.2` imports; 0 `!important` outside `reset.scss`; 0 raw `px` in `padding`/`margin`/`gap`/`font-size`; all 23 raw hex values live only in the lint-exempt generated `src/styles/_spec-generated.scss`.

## Review scope, method, and assumptions
- Reviewed: `git diff --stat master...HEAD` and `git diff --unified=5 master...HEAD -- v6/src v6/scripts v6/test v6/vite.config.ts v6/package.json v6/.stylelintrc.mjs v6/.htmlvalidate.json v6/.pug-lintrc.json v6/.gitattributes v6/DESIGN.md v6/README.md v6/playwright.config.ts ":(exclude)v6/dist" ":(exclude)v6/package-lock.json"` (29 added source/config/doc files, ~1053 insertions excluding generated dist/lockfile); spot-read key sources (`_tokens.scss`, `base.scss`, `pyrocarbon.js`, `gen-spec.mjs`, Pug pages, tests, scripts, package/config).
- Not reviewed (generated/excluded by instruction): `v6/dist/*`, `v6/package-lock.json`.
- Spec checked against: `docs/plans/20261108-pyrocarbon-v6-plan.md` (Tasks 1–24, Global Constraints, Review Focus, known justified deviations).
- **Assumptions (no full session context):** (1) Playwright 22/22 and the ripple-sweep counts above are taken as reported (I did not re-run them). (2) I did not execute runtime/browser checks; verification claims below reference orchestrator-reported commands/tests or static diff evidence. (3) Captured `git diff`/shell log excerpts showed some mojibake in this review environment, but direct `read_file` of source/docs showed intact UTF-8/ASCII content for inspected files.

## Findings

1. **[LOW confidence] Theme toggle exposes pressed state but not a stateful label** — `v6/src/js/pyrocarbon.js:13,28,31` sets `aria-pressed` on `[data-theme-toggle]` and flips `data-theme`, but leaves the visible/accessible name as the static text `"Theme"` (see `v6/src/pug/boilerplate.pug:18`, `v6/src/pug/showcase.pug:17`). Unlike the density control (which updates text, `aria-label`, and a live region), the current theme is not announced by name, which can make the active state less clear for assistive-tech users relying on the control name. Suggested fix: update the button text and/or `aria-label` on toggle (e.g. `Theme: Dark/Light`, mirroring density) while preserving `aria-pressed`. *(Verification scope: Playwright asserts `data-theme`/computed color changes on click, but no assertion covers the toggle’s announced state/name.)*

2. **[LOW confidence] Spec combo form controls diverge from the documented form pattern** — `v6/src/pug/spec.pug:23-24` renders a `label` and `input.form-control` as direct children of `.combo` without a `.form-group` wrapper. The component contract/styles (`v6/src/styles/components/forms.scss:2`) and showcase usage (`v6/src/pug/showcase.pug:38-41`) pair labels/controls inside `.form-group` for spacing/layout consistency. Since `spec.pug` is the visual-truth artifact (DoD/spec Task 18), this makes the rendered combo state a slightly weaker exemplar of the Tier-1 form pattern. Suggested fix: wrap each combo field in `.form-group` (and optionally give the input an explicit `name`) to match the component pattern.

3. **[LOW confidence] `data-theme` / `data-density` are re-declared as global attributes in `spec.pug` headless context is fine, but the spec page omits standard page chrome present on other pages** — `v6/src/pug/spec.pug` includes only `main` + script (no skip link, header/nav, or footer), whereas `boilerplate.pug` and `showcase.pug` include landmarks/skip navigation. This appears intentional for a token/matrix inspection page and is not a functional break, but it means `spec.html` is not a full template example and differs from the other delivered pages’ landmark structure. Suggested fix: if `spec.html` is meant as a consumable page template, add the shared skip link/header/footer; if it is inspection-only, document that role explicitly in `README.md`/`DESIGN.md` to avoid readers copying it as a full-page baseline.

## Spec fidelity (checked)
- **Pass (with justified deviations noted):** Diff implements the planned v6 scaffold: three-tier token source (`v6/src/tokens/_tokens.scss`), lint/config stack, reset/base/components (button/forms/code/nav/footer), cascade entry, runtime toggles with `try/catch` storage guard and `prefers-color-scheme` fallback, Vite build with stable names, Pug page builder + generated token sections, boilerplate/showcase/spec pages, Tailwind `@theme` mapping, Playwright property tests, `DESIGN.md`/`README.md`, and build/test wiring (`prebuild`/`postbuild`/`verify`). Layer order declared in tokens and loaded via `index.scss`; `gen-spec.mjs` captures full token values (including `rgba()` comma/`clamp()`), emits class-based swatch styles, and asserts overlay capture.
- **Known justified deviations (accepted, as stated):** (a) `v6/src/styles/base.scss:15` uses `margin: calc(var(--border-hairline) * -1)` for `.visually-hidden` instead of raw `-1px`, consistent with the no-raw-px contract. (b) `v6/src/tokens/_tailwind-theme.css:20-25` trailing comment wording avoids prematurely closing around `--color-*`/`--spacing-*`, consistent with the Tailwind parser issue noted.
- **No out-of-scope implementation observed** in reviewed source/config/docs beyond the stated Tier-1 scope and plan tasks. Generated `v6/dist/*` and `v6/package-lock.json` were not reviewed.

## Text integrity
- No stray control characters, mojibake, or corrupted references observed in directly inspected source/docs (`read_file` views of `v6/src/*`, `v6/scripts/*`, `v6/test/*`, `v6/DESIGN.md`, `v6/README.md`, `v6/package.json`, configs). Some mojibake appeared in this environment’s captured `git diff`/PowerShell log rendering, but that was not present in the underlying inspected files and is treated as a tooling/output artifact, not a repo-content defect.

**Completeness:** 8/10
**Spec axis:** pass