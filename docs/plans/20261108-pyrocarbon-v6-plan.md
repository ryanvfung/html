# PyroCarbon v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `implement` (worktree-isolated, task-by-task execution of this plan; stops before merge — `ship` merges). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the v5.2 handcrafted template as the v6 agentic design system: one three-tier token source producing a standalone `dist/` and a Tailwind v4 `@theme` block, with no Bootstrap and Windows-first build.
**Architecture:** `src/tokens/_tokens.scss` is the only value source: primitives (theme-invariant) → semantic aliases switched by `[data-theme]` → density aliases switched by `[data-density]`. Vite compiles SCSS + JS into `dist/`; `scripts/build-pages.mjs` renders the Pug pages afterwards; `scripts/gen-spec.mjs` reads the token file to emit the spec page's token sections. The Tailwind track is a thin `@theme` mapping over the same custom properties.
**Tech Stack:** Vite 8, Pug 3, Dart Sass (`sass`), Tailwind CSS 4 (`@tailwindcss/cli`), stylelint 18 (`postcss-scss`), html-validate 11, pug-lint 2, Playwright 1.65.
**Token flow:** `_tokens.scss` → `styles/index.scss` → `dist/pyrocarbon.css`; `_tokens.scss` → `_tailwind-theme.css`; `_tokens.scss` → `gen-spec.mjs` → `_generated.pug` → `spec.pug`.
**Spec:** `docs/designs/20261101-pyrocarbon-v6-design.md`
**Assumptions:**
- Repo root is `html_app/` (git root confirmed; branch `master`, clean tree at authoring). Plan file is repo-relative.
- Node 24.15.0 / npm 11.12.1 and network access for `npm install` (verified).
- v6.0 Tier 1 = minimal v5.2 port: typography/links, buttons, forms (input, select, textarea, checkbox/radio, file), code blocks, header/nav, sidebar, footer. Alerts, cards, tables, badges, breadcrumbs, pagination are deferred to v6.1+ (user decision 2026-11-08).
- `v6/dist/` is committed (matches v5.2 and the "copy dist/" consumption model).
- v5.2 stays byte-identical; no v6 file imports from `/5.2/`.

## Global Constraints

- Git root `html_app/`; branch `feat/20261108-pyrocarbon-v6-plan`; all work stays inside `v6/` except this plan.
- Commit format: `<verb>: <summary> — docs/plans/20261108-pyrocarbon-v6-plan.md`.
- PowerShell-native commands; no `cross-env` (no task sets an env var); LF endings via `v6/.gitattributes` (`* text=auto eol=lf`).
- Dependencies pinned exactly as listed in Task 1; no extras without a task that justifies them.
- `v6/dist/` is tracked and never hand-edited; a build regenerates it.
- No raw hex outside `src/tokens/_tokens.scss`; no `px` in spacing/margin/padding/font-size; no `!important` outside `reset.scss`; no `darken|lighten|adjust-hue|transparentize`.
- Browser baseline: evergreen only — `clamp()`, `color-mix()`, `@layer`, `:has()`, `<dialog>` allowed.
- Design language: tinted neutrals, asymmetric top-only radii, hairline/one-shadow elevation, no `background-clip: text`.

## Review Focus

- **No `data-theme` / `data-density` attribute on `<html>`:** pages must render light + default with zero JS. A reasonable reader expects the default page to be fully styled, not colorless; Task 4 pins this by compiling `:root` defaults.
- **Token values containing `,` and `;` (`clamp()`, `rgba()`):** `gen-spec.mjs` must capture the whole value, not stop at the first comma. Task 17 pins a `clamp()` and an `rgba()` assertion.
- **Density switch changing color or primitive scale:** a reader expects compact/comfortable to move only control geometry and leading. Task 5 pins that `--orange-5` and `--surface-canvas` are unchanged across densities.
- **320px viewport with an unbreakable string (long URL, long token name):** a reader expects no horizontal page scrollbar. Task 21 pins `scrollWidth <= clientWidth` at 320px.
- **`localStorage` throwing (blocked storage / private mode):** toggles must still switch theme in-session. Task 14 wraps access in `try/catch` and the test stubs a throwing `localStorage`.
- **Six theme×density combos rendered on one page:** scoped overrides must not leak; spec sections set the attributes on a wrapper, not `<html>`. Task 18 pins computed color inside two adjacent combos.

## File Structure

Everything lives under `v6/` (new). Existing files are not modified; `/5.2/` is read-only reference.

| Path | Responsibility |
|---|---|
| `package.json`, `.gitattributes` | Private package (`"private": true`), pinned deps, LF policy |
| `vite.config.ts` | Vite: JS entry, stable unhashed output names |
| `scripts/build-pages.mjs` | Renders each `src/pug/*.pug` page to `dist/*.html` via `pug.renderFile` (postbuild) |
| `.stylelintrc.mjs` / `.htmlvalidate.json` / `.pug-lintrc.json` | Lint contracts (token discipline, semantics, indentation) |
| `playwright.config.ts`, `test/spec.spec.ts` | Property assertions against `vite preview` |
| `src/tokens/_tokens.scss` | **Canonical value source.** Tier 1 primitives, Tier 3 density, Tier 2 semantic per theme |
| `src/tokens/_tailwind-theme.css` | `@theme` mapping of semantic tokens to Tailwind utility namespaces |
| `src/styles/reset.scss` | Minimal modern reset (only file allowed `!important`) |
| `src/styles/base.scss` | Element typography, links, selection, focus-visible, reduced motion |
| `src/styles/components/button.scss` | Button variants + states (first vertical slice) |
| `src/styles/components/forms.scss` | Inputs, select, textarea, checkbox/radio, file, labels, error state |
| `src/styles/components/code.scss` | `pre`, `code`, `kbd`, `o-code-block`, `o-cli-block`, `o-cmd-block` |
| `src/styles/components/nav.scss` | Header navbar, mobile nav toggle, sidebar (`c-sidebar`) |
| `src/styles/components/footer.scss` | `c-footer` |
| `src/styles/index.scss` | Single entry loading (via `@use`) tokens → reset → base → components → spec-generated → spec; layer order is declared at the top of `_tokens.scss` |
| `src/styles/spec.scss` | Spec page layout helpers (token grid, swatch rows, combo cards), under the lint contract |
| `src/js/pyrocarbon.js` | Theme/density/nav toggles, `localStorage`, `prefers-color-scheme` |
| `src/pug/boilerplate.pug` | Starter page: skip link, header/nav, main, footer |
| `src/pug/showcase.pug` | Curated compositions built from Tier 1 components |
| `src/pug/spec.pug` | Token + component matrix across 6 theme×density combos |
| `src/pug/_generated.pug` | Generated by `scripts/gen-spec.mjs`; included by `spec.pug`; committed |
| `scripts/gen-spec.mjs` | Parses `_tokens.scss`, emits swatches/scales into `_generated.pug` |
| `dist/` | Built `pyrocarbon.css`, `pyrocarbon.js`, `boilerplate.html`, `showcase.html`, `spec.html` (tracked) |
| `DESIGN.md`, `README.md` | Persistent constitution; human onboarding |

## Task Right-Sizing

24 tasks, ordered by the spec's first principles (§13): tokens → lint → base → button → remaining components → pages → Tailwind → tests → docs.

- **One deliverable per task**, independently verifiable and independently rejectable. Tasks 2–5 divide the token layer into testable slices (colors/fonts, scale/space, semantic themes, density) because a reviewer can accept primitives while rejecting the theme mapping.
- **Setup is folded in**: package scripts, `.gitattributes`, and dependency install are Task 1; the Vite config lands in Task 15 with the first build it must produce; Playwright config lands in Task 21 with the tests that use it. No standalone "config-only" tasks except the lint stack (Task 6), whose entire deliverable *is* the contract and is tested by a failing fixture.
- **`gen-spec.mjs` and `spec.pug` split** (Tasks 17–18) because the parser is testable in isolation; the page only consumes it.
- **Docs are last** (Tasks 22–23) so they describe shipped reality; **Task 24** regenerates `dist/` and runs the full gate.
- **Deferred, not planned:** alerts, cards, tables, badges, breadcrumbs, pagination, WCAG 2.2 audit, visual regression, publish tooling. Adding any of them is a new plan.
- **DoD 5 is scoped** to the token surface (all three tiers) plus the Tier-1 component states rendered by the three pages; a full six-combo matrix of every component state is v6.1 work, not v6.0.
- **`verify` deliberately includes Playwright** even though design spec decision R calls it opt-in; split into `verify`/`verify:full` if that must be preserved.
- **Spec §13.4 ordering is deliberately inverted**: components land before the spec page because the page consumes them; the visual-truth artifact arrives at Task 18.
- **Raw `em`/`rem` geometry** in `code.scss` and `forms.scss` is intentional component-local proportion, not a token violation; DoD 3's wording is "no raw px", not "no raw values".

### Task 1: Scaffold v6 project

**Files:**
- Create: `v6/package.json`
- Create: `v6/.gitattributes`
- Create: `v6/package-lock.json` (generated by `npm install`)

**Interfaces:**
- Consumes: nothing.
- Produces: npm scripts `dev|build|preview|lint|verify|test`, and the `v6/` working root every later task opens.

- [ ] **Step 0: Create the feature branch**

Run (at the repo root): `git switch -c feat/20261108-pyrocarbon-v6-plan` → Expected: `Switched to a new branch 'feat/20261108-pyrocarbon-v6-plan'` (skip if the branch already exists and is checked out).

- [ ] **Step 1: Write `v6/package.json`**

```json
{
  "name": "pyrocarbon", "version": "6.0.0", "private": true, "type": "module", "license": "MIT",
  "scripts": {
    "dev": "vite", "build": "vite build",
    "preview": "vite preview --port 4173",
    "lint:css": "stylelint \"src/**/*.scss\"",
    "lint:html": "html-validate \"dist/*.html\"",
    "lint:pug": "pug-lint src/pug/boilerplate.pug src/pug/showcase.pug src/pug/spec.pug src/pug/_generated.pug",
    "lint": "npm run lint:css && npm run lint:html && npm run lint:pug",
    "test": "playwright test", "verify": "npm run build && npm run lint && npm test"
  },
  "devDependencies": {
    "@playwright/test": "1.65.0", "@tailwindcss/cli": "4.3.5",
    "html-validate": "11.19.0", "postcss-scss": "4.0.9", "pug": "3.0.4", "pug-lint": "2.7.0",
    "sass": "1.108.1", "stylelint": "18.0.0", "tailwindcss": "4.3.5",
    "vite": "8.3.6"
  }
}
```

- [ ] **Step 2: Write `v6/.gitattributes`**

```text
* text=auto eol=lf
```

- [ ] **Step 3: Install pinned dependencies**

Run (in `v6/`): `npm install` → Expected: exit 0, `node_modules/` and `package-lock.json` created.

- [ ] **Step 4: Verify the toolchain resolves**

Run: `node -e "console.log(Object.keys(require('./package.json').devDependencies).length)"` → Expected: `10`
Run: `npx stylelint --version` → Expected: `18.0.0`

- [ ] **Step 5: Commit**

```powershell
git add v6/package.json v6/package-lock.json v6/.gitattributes
git commit -m "chore: scaffold pyrocarbon v6 — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:1 complete -->

### Task 2: Token Tier 1a — color ramps and font stacks

**Files:**
- Create: `v6/src/tokens/_tokens.scss`

**Interfaces:**
- Consumes: nothing.
- Produces: `--orange-0`…`--orange-9`, `--orange-60`, `--orange-93`, `--neutral-0`…`--neutral-10`, `--font-display`, `--font-body`, `--font-mono`. Tasks 3–5 and `gen-spec.mjs` consume these names.

- [ ] **Step 1: Write the primitive block**

```scss
@layer theme, tokens, reset, base, components, utilities;
// Tier 1 — primitives. Identical across themes and densities.
@layer tokens {
:root {
  /* Orange ramp derived from the #f70 anchor (--orange-5). */
  --orange-0: #331800; --orange-1: #663000; --orange-2: #994700;
  --orange-3: #cc5f00; --orange-4: #e66b00; --orange-5: #ff7700;
  --orange-6: #ff9940; --orange-7: #ffcca0; --orange-8: #ffddbf;
  --orange-9: #ffebd9;
  /* Reserved swatches: documented only, never used in component CSS. */
  --orange-60: #f60; --orange-93: #f93;
  /* Neutral ramp: hsl(28deg 8% L) — tinted toward the anchor hue. */
  --neutral-0: #161413; --neutral-1: #292623; --neutral-2: #3d3834;
  --neutral-3: #534c46; --neutral-4: #696059; --neutral-5: #8a7f75;
  --neutral-6: #a69e96; --neutral-7: #c2bcb7; --neutral-8: #d9d6d3;
  --neutral-9: #eceae9; --neutral-10: #f8f7f7;
  /* Role split is deliberate even when both resolve to one family. */
  --font-display: 'Maven Pro', 'Segoe UI', 'Lucida Grande', 'Droid Sans', 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
  --font-body: var(--font-display);
  --font-mono: 'Cascadia Code', Consolas, 'SFMono-Regular', Menlo, monospace;
}
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `npx sass --no-source-map src/tokens/_tokens.scss` → Expected: exit 0; stdout contains `--orange-5: #ff7700` and `--neutral-10: #f8f7f7`.

- [ ] **Step 3: Commit**

```powershell
git add v6/src/tokens/_tokens.scss
git commit -m "feat: add v6 token primitives — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:2 complete -->

### Task 3: Token Tier 1b — fluid type, structural constants, spacing

**Files:**
- Modify: `v6/src/tokens/_tokens.scss` (append a second `:root` block)

**Interfaces:**
- Consumes: nothing.
- Produces: `--text-xs`…`--text-4xl`, `--space-1`…`--space-16`, `--nav-height`, `--radius-sm`, `--radius-card`, `--radius-input`, `--border-hairline`, `--border-width-strong`. Tasks 4–5 and the component tasks consume these names.

- [ ] **Step 1: Append the scale block**

```scss
// Tier 1 (continued) — fluid type, structural constants, fluid spacing.
@layer tokens {
:root {
  --text-xs: clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem); --text-sm: clamp(0.875rem, 0.84rem + 0.18vw, 0.9375rem);
  --text-base: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem); --text-lg: clamp(1.125rem, 1.06rem + 0.3vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.15rem + 0.45vw, 1.5rem); --text-2xl: clamp(1.5rem, 1.33rem + 0.75vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.6rem + 1.2vw, 2.5rem); --text-4xl: clamp(2.25rem, 1.85rem + 1.8vw, 3.25rem);
  --nav-height: 3.5rem; --radius-sm: 0.25rem;
  --radius-card: 0.25rem 0.25rem 0 0; --radius-input: 0.25rem 0.25rem 0 0;
  --border-hairline: 0.0625rem; --border-width-strong: 0.125rem;
  --space-1: 0.25rem; --space-2: clamp(0.5rem, 0.48rem + 0.1vw, 0.5625rem);
  --space-3: clamp(0.75rem, 0.72rem + 0.15vw, 0.875rem); --space-4: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --space-5: clamp(1.25rem, 1.19rem + 0.3vw, 1.5rem); --space-6: clamp(1.5rem, 1.42rem + 0.4vw, 1.75rem);
  --space-7: clamp(1.75rem, 1.65rem + 0.5vw, 2.125rem); --space-8: clamp(2rem, 1.87rem + 0.65vw, 2.5rem);
  --space-9: clamp(2.5rem, 2.3rem + 1vw, 3.25rem); --space-10: clamp(3rem, 2.75rem + 1.25vw, 4rem);
  --space-11: clamp(3.5rem, 3.2rem + 1.5vw, 4.75rem); --space-12: clamp(4rem, 3.65rem + 1.75vw, 5.5rem);
  --space-13: clamp(5rem, 4.55rem + 2.25vw, 6.75rem); --space-14: clamp(6rem, 5.45rem + 2.75vw, 8rem);
  --space-15: clamp(7rem, 6.35rem + 3.25vw, 9.5rem); --space-16: clamp(8rem, 7.25rem + 3.75vw, 11rem);
}
}
```

> Note: the design spec §4 lists `--border-strong` as both a Tier 1 structural constant (width) and a Tier 2 border colour. v6 resolves the collision by naming the width `--border-width-strong`; `--border-strong` remains the colour declared in Task 4.

- [ ] **Step 2: Verify the scale compiles**

Run: `npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern '--text-4xl|--space-16'` → Expected: two matches, both `clamp(`; exit 0.

- [ ] **Step 3: Commit**

```powershell
git add v6/src/tokens/_tokens.scss
git commit -m "feat: add v6 fluid scales and spacing — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:3 complete -->

### Task 4: Token Tier 2 — semantic roles and theme switching

**Files:**
- Modify: `v6/src/tokens/_tokens.scss` (append `:root, [data-theme="light"]` and `[data-theme="dark"]` blocks)

**Interfaces:**
- Consumes: Task 2–3 primitives (`--neutral-*`, `--orange-*`).
- Produces: semantic custom properties `--surface-{canvas,raised,sunken,overlay}`, `--text-{primary,secondary,tertiary,inverse,accent,code,on-brand,on-nav}`, `--border-{default,strong,accent}`, `--accent{,-hover,-active,-subtle}`, `--surface-brand`, `--selection-{bg,fg}`, `--focus-ring`, `--elevation-strategy`, `--shadow-{nav,card}`, `--syntax-{tag,string,comment,keyword}`. Components (Tasks 9–13) and `_tailwind-theme.css` (Task 20) consume only these.

- [ ] **Step 1: Append the light block (also the no-attribute default)**

```scss
@layer tokens {
:root, [data-theme="light"] {
  --surface-canvas: var(--neutral-9); --surface-raised: var(--neutral-10);
  --surface-sunken: var(--neutral-8); --surface-overlay: rgba(22,20,19,0.55);
  --text-primary: var(--neutral-1); --text-secondary: var(--neutral-3); --text-tertiary: var(--neutral-4);
  --text-inverse: var(--neutral-10); --text-accent: #994700; --text-code: #8a3f00; --text-on-brand: var(--neutral-10); --text-on-nav: var(--neutral-0);
  --border-default: var(--neutral-7); --border-strong: var(--neutral-5); --border-accent: var(--orange-5);
  --accent: #b34f00; --accent-hover: #994700; --accent-active: #803c00;
  --accent-subtle: var(--orange-8); --surface-brand: var(--orange-5);
  --selection-bg: var(--orange-8); --selection-fg: var(--neutral-1); --focus-ring: #b34f00;
  --elevation-strategy: shadow; --shadow-nav: 0 0 10px 1px rgba(22,20,19,0.3);
  --shadow-card: 0 1px 2px rgba(22,20,19,0.08);
  --syntax-tag: #8a3f00; --syntax-string: #8a3f00; --syntax-comment: var(--neutral-3); --syntax-keyword: #803c00;
}
}
```

- [ ] **Step 2: Append the dark block**

```scss
@layer tokens {
[data-theme="dark"] {
  --surface-canvas: var(--neutral-0); --surface-raised: var(--neutral-1); --surface-sunken: #0f0d0c;
  --surface-overlay: rgba(10,9,8,0.65);
  --text-primary: var(--neutral-9); --text-secondary: var(--neutral-7); --text-tertiary: var(--neutral-5);
  --text-inverse: var(--neutral-0); --text-accent: var(--orange-6); --text-code: var(--orange-7); --text-on-brand: var(--neutral-0); --text-on-nav: var(--neutral-0);
  --border-default: var(--neutral-2); --border-strong: var(--neutral-3); --border-accent: var(--orange-6);
  --accent: var(--orange-5); --accent-hover: var(--orange-6); --accent-active: var(--orange-4);
  --accent-subtle: var(--neutral-2); --surface-brand: var(--orange-5);
  --selection-bg: var(--orange-4); --selection-fg: var(--neutral-0); --focus-ring: var(--orange-6);
  --elevation-strategy: shadow; --shadow-nav: 0 0 10px 1px rgba(10,9,8,0.7); --shadow-card: 0 1px 2px rgba(10,9,8,0.6);
  --syntax-tag: #d9a441; --syntax-string: var(--orange-6); --syntax-comment: var(--neutral-5); --syntax-keyword: var(--orange-5);
}
}
```

- [ ] **Step 3: Verify both themes compile and default to light**

Run: `npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern 'data-theme=light|data-theme=dark|--accent:'` → Expected: light selector, dark selector, and two `--accent:` lines (`#b34f00`, then `var(--orange-5)`).
Run: `npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern '--text-on-nav'` → Expected: two matches (light and dark).

- [ ] **Step 4: Commit**

```powershell
git add v6/src/tokens/_tokens.scss
git commit -m "feat: add v6 semantic tokens and themes — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:4 complete -->

### Task 5: Token Tier 3 — density aliases

**Files:**
- Modify: `v6/src/tokens/_tokens.scss` (append three density blocks)

**Interfaces:**
- Consumes: nothing (density is orthogonal to color and primitives).
- Produces: `--control-height`, `--control-padding-x`, `--control-padding-y`, `--pad-card`, `--gap-grid`, `--leading-body`, `--leading-tight`, `--measure-body`, defaulting on `:root`. Components (Tasks 9–13) consume only these for geometry and leading.

- [ ] **Step 1: Append the density blocks**

```scss
@layer tokens {
:root, [data-density="default"] {
  --control-height: 2.75rem; --control-padding-x: 0.75rem; --control-padding-y: 0.4375rem;
  --pad-card: 1.25rem; --gap-grid: 1rem; --leading-body: 1.6; --leading-tight: 1.25; --measure-body: 65ch;
}
[data-density="compact"] {
  --control-height: 2.25rem; --control-padding-x: 0.5rem; --control-padding-y: 0.25rem;
  --pad-card: 0.75rem; --gap-grid: 0.5rem; --leading-body: 1.4; --leading-tight: 1.2; --measure-body: 60ch;
}
[data-density="comfortable"] {
  --control-height: 3rem; --control-padding-x: 1rem; --control-padding-y: 0.625rem;
  --pad-card: 1.75rem; --gap-grid: 1.5rem; --leading-body: 1.75; --leading-tight: 1.3; --measure-body: 70ch;
}
}
```

- [ ] **Step 2: Verify density defaults and orthogonality**

Run: `npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern 'control-height'` → Expected: three matches: `2.75rem`, `2.25rem`, `3rem`.
Run: `(npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern '--orange-5: #ff7700' -AllMatches).Matches.Count` → Expected: `1` (primitives never re-declared under density).
Run: `(npx sass --no-source-map src/tokens/_tokens.scss | Select-String -Pattern '--surface-canvas:' -AllMatches).Matches.Count` → Expected: `2` (light + dark only; no density block re-declares a semantic colour).

- [ ] **Step 3: Commit**

```powershell
git add v6/src/tokens/_tokens.scss
git commit -m "feat: add v6 density aliases — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:5 complete -->

### Task 6: Lint stack

**Files:**
- Create: `v6/.stylelintrc.mjs`
- Create: `v6/.htmlvalidate.json`
- Create: `v6/.pug-lintrc.json`

**Interfaces:**
- Consumes: `v6/src/tokens/_tokens.scss` (must pass once the hex override is scoped).
- Produces: the token contract every later component task obeys; `npm run lint` wiring from Task 1.

- [ ] **Step 1: Write `.stylelintrc.mjs`**

```js
export default {
  customSyntax: 'postcss-scss',
  rules: {
    'color-no-hex': true,
    'declaration-no-important': true,
    'declaration-property-value-disallowed-list': {
      '/^(padding|margin|gap|font-size)(-(top|right|bottom|left|x|y))?$/': ['/\\d+px/'],
      'background-clip': ['text'], '-webkit-background-clip': ['text'],
    },
    'function-disallowed-list': ['darken', 'lighten', 'adjust-hue', 'transparentize', 'adjust-color', 'scale-color'],
    'selector-max-specificity': '0,4,0',
    'declaration-property-value-allowed-list': { 'font-family': ['/^var\\(--font-/'] },
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'no-invalid-position-at-import-rule': true,
  },
  overrides: [
    { files: ['src/tokens/_tokens.scss'], rules: { 'color-no-hex': null } },
    { files: ['src/styles/_spec-generated.scss'], rules: { 'color-no-hex': null } },
    { files: ['src/styles/reset.scss'], rules: { 'declaration-no-important': null } },
  ],
};
```

- [ ] **Step 2: Write `.htmlvalidate.json` and `.pug-lintrc.json`**

```json
{ "extends": ["html-validate:recommended"], "rules": { "no-inline-style": "error", "heading-level": "error", "no-dup-id": "error", "wcag/h30": "error", "wcag/h32": "error" } }
```
```json
{ "validateIndentation": 2, "disallowHtmlText": true, "requireLowerCaseAttributes": true, "requireLowerCaseTags": true }
```

- [ ] **Step 3: Prove the contract rejects a violation**

Run: `New-Item -ItemType Directory -Force tmp` then create `v6/tmp/lint-fixture.scss` containing `:root { padding: 4px; } .x { color: #123456; } .y { font-family: Arial; }`.
Run: `npx stylelint tmp/lint-fixture.scss` → Expected: exit 1 with `color-no-hex`, `declaration-property-value-disallowed-list`, and `declaration-property-value-allowed-list` errors. Then delete `v6/tmp/lint-fixture.scss`.
Run: `npx stylelint "src/tokens/_tokens.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/.stylelintrc.mjs v6/.htmlvalidate.json v6/.pug-lintrc.json
git commit -m "chore: add v6 lint stack — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:6 complete -->

### Task 7: Reset and base element styles

**Files:**
- Create: `v6/src/styles/reset.scss`
- Create: `v6/src/styles/base.scss`

**Interfaces:**
- Consumes: semantic + density tokens from Tasks 3–5.
- Produces: the base cascade layer consumed by `index.scss` (Task 8) and every component task; `.skip-link` used by `boilerplate.pug` (Task 16).

- [ ] **Step 1: Write `reset.scss`**

```scss
@layer reset {
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
body { min-height: 100dvh; }
img, picture, svg, video { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; color: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
}
```

- [ ] **Step 2: Write `base.scss`**

```scss
@layer base {
html { font-size: 100%; }
body { font-family: var(--font-body); font-size: 1rem; line-height: var(--leading-body); background: var(--surface-canvas); color: var(--text-primary); }
h1, h2, h3, h4, h5, h6 { font-family: var(--font-display); line-height: var(--leading-tight); overflow-wrap: break-word; }
h1 { font-size: var(--text-4xl); } h2 { font-size: var(--text-3xl); } h3 { font-size: var(--text-2xl); }
h4 { font-size: var(--text-xl); } h5 { font-size: var(--text-lg); } h6 { font-size: var(--text-base); }
p, li, dd { max-width: var(--measure-body); }
small { font-size: var(--text-sm); color: var(--text-secondary); }
a { color: var(--text-accent); text-decoration-thickness: var(--border-hairline); }
a:hover { color: var(--accent-hover); } a:active { color: var(--accent-active); }
::selection { background: var(--selection-bg); color: var(--selection-fg); }
:focus-visible { outline: var(--border-width-strong) solid var(--focus-ring); outline-offset: 0.125rem; }
.skip-link { position: absolute; left: -100vw; top: 0; padding: var(--space-2) var(--space-4); background: var(--surface-raised); color: var(--text-primary); }
.skip-link:focus { left: 0; }
.visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
[hidden] { display: none; }
}
```

- [ ] **Step 3: Verify both compile and lint clean**

Run: `npx sass --no-source-map src/styles/reset.scss > $null; npx sass --no-source-map src/styles/base.scss > $null` → Expected: exit 0.
Run: `npx stylelint "src/styles/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/reset.scss v6/src/styles/base.scss
git commit -m "feat: add v6 reset and base styles — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:7 complete -->

### Task 8: Stylesheet cascade entry

**Files:**
- Create: `v6/src/styles/index.scss`

**Interfaces:**
- Consumes: `tokens/_tokens.scss` (Task 2–5), `reset.scss` and `base.scss` (Task 7).
- Produces: the single Vite stylesheet entry. Every component task (9–13) appends one `@use './components/<name>';` line at the end.

- [ ] **Step 1: Write `index.scss`**

```scss
@use '../tokens/tokens';
@use './reset';
@use './base';
```

- [ ] **Step 2: Verify ordering and compilation**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern '@layer theme, tokens|--surface-canvas|box-sizing'` → Expected: three matches in that order (layer-order statement first, token values second, reset third); exit 0.

- [ ] **Step 3: Lint**

Run: `npx stylelint "src/styles/index.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/index.scss
git commit -m "feat: add v6 cascade entry — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:8 complete -->

### Task 9: Button component

**Files:**
- Create: `v6/src/styles/components/button.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './components/button';`)

**Interfaces:**
- Consumes: `--accent`, `--accent-hover`, `--accent-active`, `--accent-subtle`, `--text-on-brand`, `--text-primary`, `--text-accent`, `--border-{default,hairline}`, `--border-width-strong`, `--control-{height,padding-x,padding-y}`, `--radius-sm`, `--focus-ring`, `--space-1`, `--space-2`, `--text-{sm,base}`, `--leading-tight`, `--surface-sunken`.
- Produces: classes `.btn`, `.btn:hover|:active|:focus-visible|:disabled`, `.btn--secondary`, `.btn--ghost`, `.btn--sm`. Tasks 15–18 render these.

- [ ] **Step 1: Write `button.scss`**

```scss
@layer components {
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: var(--control-height); padding: var(--control-padding-y) var(--control-padding-x);
  border: var(--border-hairline) solid var(--accent); border-radius: var(--radius-sm);
  background: var(--accent); color: var(--text-on-brand);
  font-family: var(--font-body); font-size: var(--text-base); line-height: var(--leading-tight);
  text-decoration: none; cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;
}
.btn:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn:active { background: var(--accent-active); border-color: var(--accent-active); }
.btn:focus-visible { outline: var(--border-width-strong) solid var(--focus-ring); outline-offset: 0.125rem; }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }
.btn--secondary { background: transparent; border-color: var(--border-default); color: var(--text-primary); }
.btn--secondary:hover { background: var(--surface-sunken); }
.btn--ghost { background: transparent; border-color: transparent; color: var(--text-accent); }
.btn--ghost:hover { background: var(--accent-subtle); }
.btn--sm { min-height: calc(var(--control-height) - var(--space-2)); padding: var(--space-1) var(--space-2); font-size: var(--text-sm); }
}
```

- [ ] **Step 2: Append the import to `index.scss`**

```scss
@use './components/button';
```

- [ ] **Step 3: Verify compile + token-only check**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern '\.btn'` → Expected: `.btn`, `.btn:hover`, `.btn:focus-visible`, `.btn--secondary`, `.btn--ghost`, `.btn--sm` present.
Run: `npx stylelint "src/styles/**/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/components/button.scss v6/src/styles/index.scss
git commit -m "feat: add v6 button component — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:9 complete -->

### Task 10: Forms component

**Files:**
- Create: `v6/src/styles/components/forms.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './components/forms';`)

**Interfaces:**
- Consumes: `--control-{height,padding-x,padding-y}`, `--radius-input`, `--border-{hairline,default,accent}`, `--border-width-strong`, `--surface-{raised,sunken}`, `--text-{primary,secondary,accent,tertiary}`, `--accent`, `--focus-ring`, `--space-{1,2,4}`, `--text-{sm,base}`.
- Produces: classes `.form-group`, `.form-control`, `.form-check`, `.form-error`; selectors `input[type="file"]`, `textarea.form-control`, `select.form-control`, `.form-control[aria-invalid="true"]`. Tasks 15–18 render these.

- [ ] **Step 1: Write `forms.scss`**

```scss
@layer components {
.form-group { display: flex; flex-direction: column; gap: var(--space-1); margin-block-end: var(--space-4); }
.form-group > label, .form-check { font-size: var(--text-sm); color: var(--text-secondary); }
.form-control {
  min-height: var(--control-height); padding: var(--control-padding-y) var(--control-padding-x);
  border: var(--border-hairline) solid var(--border-default); border-radius: var(--radius-input);
  background: var(--surface-raised); color: var(--text-primary); font-size: var(--text-base);
}
.form-control:focus-visible { outline: var(--border-width-strong) solid var(--focus-ring); outline-offset: 0.125rem; border-color: var(--border-accent); }
.form-control[aria-invalid="true"] { border-color: var(--text-accent); border-width: var(--border-width-strong); }
.form-check { display: flex; align-items: center; gap: var(--space-2); min-height: var(--control-height); }
.form-check input { inline-size: 1.25rem; block-size: 1.25rem; accent-color: var(--accent); }
.form-error { color: var(--text-accent); font-size: var(--text-sm); }
.form-error::before { content: '\26A0\00A0'; }
input[type="file"] { padding: var(--space-2); }
textarea.form-control { min-height: calc(var(--control-height) * 3); resize: vertical; }
select.form-control { cursor: pointer; }
}
```

- [ ] **Step 2: Append the import to `index.scss`**

```scss
@use './components/forms';
```

- [ ] **Step 3: Verify compile, error affordance, and touch sizes**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern 'form-error::before|control-height|aria-invalid'` → Expected: matches for all three; exit 0.
Run: `npx stylelint "src/styles/**/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/components/forms.scss v6/src/styles/index.scss
git commit -m "feat: add v6 forms component — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:10 complete -->

### Task 11: Code component

**Files:**
- Create: `v6/src/styles/components/code.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './components/code';`)

**Interfaces:**
- Consumes: `--font-mono`, `--radius-{sm,card}`, `--surface-{sunken,raised}`, `--text-{primary,code,tertiary}`, `--syntax-{tag,string,comment,keyword}`, `--border-{hairline,strong}`, `--space-{2,3,4}`, `--leading-body`.
- Produces: element styles for `pre`/`code`/`kbd`/`samp`, classes `.o-code-block`, `.o-cli-block`, `.o-cmd-block`, and `.syntax-tag|string|comment|keyword`. Tasks 15–18 render these.

- [ ] **Step 1: Write `code.scss`**

```scss
@layer components {
code, kbd, samp, pre { font-family: var(--font-mono); }
code { padding: 0.125em 0.25em; border-radius: var(--radius-sm); background: var(--surface-sunken); color: var(--text-code); font-size: 0.9em; overflow-wrap: anywhere; }
kbd { padding: 0.125em 0.375em; border: var(--border-hairline) solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-raised); color: var(--text-primary); font-size: 0.9em; }
pre { overflow-x: auto; padding: var(--space-4); border-radius: var(--radius-card); background: var(--surface-sunken); color: var(--text-primary); line-height: var(--leading-body); }
pre code { padding: 0; background: transparent; color: inherit; font-size: inherit; }
.o-code-block { counter-reset: line; }
.o-code-block > code > span { display: block; counter-increment: line; }
.o-code-block > code > span::before { content: counter(line); display: inline-block; min-inline-size: 2.5em; margin-inline-end: var(--space-3); color: var(--text-tertiary); text-align: end; }
.o-cli-block::before, .o-cmd-block::before { margin-inline-end: var(--space-2); color: var(--text-tertiary); }
.o-cli-block::before { content: '$'; }
.o-cmd-block::before { content: '>'; }
.syntax-tag { color: var(--syntax-tag); } .syntax-string { color: var(--syntax-string); }
.syntax-comment { color: var(--syntax-comment); } .syntax-keyword { color: var(--syntax-keyword); }
}
```

- [ ] **Step 2: Append the import to `index.scss`**

```scss
@use './components/code';
```

- [ ] **Step 3: Verify compile + syntax tokens present**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern 'o-code-block|syntax-tag|o-cli-block'` → Expected: at least one match per selector; exit 0.
Run: `npx stylelint "src/styles/**/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/components/code.scss v6/src/styles/index.scss
git commit -m "feat: add v6 code component — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:11 complete -->

### Task 12: Header nav and sidebar component

**Files:**
- Create: `v6/src/styles/components/nav.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './components/nav';`)

**Interfaces:**
- Consumes: `--nav-height`, `--surface-brand`, `--surface-sunken`, `--text-on-nav`, `--text-{primary,secondary}`, `--accent`, `--shadow-nav`, `--border-hairline`, `--border-width-strong`, `--radius-sm`, `--control-{height,padding-x,padding-y}`, `--space-{1,2,4}`, `--gap-grid`, `--leading-tight`.
- Produces: classes `.site-header`, `.site-nav`, `.site-nav__list`, `.site-nav__toggle`, `.c-sidebar__title`, `.c-sidebar__nav`, `.doc-layout`, `.doc-content`; the toggle contract `[data-open="true"]` consumed by `pyrocarbon.js` (Task 14).

- [ ] **Step 1: Write `nav.scss`**

```scss
@layer components {
  .site-header { position: sticky; top: 0; z-index: 10; }
  .site-nav { display: flex; align-items: center; gap: var(--space-4); min-height: var(--nav-height); padding-inline: var(--space-4); background: var(--surface-brand); color: var(--text-on-nav); box-shadow: var(--shadow-nav); }
  .site-nav a { color: inherit; text-decoration: none; }
  .site-nav__list { display: flex; gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
  .site-nav__toggle { display: none; min-height: var(--control-height); padding: var(--control-padding-y) var(--control-padding-x); border: var(--border-hairline) solid currentColor; border-radius: var(--radius-sm); background: transparent; color: inherit; }
  .c-sidebar__title { margin: 0 0 var(--space-2) var(--space-2); }
  .c-sidebar__nav { margin: 0; padding: 0; list-style: none; }
  .c-sidebar__nav a { display: block; padding: var(--space-1) var(--space-2); border-inline-start: var(--border-width-strong) solid transparent; color: var(--text-secondary); text-decoration: none; }
  .c-sidebar__nav a:hover { background: var(--surface-sunken); }
  .c-sidebar__nav a[aria-current="page"] { border-inline-start-color: var(--accent); color: var(--text-primary); }
  .doc-layout { display: grid; gap: var(--gap-grid); }
  @media (min-width: 40em) {
    .doc-layout { grid-template-columns: minmax(0, 14rem) minmax(0, 1fr); }
    .doc-content { min-width: 0; }
    .c-sidebar { position: sticky; inset-block-start: calc(var(--nav-height) + var(--space-4)); align-self: start; }
  }
  @media (max-width: 40em) {
    .site-nav { flex-wrap: wrap; gap: var(--space-2); padding-inline: var(--space-2); }
    .site-nav__toggle { display: inline-flex; }
    .site-nav__list { display: none; }
    .site-nav__list[data-open="true"] { display: flex; flex-direction: column; position: absolute; inset-block-start: var(--nav-height); inset-inline: 0; padding: var(--space-4); background: var(--surface-brand); }
  }
}
```

- [ ] **Step 2: Append the import to `index.scss`**

```scss
@use './components/nav';
```

- [ ] **Step 3: Verify compile + responsive contract**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern 'data-open|nav-height|c-sidebar__nav'` → Expected: matches for all three; exit 0.
Run: `npx stylelint "src/styles/**/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/components/nav.scss v6/src/styles/index.scss
git commit -m "feat: add v6 nav and sidebar component — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:12 complete -->

### Task 13: Footer component

**Files:**
- Create: `v6/src/styles/components/footer.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './components/footer';`)

**Interfaces:**
- Consumes: `--surface-sunken`, `--text-secondary`, `--border-default`, `--border-hairline`, `--space-{2,4}`.
- Produces: classes `.c-footer`, `.c-footer p`.

- [ ] **Step 1: Write `footer.scss`**

```scss
@layer components {
.c-footer { padding-block: var(--space-4); border-block-start: var(--border-hairline) solid var(--border-default); background: var(--surface-sunken); color: var(--text-secondary); text-align: center; }
.c-footer p { margin-block: var(--space-2); }
}
```

- [ ] **Step 2: Append the import to `index.scss`**

```scss
@use './components/footer';
```

- [ ] **Step 3: Verify compile + lint**

Run: `npx sass --no-source-map src/styles/index.scss | Select-String -Pattern 'c-footer'` → Expected: two matches; exit 0.
Run: `npx stylelint "src/styles/**/*.scss"` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/styles/components/footer.scss v6/src/styles/index.scss
git commit -m "feat: add v6 footer component — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:13 complete -->

### Task 14: Runtime toggles (`pyrocarbon.js`)

**Files:**
- Create: `v6/src/js/pyrocarbon.js`

**Interfaces:**
- Consumes: markup contracts `[data-theme-toggle]`, `[data-density-toggle]`, `[data-density-status]`, `[data-nav-toggle]`, `.site-nav__list` (Task 12).
- Produces: side effects only — sets `documentElement.dataset.theme|density`, persists `pc-theme`/`pc-density`, updates the density button's visible/accessible label and the `[data-density-status]` live region, toggles `[data-open]` and `aria-expanded`/`aria-pressed`. Task 15 bundles it into `dist/pyrocarbon.js`.

- [ ] **Step 1: Write `pyrocarbon.js`**

```js
import '../styles/index.scss';

const root = document.documentElement;
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const densityButtons = document.querySelectorAll('[data-density-toggle]');
const densityOrder = ['compact', 'default', 'comfortable'];
const densityLabels = { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' };
const applyTheme = (theme) => { root.dataset.theme = theme; themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(theme === 'dark'))); };
const applyDensity = (density) => {
  root.dataset.density = density;
  const label = densityLabels[density] ?? density;
  densityButtons.forEach((button) => {
    button.textContent = `Density: ${label}`;
    button.setAttribute('aria-label', `Density: ${label}. Activate to cycle density.`);
  });
  const status = document.querySelector('[data-density-status]');
  if (status) status.textContent = `Density: ${label}`;
};

applyTheme(storage.get('pc-theme') ?? (darkQuery.matches ? 'dark' : 'light'));
applyDensity(storage.get('pc-density') ?? 'default');
darkQuery.addEventListener('change', (event) => { if (!storage.get('pc-theme')) applyTheme(event.matches ? 'dark' : 'light'); });
themeButtons.forEach((button) => button.addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next); storage.set('pc-theme', next); }));
densityButtons.forEach((button) => button.addEventListener('click', () => { const next = densityOrder[(densityOrder.indexOf(root.dataset.density) + 1) % densityOrder.length]; applyDensity(next); storage.set('pc-density', next); }));

const navToggle = document.querySelector('[data-nav-toggle]');
const navList = document.querySelector('.site-nav__list');
if (navToggle && navList) {
  navToggle.addEventListener('click', () => {
    const open = navList.dataset.open !== 'true';
    navList.dataset.open = String(open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
}
```

- [ ] **Step 2: Verify syntax and storage guard**

Run: `node --check src/js/pyrocarbon.js` → Expected: exit 0 (note: `node --check` rejects the bare `import` only if not treated as ESM; `package.json` has `"type": "module"`, so it passes).
Run: `Select-String -Path src/js/pyrocarbon.js -Pattern 'catch'` → Expected: two matches (get and set).

- [ ] **Step 3: Commit**

```powershell
git add v6/src/js/pyrocarbon.js
git commit -m "feat: add v6 theme density nav toggles — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:14 complete -->

### Task 15: Vite config and first build

**Files:**
- Create: `v6/vite.config.ts`
- Create: `v6/dist/pyrocarbon.css`, `v6/dist/pyrocarbon.js` (generated, tracked)

**Interfaces:**
- Consumes: `src/js/pyrocarbon.js` (Task 14) which imports `src/styles/index.scss` (Tasks 2–13).
- Produces: `npm run build` → `dist/pyrocarbon.{css,js}` with stable, unhashed names. Tasks 16–19 add page inputs to the same config.

> Note: `npm run dev` is CSS/JS-only; Pug pages render in `postbuild` into `dist/`. Use `npm run build` then `npm run preview` to view pages. `prebuild` does not run in dev, so regenerate `_generated.pug` manually if it goes stale.

- [ ] **Step 1: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { pyrocarbon: resolve(import.meta.dirname, 'src/js/pyrocarbon.js') },
      output: { entryFileNames: '[name].js', chunkFileNames: '[name].js', assetFileNames: 'pyrocarbon.[ext]' },
    },
  },
});
```

- [ ] **Step 2: Build and verify the artifacts**

Run: `npm run build` → Expected: exit 0; `dist/pyrocarbon.css` and `dist/pyrocarbon.js` exist.
Run: `Select-String -Path dist/pyrocarbon.css -Pattern '--surface-canvas'` → Expected: at least one match.
Run: `node -e "const s=require('fs').readFileSync('dist/pyrocarbon.js','utf8');if(!s.includes('pc-theme'))process.exit(1)"` → Expected: exit 0.

- [ ] **Step 3: Commit**

```powershell
git add v6/vite.config.ts v6/dist/pyrocarbon.css v6/dist/pyrocarbon.js
git commit -m "feat: add v6 vite build and first dist — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:15 complete -->

### Task 16: Boilerplate page and page builder

**Files:**
- Create: `v6/src/pug/boilerplate.pug`
- Create: `v6/scripts/build-pages.mjs`
- Modify: `v6/package.json` (add `"postbuild": "node scripts/build-pages.mjs"`)
- Create: `v6/dist/boilerplate.html` (generated, tracked)

**Interfaces:**
- Consumes: component classes from Tasks 9–13; `dist/pyrocarbon.{css,js}` (Task 15).
- Produces: `scripts/build-pages.mjs` with a `pages` array that Tasks 18–19 extend; `dist/boilerplate.html`.

- [ ] **Step 1: Write `boilerplate.pug`**

```pug
doctype html
html(lang="en")
  head
    meta(charset="utf-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title PyroCarbon
    link(rel="stylesheet" href="./pyrocarbon.css")
  body
    a.skip-link(href="#main") Skip to content
    header.site-header
      nav.site-nav(aria-label="Primary")
        a(href="./boilerplate.html" aria-current="page") PyroCarbon
        button.site-nav__toggle(type="button" data-nav-toggle aria-expanded="false" aria-controls="site-nav-list") Menu
        ul#site-nav-list.site-nav__list
          li: a(href="./boilerplate.html" aria-current="page") Home
          li: a(href="./showcase.html") Showcase
          li: a(href="./spec.html") Spec
        button.btn(type="button" data-theme-toggle aria-pressed="false") Theme
        button.btn(type="button" data-density-toggle) Density: Default
        span.visually-hidden(data-density-status aria-live="polite")
    main#main
      h1 PyroCarbon v6
      p A dependency-free starting point for a single page.
      h2 Typography
      h3 Heading level 3
      h4 Heading level 4
      h5 Heading level 5
      h6 Heading level 6
      p Body copy with a #[a(href="#main") link] and #[code inline code].
      h2 Buttons
      p
        button.btn(type="button") Primary
        button.btn.btn--secondary(type="button") Secondary
      h2 Code
      pre: code: span.syntax-tag &lt;html&gt;
    footer.c-footer
      p PyroCarbon v6
    script(src="./pyrocarbon.js" defer)
```

- [ ] **Step 2: Write `scripts/build-pages.mjs` and wire `postbuild`**

```js
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pug from 'pug';

const root = resolve(import.meta.dirname, '..');
for (const name of ['boilerplate']) {
  const html = pug.renderFile(resolve(root, `src/pug/${name}.pug`), { basedir: resolve(root, 'src/pug') });
  writeFileSync(resolve(root, `dist/${name}.html`), html);
  console.log(`build-pages: ${name}.html`);
}
```
In `package.json`, add to `scripts`: `"postbuild": "node scripts/build-pages.mjs"`.

- [ ] **Step 3: Verify page lint and build**

Run: `npx pug-lint src/pug/boilerplate.pug` → Expected: exit 0.
Run: `npm run build` → Expected: exit 0; `dist/boilerplate.html` exists.
Run: `npm run lint:html` → Expected: exit 0.

- [ ] **Step 4: Commit**

```powershell
git add v6/src/pug/boilerplate.pug v6/scripts/build-pages.mjs v6/package.json v6/dist/boilerplate.html
git commit -m "feat: add v6 boilerplate page — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:16 complete -->

### Task 17: `gen-spec.mjs` token parser

**Files:**
- Create: `v6/scripts/gen-spec.mjs`
- Modify: `v6/package.json` (add `"prebuild": "node scripts/gen-spec.mjs"`)
- Create: `v6/src/pug/_generated.pug` (generated, tracked)
- Create: `v6/src/styles/_spec-generated.scss` (generated, tracked)
- Modify: `v6/src/styles/index.scss` (append `@use './spec-generated';`)

**Interfaces:**
- Consumes: `src/tokens/_tokens.scss` (Tasks 2–5).
- Produces: `mixin spec-tokens()` in `src/pug/_generated.pug`, included by `spec.pug` (Task 18).

- [ ] **Step 1: Write `scripts/gen-spec.mjs`**

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'src/tokens/_tokens.scss'), 'utf8');
const tokens = [...source.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)]
  .map(([, name, value]) => ({ name, value: value.trim() }))
  .filter((token, index, all) => all.findIndex((other) => other.name === token.name) === index);
const overlay = tokens.find((token) => token.name === '--surface-overlay');
if (!overlay || !overlay.value.includes(',')) throw new Error('gen-spec: rgba value not captured');
const q = JSON.stringify;
const swatchTokens = tokens.filter((t) => /^--(orange|neutral)-/.test(t.name));
const isScale = (name) => /^--text-(xs|sm|base|lg|xl|2xl|3xl|4xl)$/.test(name) || /^--space-\d+$/.test(name);
const swatch = (t, i) => `      li.token-swatch\n        span.sw-${i}\n        code= ${q(t.name)}\n        small= ${q(t.value)}`;
const row = (t) => `      li.token-row\n        code= ${q(t.name)}\n        small= ${q(t.value)}`;
const swatches = swatchTokens.map(swatch).join('\n');
const scales = tokens.filter((t) => isScale(t.name)).map(row).join('\n');
const semantic = tokens.filter((t) => !/^--(orange|neutral)-/.test(t.name) && !isScale(t.name)).map(row).join('\n');
const swatchStyle = swatchTokens.map((t, i) => `.sw-${i} { --swatch: ${t.value}; }`).join('\n');
const out = `// AUTO-GENERATED by scripts/gen-spec.mjs — do not edit.\nmixin spec-tokens()\n  section\n    h2 Token swatches\n    ul.token-grid\n${swatches}\n  section\n    h2 Type and space scales\n    ul.token-list\n${scales}\n  section\n    h2 Semantic and density tokens\n    ul.token-list\n${semantic}\n`;
writeFileSync(resolve(root, 'src/pug/_generated.pug'), out);
writeFileSync(resolve(root, 'src/styles/_spec-generated.scss'), `// AUTO-GENERATED by scripts/gen-spec.mjs — do not edit.\n@layer components {\n${swatchStyle}\n}\n`);
console.log(`gen-spec: ${tokens.length} tokens; overlay=${overlay.value}`);
```
In `package.json`, add to `scripts`: `"prebuild": "node scripts/gen-spec.mjs"`. Append `@use './spec-generated';` to `src/styles/index.scss`.

- [ ] **Step 2: Verify parser fidelity on commas and `clamp()`**

Run: `node scripts/gen-spec.mjs` → Expected: exit 0; stdout contains `overlay=rgba(22,20,19,0.55)`.
Run: `Select-String -Path src/pug/_generated.pug -Pattern 'space-16|orange-5'` → Expected: `--space-16` shows the full `clamp(8rem, 7.25rem + 3.75vw, 11rem)` and `--orange-5` shows `#ff7700`.
Run: `Select-String -Path src/pug/_generated.pug -Pattern 'style="'` → Expected: no matches (swatch colours live in `src/styles/_spec-generated.scss`).
Run: `Select-String -Path src/pug/_generated.pug -Pattern '--accent|--control-height'` → Expected: both present in the semantic and density section; `--text-primary` appears only there, not in the type-scale list.
Run: `Select-String -Path src/styles/_spec-generated.scss -Pattern '\.sw-0'` → Expected: one match.

- [ ] **Step 3: Commit**

```powershell
git add v6/scripts/gen-spec.mjs v6/package.json v6/src/pug/_generated.pug v6/src/styles/_spec-generated.scss v6/src/styles/index.scss
git commit -m "feat: generate v6 spec token sections — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:17 complete -->

### Task 18: Spec page (tokens × 6 theme/density combos)

**Files:**
- Create: `v6/src/pug/spec.pug`
- Create: `v6/src/styles/spec.scss`
- Modify: `v6/src/styles/index.scss` (append `@use './spec.scss';`)
- Modify: `v6/scripts/build-pages.mjs` (`['boilerplate']` → `['boilerplate', 'spec']`)
- Create: `v6/dist/spec.html` (generated, tracked)

**Interfaces:**
- Consumes: `mixin spec-tokens()` (Task 17), component classes (Tasks 9–13), `--space-*`, `--radius-*`, `--pad-card`, `--border-*`.
- Produces: `dist/spec.html` — the visual truth referenced by DoD item 5 (token surface plus the rendered Tier-1 states; the full six-combo state matrix is deferred to v6.1). Page styles live in `src/styles/spec.scss`, not in a Pug `<style>` block.

- [ ] **Step 1: Write `spec.pug` and `spec.scss`**

```pug
include _generated.pug
doctype html
html(lang="en")
  head
    meta(charset="utf-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title PyroCarbon spec
    link(rel="stylesheet" href="./pyrocarbon.css")
  body
    main#main
      h1 PyroCarbon spec
      +spec-tokens()
      section
        h2 Theme and density matrix
        each theme in ['light', 'dark']
          each density in ['compact', 'default', 'comfortable']
            div.combo(data-theme=theme data-density=density)
              h3 #{theme} / #{density}
              p Body sample with #[a(href="#main") link] and #[code code].
              p
                button.btn(type="button") Primary
                button.btn.btn--secondary(type="button") Secondary
              label(for=`field-${theme}-${density}`) Label
              input.form-control(id=`field-${theme}-${density}` type="text")
    script(src="./pyrocarbon.js" defer)
```

Write `src/styles/spec.scss`:

```scss
@layer components {
.token-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: var(--space-3); padding: 0; list-style: none; }
.token-swatch span { display: block; block-size: var(--space-8); border: var(--border-hairline) solid var(--border-default); border-radius: var(--radius-sm); background: var(--swatch); }
.token-row { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); overflow-wrap: anywhere; }
.token-row small { overflow-wrap: anywhere; }
.combo { margin-block-end: var(--space-4); padding: var(--pad-card); border: var(--border-hairline) solid var(--border-default); border-radius: var(--radius-sm); background: var(--surface-canvas); color: var(--text-primary); }
}
```

Append `@use './spec.scss';` to `src/styles/index.scss`.

- [ ] **Step 2: Register the page and build**

Edit `scripts/build-pages.mjs` line to `for (const name of ['boilerplate', 'spec']) {`.
Run: `npm run build` → Expected: exit 0; `dist/spec.html` exists.
Run: `(Select-String -Path dist/spec.html -Pattern 'data-theme=' -AllMatches).Matches.Count` → Expected: `6`.
Run: `(Select-String -Path dist/spec.html -Pattern 'style="' -AllMatches).Matches.Count` → Expected: `0`.
Run: `(Select-String -Path dist/spec.html -Pattern '<style' -AllMatches).Matches.Count` → Expected: `0` (page CSS lives in `spec.scss`).
Run: `npx stylelint "src/styles/spec.scss"` → Expected: exit 0.
Run: `npm run lint:html` → Expected: exit 0.

- [ ] **Step 3: Commit**

```powershell
git add v6/src/pug/spec.pug v6/src/styles/spec.scss v6/src/styles/index.scss v6/scripts/build-pages.mjs v6/dist/spec.html
git commit -m "feat: add v6 spec page — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:18 complete -->

### Task 19: Showcase page (three realistic layouts)

**Files:**
- Create: `v6/src/pug/showcase.pug`
- Modify: `v6/scripts/build-pages.mjs` (`['boilerplate', 'spec']` → `['boilerplate', 'spec', 'showcase']`)
- Create: `v6/dist/showcase.html` (generated, tracked)

**Interfaces:**
- Consumes: component classes from Tasks 9–13, including `.o-code-block`, `.form-error`, `.form-check`, `.c-sidebar`.
- Produces: `dist/showcase.html` — DoD item 6.

- [ ] **Step 1: Write `showcase.pug`**

```pug
doctype html
html(lang="en")
  head
    meta(charset="utf-8")
    meta(name="viewport" content="width=device-width, initial-scale=1")
    title PyroCarbon showcase
    link(rel="stylesheet" href="./pyrocarbon.css")
  body
    a.skip-link(href="#main") Skip to content
    header.site-header
      nav.site-nav(aria-label="Primary")
        a(href="./showcase.html" aria-current="page") PyroCarbon
        button.site-nav__toggle(type="button" data-nav-toggle aria-expanded="false" aria-controls="showcase-nav") Menu
        ul#showcase-nav.site-nav__list
          li: a(href="./boilerplate.html") Boilerplate
          li: a(href="./spec.html") Spec
        button.btn(type="button" data-theme-toggle aria-pressed="false") Theme
        button.btn(type="button" data-density-toggle) Density: Default
        span.visually-hidden(data-density-status aria-live="polite")
    main#main
      h1 Showcase
      section#layout-doc
        h2 Documentation layout
        p A two-column reading layout with a sticky contents rail.
        .doc-layout
          nav.c-sidebar(aria-label="Contents")
            h3.c-sidebar__title Contents
            ul.c-sidebar__nav
              li: a(href="#layout-doc" aria-current="page") Documentation
              li: a(href="#layout-form") Form
          div.doc-content
            pre.o-code-block: code
              span &lt;#[span.syntax-tag section]&gt;
              span &lt;/#[span.syntax-tag section]&gt;
      section#layout-form
        h2 Form layout
        form
          .form-group
            label(for="showcase-email") Email
            input#showcase-email.form-control(type="email" aria-describedby="showcase-email-error" aria-invalid="true")
            p#showcase-email-error.form-error Enter a valid address.
          .form-check
            input#showcase-terms(type="checkbox")
            label(for="showcase-terms") I accept the terms
          button.btn(type="submit") Save
      section
        h2 Editorial layout
        p A single-column essay using the body measure, built from typography alone.
        p Try #[code a-very-long-unbreakable-token-name-that-must-wrap-across-lines-without-scrolling].
        blockquote: p Type is the interface.
    footer.c-footer
      p PyroCarbon showcase
    script(src="./pyrocarbon.js" defer)
```

- [ ] **Step 2: Register the page and build**

Edit `scripts/build-pages.mjs` line to `for (const name of ['boilerplate', 'spec', 'showcase']) {`.
Run: `npm run build` → Expected: exit 0; `dist/showcase.html` exists.
Run: `(Select-String -Path dist/showcase.html -Pattern '<section' -AllMatches).Matches.Count` → Expected: `3`.
Run: `npm run lint:html` → Expected: exit 0.

- [ ] **Step 3: Commit**

```powershell
git add v6/src/pug/showcase.pug v6/scripts/build-pages.mjs v6/dist/showcase.html
git commit -m "feat: add v6 showcase page — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:19 complete -->

### Task 20: Tailwind v4 `@theme` track

**Files:**
- Create: `v6/src/tokens/_tailwind-theme.css`

**Interfaces:**
- Consumes: semantic tokens (Task 4) and spacing/radius primitives (Task 3) by `var()` reference only.
- Produces: a thin Tailwind v4 entry that consumers import alongside the compiled token CSS; utilities resolve to `var(--…)` (DoD item 10).

- [ ] **Step 1: Write `_tailwind-theme.css`**

```css
@import "tailwindcss";

@theme {
  --color-surface-canvas: var(--surface-canvas);
  --color-surface-raised: var(--surface-raised);
  --color-surface-sunken: var(--surface-sunken);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-accent: var(--text-accent);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-accent-subtle: var(--accent-subtle);
  --color-border-default: var(--border-default);
  --spacing-1: var(--space-1);
  --spacing-2: var(--space-2);
  --spacing-4: var(--space-4);
  --spacing-8: var(--space-8);
}

/* This track maps names to token custom properties; it does not define them.
   Consumers must also load the compiled token CSS (dist/pyrocarbon.css) or a
   tokens-only CSS emitted alongside. Without it, --color-*/--spacing-* resolve
   to nothing, and unmapped --text-*/--font-*/--radius-* names fall back to
   Tailwind's default theme values (e.g. text-sm = 14px, not the fluid clamp). */
```

- [ ] **Step 2: Verify the block compiles and maps to variables**

Run: `Set-Content -Path probe.html -Value '<div class="bg-surface-canvas p-4 text-sm font-display"></div>'` (Tailwind v4 tree-shakes unused `@theme` keys, so the probe must contain a consumer).
Run: `npx @tailwindcss/cli -i src/tokens/_tailwind-theme.css -o dist/tailwind-probe.css` → Expected: exit 0.
Run: `Select-String -Path dist/tailwind-probe.css -Pattern '--spacing-4: var\(--space-4\)|\.bg-surface-canvas'` → Expected: two matches.
Run: `Remove-Item dist/tailwind-probe.css, probe.html` → Expected: no error.

- [ ] **Step 3: Commit**

```powershell
git add v6/src/tokens/_tailwind-theme.css
git commit -m "feat: add v6 tailwind theme track — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:20 complete -->

### Task 21: Playwright property assertions

**Files:**
- Create: `v6/playwright.config.ts`
- Create: `v6/test/spec.spec.ts`

**Interfaces:**
- Consumes: `dist/*.html` (Tasks 16–19) served by `npm run preview`; toggle contracts (Task 14).
- Produces: `npm test` gate used by `npm run verify` (Task 24).

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  use: { baseURL: 'http://localhost:4173' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4173/boilerplate.html', reuseExistingServer: true },
});
```

- [ ] **Step 2: Write `test/spec.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const pages = ['/boilerplate.html', '/showcase.html', '/spec.html'];
const widths = [320, 768, 1440];

for (const path of pages) {
  for (const width of widths) {
    test(`${path}: no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test(`${path}: no console errors or failed requests`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('requestfailed', (req) => errors.push(`${req.url()} ${req.failure()?.errorText}`));
    await page.goto(path);
    expect(errors).toEqual([]);
  });
}

test('theme toggle changes computed canvas color', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.click('[data-theme-toggle]');
  const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(after).not.toBe(before);
});

test('density toggle changes control height', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const before = await page.evaluate(() => getComputedStyle(document.querySelector('main .btn')!).minHeight);
  await page.click('[data-density-toggle]');
  const after = await page.evaluate(() => getComputedStyle(document.querySelector('main .btn')!).minHeight);
  expect(after).not.toBe(before);
});

test('density control exposes the current value', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const toggle = page.locator('[data-density-toggle]');
  await expect(toggle).toHaveText('Density: Default');
  await toggle.click();
  await expect(toggle).toHaveText('Density: Comfortable');
  await expect(page.locator('[data-density-status]')).toHaveText('Density: Comfortable');
});

test('touch targets meet density floors', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const height = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('main .btn')!).minHeight));
  expect(await height()).toBeGreaterThanOrEqual(44);
  await page.click('[data-density-toggle]');
  expect(await height()).toBeGreaterThanOrEqual(48);
});

test('spec combos do not leak theme colors', async ({ page }) => {
  await page.goto('/spec.html');
  const colors = await page.evaluate(() => {
    const pick = (theme: string) => getComputedStyle(document.querySelector(`.combo[data-theme="${theme}"]`)!).color;
    return [pick('light'), pick('dark')];
  });
  expect(colors[0]).not.toBe(colors[1]);
});

test('focus-visible outline present after keyboard tab', async ({ page }) => {
  await page.goto('/boilerplate.html');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe('none');
});

test('toggles work when storage throws', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('blocked'); };
    Storage.prototype.setItem = () => { throw new Error('blocked'); };
  });
  await page.goto('/boilerplate.html');
  await page.click('[data-theme-toggle]');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
});

test('zero-JS default renders light with no theme attribute', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/boilerplate.html');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(236, 234, 233)');
  await context.close();
});

test('boilerplate renders in all six theme/density combos', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const apply = (theme: string, density: string) => page.evaluate(([t, d]) => {
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.density = d;
    return getComputedStyle(document.body).backgroundColor;
  }, [theme, density]);
  const light = await apply('light', 'default');
  const dark = await apply('dark', 'default');
  expect(dark).not.toBe(light);
  for (const theme of ['light', 'dark']) {
    for (const density of ['compact', 'default', 'comfortable']) {
      await apply(theme, density);
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      expect(await page.evaluate(() => document.documentElement.dataset.density)).toBe(density);
    }
  }
});

test('AA contrast for rendered text pairs in both themes', async ({ page }) => {
  const parse = (value: string) => value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
  const luminance = (rgb: number[]) => rgb
    .map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const check = async (fgSel: string, bgSel: string) => {
    const [fg, bg] = await page.evaluate(([f, b]) => [
      getComputedStyle(document.querySelector(f)!).color,
      getComputedStyle(document.querySelector(b)!).backgroundColor,
    ], [fgSel, bgSel]);
    expect(contrast(parse(fg), parse(bg)), `${fgSel} on ${bgSel}`).toBeGreaterThanOrEqual(4.5);
  };

  for (const theme of ['light', 'dark']) {
    await page.goto('/boilerplate.html');
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; }, theme);
    await check('body', 'body');
    await check('main p', 'body');
    await check('main a', 'body');
    await check('.site-nav', '.site-nav');
    await check('.btn', '.btn');
    await check('code', 'code');
    await check('.syntax-tag', 'pre');
  }
});
```

- [ ] **Step 3: Install Chromium and run the suite**

Run: `npx playwright install chromium` → Expected: browser downloaded (or already present).
Run: `npm test` → Expected: all tests pass; `webServer` starts and stops automatically.

- [ ] **Step 4: Commit**

```powershell
git add v6/playwright.config.ts v6/test/spec.spec.ts
git commit -m "test: add v6 playwright property assertions — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:21 complete -->

### Task 22: `DESIGN.md` — persistent constitution

**Files:**
- Create: `v6/DESIGN.md`

**Interfaces:**
- Consumes: decisions from the spec (§4, §6.1, §10, §11); shipped token/class names.
- Produces: the agent-facing rule document; DoD item 1.

- [ ] **Step 1: Write `DESIGN.md`**

```markdown
# PyroCarbon design constitution

## Brand identity
Anchor orange `#ff7700`; neutrals tinted 8% toward the anchor hue; asymmetric top-only radii; hairline elevation. Orange is an accent, never a page-wide cast. No violet gradient heroes.

## Token philosophy
Three tiers in `src/tokens/_tokens.scss`: primitives (fixed values, every theme/density), semantic roles (switched by `[data-theme]`), density aliases (switched by `[data-density]`). Primitives never change; semantics switch; density is orthogonal to both.

## Reserved oranges
`#f60` (`--orange-60`) and `#f93` (`--orange-93`) are documented swatches only. Never use them in component CSS.

## Matrix
Themes: light, dark. Densities: compact, default, comfortable. Six combinations. `dist/spec.html` is the visual truth; `_tokens.scss` is the value truth.

## Composition
- Body measure comes from `--measure-body`; rhythm comes from `--space-*` only.
- Heading/body contrast comes from the display role plus the fluid scale.
- One elevation strategy per component class (`--elevation-strategy`).

## Do not
- `background-clip: text`, gradient text, purple heroes.
- Three-column icon-over-heading grids without a layout reason.
- Card-in-card without a semantic reason.
- Uniform `1rem` gaps.
- Pure `#000`/`#fff` surfaces, or dead gray (`hsl(0 0% …)`).
- Three shadow languages.
- Hardcoded hex in demo assets (SVG, Pug inline).
- `!important` outside `reset.scss`.

## Accessibility
Phase 1 ships: semantic landmarks, `label for`, skip link, `:focus-visible`, `prefers-reduced-motion`, AA contrast, 44px default / 48px comfortable targets, and error states that do not rely on color alone. Phase 2 (v6.1+): WCAG 2.2 AA audit, screen readers, modal focus traps, 200% zoom.
```

- [ ] **Step 2: Verify content covers the spec's §6.1 list**

Run: `Select-String -Path DESIGN.md -Pattern 'Brand identity|Token philosophy|Reserved oranges|Matrix|Composition|Do not|Accessibility'` → Expected: seven matches.

- [ ] **Step 3: Commit**

```powershell
git add v6/DESIGN.md
git commit -m "docs: add v6 design constitution — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:22 complete -->

### Task 23: `README.md` — human onboarding

**Files:**
- Create: `v6/README.md`

**Interfaces:**
- Consumes: shipped commands (Task 1), output paths (Tasks 15–19), Tailwind entry (Task 20).
- Produces: DoD item 2.

- [ ] **Step 1: Write `README.md`**

```markdown
# PyroCarbon v6

PyroCarbon is a private, framework-free HTML/CSS/JS design system. One token source produces two outputs: a standalone `dist/` you can drop into any page, and a Tailwind v4 `@theme` block for app work. It is not published to npm and is not a component framework.

## Structure
`src/tokens/` canonical values · `src/styles/` reset, base, components · `src/pug/` pages · `src/js/` toggles · `scripts/` generators · `dist/` built output (tracked, never hand-edited). See `DESIGN.md` for the persistent design contract.

## Commands
- `npm install`
- `npx playwright install chromium` — one-time browser install for `npm test`
- `npm run dev` — Vite dev server for CSS/JS only (pages are not served)
- `npm run build` — token sections, Vite build, then page render
- `npm run preview` — serve the built pages from `dist/`
- `npm run lint` — stylelint + html-validate + pug-lint
- `npm run verify` — build + lint + Playwright

## Windows notes
PowerShell-first. LF endings are enforced by `.gitattributes`. Imports must match file case exactly (no configured lint enforces this; Windows is case-insensitive, Linux is not). `npm run dev` does not run `prebuild`, so run `node scripts/gen-spec.mjs` manually if `_generated.pug` goes stale.

## Standalone use
Copy `dist/`, link `pyrocarbon.css`, include `pyrocarbon.js`, and set `data-theme` and `data-density` on `<html>`. No build step and no framework are required.

## Tailwind v4 use
Import `src/tokens/_tailwind-theme.css` together with the compiled token CSS (`dist/pyrocarbon.css`, or a tokens-only CSS emitted alongside). The theme track maps utilities to the token custom properties but does not define them; without the token CSS, `--color-*`/`--spacing-*` resolve to nothing and unmapped `--text-*`/`--font-*`/`--radius-*` names fall back to Tailwind defaults. Then use utilities such as `bg-surface-canvas`, `text-text-primary`, and `p-4`. Theme and density switch through the same HTML attributes; no `dark:` or `compact:` variants.

## Versioning
One folder per major (`/v6/`); minor iterations overwrite within the folder; previous majors are never touched (`/5.2/` retained).

## License
MIT.
```

- [ ] **Step 2: Verify the command list matches `package.json`**

Run: `Select-String -Path package.json -Pattern '"dev"|"build"|"lint"|"verify"|"preview"'` → Expected: five matches.
Run: `Select-String -Path README.md -Pattern 'npm run dev|npm run build|npm run lint|npm run verify'` → Expected: four matches.

- [ ] **Step 3: Commit**

```powershell
git add v6/README.md
git commit -m "docs: add v6 readme — docs/plans/20261108-pyrocarbon-v6-plan.md"
```
<!-- section:23 complete -->

### Task 24: Full gate and definition-of-done audit

**Files:**
- Modify: `v6/dist/*`, `v6/src/pug/_generated.pug` (regenerated, committed if changed)

**Interfaces:**
- Consumes: every prior task.
- Produces: the verification evidence that closes DoD items 3–14.

- [ ] **Step 1: Regenerate from a clean build**

Run (in `v6/`): `npm run build` → Expected: exit 0; `dist/` contains `pyrocarbon.css`, `pyrocarbon.js`, `boilerplate.html`, `showcase.html`, `spec.html`.
Run: `Get-ChildItem dist | Select-Object -ExpandProperty Name` → Expected: those five names.

- [ ] **Step 2: Run the full gate**

Run: `npx playwright install chromium` → Expected: ok/already installed.
Run: `npm run verify` → Expected: build, stylelint, html-validate, pug-lint, and Playwright all pass (exit 0).

- [ ] **Step 3: Audit the definition of done**

Run (in `v6/`): `(Select-String -Path dist/*.css,dist/*.html -Pattern 'bootstrap|jquery|tether' -AllMatches).Matches.Count` → Expected: `0` (DoD item 9).
Run (in `v6/`): `(Select-String -Path dist/spec.html -Pattern 'data-theme=' -AllMatches).Matches.Count` → Expected: `6` (DoD item 5).
Run (at repo root): `git diff --name-only master...HEAD -- 5.2` → Expected: no output (legacy untouched, DoD item 14).
Run (in `v6/`): `(Select-String -Path src/tokens/_tailwind-theme.css -Pattern 'var\(--' -AllMatches).Matches.Count` → Expected: ≥ 14 (DoD item 10 mappings present; the resolution check is Task 20 Step 2).
Run (at repo root): `git status --short` → Expected: only regenerated `dist/` and `_generated.pug` entries, or clean (baseline against the branch point, not the pre-existing untracked `docs/`).

- [ ] **Step 4: Commit regenerated artifacts**

```powershell
git add v6/dist v6/src/pug/_generated.pug
git commit -m "chore: regenerate v6 dist for release — docs/plans/20261108-pyrocarbon-v6-plan.md"
```

- [ ] **Step 5: Record the evidence**

Paste the exact output of Step 2 and Step 3 into the completion report. Also paste the agent self-review checklist — semantic tokens only, the Tier-1 states exercised by the three pages, all six combos exercised on boilerplate, and the contrast ratios printed by the Task 21 AA test in both themes (DoD item 12). Do not claim completion without it.
<!-- section:24 complete -->
