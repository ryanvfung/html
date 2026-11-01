# PyroCarbon v6 — Design Plan

**Status:** Design plan, ready for implementation-plan decomposition
**Supersedes:** v5.2 (`/v5.2/`, untouched, retained as legacy reference)
**Owner:** Ryan Fung (private, personal use)
**Agent workflow:** design → (review) → plan → (review) → implement → (verify) → ship
**This document's fate:** archived after v6.0 ships; its decisions become the seed of DESIGN.md.

---

## 1. Goals

Rebuild the handcrafted `html` template (v5.2, PyroCarbon) as an **agentic design system** — one source of truth for tokens, two distribution targets, modern CSS, no Bootstrap, Windows-first build, with a persistent DESIGN.md as the agent's constitution and ephemeral workflow docs for each iteration.

Success = one token source produces (a) a standalone `dist/` ready to drop into any one-off HTML page, and (b) a Tailwind v4 `@theme` block that derives utilities for the user's web apps. Neither track drifts from the other.

Non-goals for v6.0: publishing to npm, JS component framework, full WCAG audit (phase 2), pixel-diff visual regression.

---

## 2. Scope

### In v6.0
- Three-tier token system (primitives → fluid → semantic → density), derived from v5.2's actual values.
- Light + dark themes, three density levels (compact / default / comfortable), both switchable at runtime.
- Standalone track: `dist/pyrocarbon.css`, `dist/pyrocarbon.js` (~40 lines), `dist/boilerplate.html`, `dist/showcase.html`, `dist/spec.html`.
- Tailwind v4 track: `@theme` block mapping tokens to utilities.
- Lint stack: stylelint (SCSS) + html-validate (compiled HTML) + pug-lint (source Pug).
- Playwright property assertions (no pixel-diff).
- DESIGN.md (persistent, high-level, agent-facing).
- README.md (human onboarding, build commands, versioning).

### Deferred to v6.1+
- Full WCAG 2.2 AA audit + screen reader testing.
- JS component layer (anything beyond toggles + nav). No components that require a JS framework.
- Visual regression baselines.
- Publish tooling.
- Additional themes beyond light/dark.

### Explicitly dropped
- Bootstrap 4.0.0-alpha.4 (and any Bootstrap version).
- CDN JS (jQuery, Tether).
- Legacy Sass functions (`darken`, `lighten`, `adjust-hue`, `transparentize`).
- Adobe Color `$base1`–`$base4` dead palette.
- `node-sass`.
- Hardcoded `#b58900` (inline syntax highlight) and `#f60` (SVG demo) — both become tokens or removed.

---

## 3. Locked architecture decisions

| # | Decision | Value |
|---|---|---|
| A | Token topology | One source, two generated outputs. Standalone is primary. |
| B | Scaling contract | `html` is the only font-size lever. `body` is `1rem`. Never px `font-size` on body. |
| C | Spec vs showcase | `spec.html` generated from tokens (exhaustive, matrix-complete); `showcase.html` curated (realistic compositions). Two files. |
| D | Build tool | Vite, Windows-first, PowerShell default, full Linux/macOS compat. |
| E | Component split | No-frills dist ships basics; Tier 2 interactive UI lives in showcase/app. |
| F | Theme/density scope | Per-page on `<html>`, per-component override via class allowed. |
| G | Lint + verify | stylelint, html-validate, pug-lint; agent has terminal; Playwright; human gate on final viz. |
| H | JS ceiling | `dist/pyrocarbon.js` = theme toggle + density toggle + nav toggle + localStorage + `prefers-color-scheme` sync. Nothing else. |
| I | Tailwind integration | v4 `@theme` reads CSS custom properties. Theme/density switching is CSS-variable-based, not Tailwind-variant-based. |
| J | Folder | `/v6/`, minor iterations overwrite within folder until next major. |
| K | Definition of done | See §12. |
| L | Platform | Windows first, Linux/macOS compat maintained. `cross-env`, `path.join`, case-sensitive imports, LF endings via `.gitattributes`. |
| M | Naming | Brand name **PyroCarbon**. No version in filenames. No publishing. `"private": true`. |
| N | A11y split | Phase 1 = structural/semantic/focus/contrast/touch (build now); Phase 2 = formal audit (v6.1+). See §11. |
| O | Browser baseline | Modern evergreen, last 2 versions of Chrome/Edge/Firefox/Safari. `clamp()`, `color-mix()`, `@layer`, `:has()`, `<dialog>`, Popover API all available. |
| P | Playwright scope | Property assertions only. No pixel-diff. No screenshot artifacts for review (human renders themselves). |
| R | Verify default | Build + lint always run. Playwright opt-in. |
| S | Document ownership | DESIGN.md is persistent constitution; design docs and plans are skill-owned ephemeral workflow artifacts. This design plan is archived after ship. |
| T | DESIGN.md tone | Internal, opinionated, terse. Not marketing. |
| U | Harness | PowerShell. Agent harness details are the user's concern. |

---

## 4. Token architecture

Three tiers, one CSS file.

**Tier 1 — Primitives.** Raw values, context-free, identical across all themes and densities. Fixed sets:
- Orange ramp `--orange-0` … `--orange-9`, derived from `#f70` (current default). `#f60` and `#f93` preserved as standalone swatch variables (`--orange-60`, `--orange-93`) for documentation and opt-in accent swaps, never used in component CSS.
- Neutral ramp `--neutral-0` … `--neutral-10`, tinted 8% toward the anchor hue (replaces v5.2's pure `hsl(0 0% …)` — the dead-gray fix).
- Font stacks: `--font-display`, `--font-body`, `--font-mono`. Body and display intentionally both Maven Pro in the baseline preset; the *role split* is what's new.
- Fluid type scale `--text-xs` … `--text-4xl` via `clamp()`.
- Structural constants: `--nav-height`, `--radius-sm`, `--radius-card` (asymmetric top-only — v5.2 signature preserved), `--radius-input` (asymmetric top-only), `--border-hairline`, `--border-strong`.
- Density-independent spacing scale `--space-1` … `--space-16` as fluid `clamp()` values.

**Tier 2 — Semantic.** Role-based aliases, switched by theme. Sets: surfaces (`--surface-canvas`, `--surface-raised`, `--surface-sunken`, `--surface-overlay`), text (`--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`, `--text-accent`, `--text-code`), borders (`--border-default`, `--border-strong`, `--border-accent`), accents (`--accent`, `--accent-hover`, `--accent-active`, `--accent-subtle`), interaction (`--selection-bg`, `--selection-fg`, `--focus-ring`), elevation (`--elevation-strategy`, `--shadow-nav`, `--shadow-card`), syntax highlighting (`--syntax-tag`, `--syntax-string`, `--syntax-comment`, `--syntax-keyword` — the `#b58900` fix).

**Tier 3 — Density aliases.** Orthogonal to theme. Remapped under `[data-density="compact|default|comfortable"]`: `--control-height`, `--control-padding-x/y`, `--pad-card`, `--gap-grid`, `--leading-body`, `--leading-tight`, `--measure-body`. Density does **not** change color or primitive scale — only semantic composition aliases.

**Rules the token layer must obey:**
- Every color a component uses is a semantic token, never a primitive.
- Every spacing value a component uses is a `--space-*` or a density alias, never a raw value.
- No raw hex outside the token file. Lint-enforced.
- No `px` in spacing/padding/margin/font-size. Lint-enforced.
- No `font-family` outside the token file. Lint-enforced.
- Every token consumed by Tailwind v4 `@theme` maps via `--color-*`, `--spacing-*`, `--font-*`, `--radius-*`.

---

## 5. Two-track output

**Track 1 — Standalone `dist/`.** Primary product. Ships:
- `dist/pyrocarbon.css` (all tiers + base + components + density/theme variants).
- `dist/pyrocarbon.js` (~40 lines: theme toggle, density toggle, nav toggle, localStorage, `prefers-color-scheme` sync).
- `dist/boilerplate.html` (starter page; semantic containers, one of each h1–h6, skip link, header/nav/footer, no JS required to render).
- `dist/showcase.html` (curated component demonstration).
- `dist/spec.html` (generated — every token and every component state in all 6 theme×density combos).

Consumers copy `dist/` and edit HTML. No build step for them. No framework.

**Track 2 — Tailwind v4 integration.** Same token source. A `@theme` block maps semantic tokens to Tailwind utilities (`--color-surface-canvas`, `--color-text-primary`, etc.). Because v4 generates utilities referencing CSS variables, density and theme switching work automatically via the cascade; no `dark:` or `compact:` variant classes needed. This track is a thin integration layer, not a fork.

**No drift rule:** any change to `_tokens.scss` regenerates both outputs. Neither track is ever edited by hand.

---

## 6. Document artifacts

### 6.1 `v6/DESIGN.md` — persistent, high-level, agent-facing

**Purpose:** The agent's constitution. Read before any design work. Not a component spec. Not a workflow doc. Short.

**Contents:**
- **Brand identity.** PyroCarbon: anchor orange, tinted neutrals, asymmetric-radius signature, hairline elevation preference. Why these choices.
- **Token philosophy.** The three-tier model, the "primitives never change, semantics switch" rule, the "density is orthogonal to theme" rule.
- **Reserved oranges.** `#f60` and `#f93` documented as swatches with "not in component code" note.
- **Density × theme matrix.** The 3×2 grid, named and described.
- **Composition principles.** Measure, rhythm, elevation strategy, heading-to-body contrast.
- **Do-not list** (see §10).
- **Accessibility stance.** Phase 1 vs Phase 2 split (§11).
- **Reference to spec.html** as the visual truth.

**Tone:** internal, terse, opinionated. Written for the agent and the user as reviewer. No marketing voice. It should read like a short set of rules, not a brochure.

**Not in DESIGN.md:** component API docs, exact token values (those live in `_tokens.scss`; DESIGN.md describes *categories*), implementation plans, per-component decisions.

**Ownership:** Seeded by this design plan's decisions. Persistent. Amended only when a fundamental decision changes.

### 6.2 `v6/README.md` — human onboarding

**Contents:**
- One-paragraph description: what PyroCarbon is, who it's for (you), what it isn't (published, framework).
- **Structure map** (§7 below).
- **Build commands**, PowerShell-first: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run verify`.
- **Windows notes:** PowerShell default, `cross-env` where env vars needed, LF line endings via `.gitattributes`, case-sensitive imports (enforced by lint).
- **Consumption — standalone:** copy `dist/`, include `<link>` and `<script>`, set `data-theme` and `data-density` on `<html>`.
- **Consumption — Tailwind v4:** import `@theme` block, use utilities derived from tokens, density/theme switch via HTML attributes.
- **Versioning policy:** each major gets a `/vN/` folder. Minor iterations overwrite within the folder until the next major. Previous majors never touched. Legacy `/v5.2/` retained.
- **Workflow note:** design → review → plan → review → implement → verify → ship, all skill-driven. README links to DESIGN.md as the persistent contract.
- **License:** MIT (preserved from v5.2).

### 6.3 Workflow documents (not written by this plan)

Owned by the user's design-review and plan skills. Each iteration produces:
- A **design document** (per-iteration precursor to plan, archived after ship).
- An **implementation plan** (step-by-step, defines exactly how each file is written).

These are not deliverables of this design plan. This design plan is the input that the plan skill consumes.

---

## 7. Source file inventory

```
/v5.2/                          (untouched, legacy)
/v6/
  DESIGN.md                     (persistent, high-level)
  README.md                     (human onboarding)
  package.json                  ("private": true, "name": "pyrocarbon")
  .gitattributes                (eol=lf for *)
  .stylelintrc.mjs
  .htmlvalidate.json
  .pug-lintrc.json
  vite.config.ts                (Pug + SCSS + Tailwind v4 plugins)
  playwright.config.ts
  /src/
    /tokens/
      _tokens.scss              (canonical — primitives, fluid, semantic, density)
      _tailwind-theme.css       (@theme block for Tailwind v4 track)
    /styles/
      reset.scss                (minimal modern reset)
      base.scss                 (element styles, typography)
      components/               (one file per component; button.scss first)
      utilities.scss            (thin utility layer if needed)
      index.scss                (the cascade-layer entry that imports everything)
    /pug/
      boilerplate.pug           (starter page)
      showcase.pug              (curated demo)
      spec.pug                  (token + component matrix, generated sections via build script)
    /js/
      pyrocarbon.js             (toggles + localStorage + prefers-color-scheme)
  /scripts/
    gen-spec.mjs                (reads tokens, emits swatches and scales into spec.html)
  /dist/                        (all outputs; never edited by hand)
    pyrocarbon.css
    pyrocarbon.js
    boilerplate.html
    showcase.html
    spec.html
  /test/
    spec.spec.ts                (Playwright property assertions)
```

---

## 8. Build system

**Vite**, Windows-first. Plugins: `vite-plugin-pug` (or equivalent), Vite SCSS support (native, Dart Sass), `@tailwindcss/vite` (v4 plugin). `scripts/gen-spec.mjs` runs as a Vite build hook or pre-build step.

**Commands** (PowerShell-compatible; `cross-env` if env vars are needed):
- `npm run dev` — Vite dev server with HMR.
- `npm run build` — full build, produces all `dist/` artifacts including generated spec sections.
- `npm run lint` — stylelint + html-validate + pug-lint, sequential.
- `npm run verify` — build, then lint, then opt-in `npx playwright test`.

**Case-sensitivity rule:** all imports match file case exactly (lint-enforced), even though Windows won't catch mismatches.

---

## 9. Lint stack

| Layer | Tool | Config file | Purpose |
|---|---|---|---|
| SCSS | stylelint | `.stylelintrc.mjs` | Raw hex outside tokens, no `px` in spacing, no arbitrary `font-family`, no `!important`, no `background-clip: text`, no `linear-gradient` on text, no legacy Sass functions, undeclared custom properties, `@layer` discipline |
| Compiled HTML | html-validate | `.htmlvalidate.json` | Semantic elements, `label for`, `alt`, heading order, no inline `style=`, unique IDs, `lang` present |
| Pug source | pug-lint | `.pug-lintrc.json` | Indentation consistency, no inline `style=` in source, structural conventions |

**Stylelint ruleset (target):**
- `color-no-hex` outside `_tokens.scss` (scoped via `overrides`).
- `declaration-property-value-disallowed-list` for `px` on `padding|margin|gap|font-size`.
- `function-disallowed-list` for `darken|lighten|adjust-hue|transparentize`.
- Value rule disallowing `background-clip: text` idiom and `linear-gradient` on text.
- `selector-max-specificity` to prevent override wars.
- `custom-property-pattern` enforcing `--{tier}-{role}-{variant}` naming.
- `no-invalid-position-at-import-rule` for `@layer`.

**html-validate on `dist/` output**, not Pug source — errors trace back via the agent.

**Note:** JS lint deferred to v6.1 unless JS surface grows past ~150 lines. `dist/pyrocarbon.js` is ~40 lines; ceremony outweighs value.

---

## 10. Anti-slop rules (encoded in DESIGN.md do-not list)

These are the failure modes to guard against. The agent must not ship them, and DESIGN.md states them explicitly:

- **No purple/violet gradient heroes.** No `linear-gradient` on text (`background-clip: text`). This is the AI-default tell.
- **No single-family body text without a declared role split.** Display and body tokens must be defined separately, even if they point to the same font in the baseline preset.
- **No 3-column icon-over-heading feature grids** without a layout reason. If a feature section exists, vary column widths or drop cards for typographic rhythm.
- **No card-in-card nesting** without semantic reason.
- **No default-attractor spacing** (uniform `1rem` gaps everywhere). Space comes from tokens; rhythm is intentional.
- **No pure `#000` or `#fff` surfaces.** Tinted neutrals only; text uses `--text-primary`, not black.
- **No dead gray** (`hsl(0 0% …)`). Neutrals are tinted toward the anchor hue.
- **No three shadow languages.** Pick one elevation strategy per component class; `--elevation-strategy` in the semantic layer is the switch.
- **No hardcoded hex in demo assets.** The v5.2 smiley SVG's `#f60` and the inline `#b58900` syntax-highlight color are what this rule prevents.
- **No `!important`** except in the reset layer where documented.

---

## 11. Accessibility scope

**Phase 1 — built into v6.0:**
- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<button>` (not `<div>`), `<label for>` on every input.
- `:focus-visible` on every interactive element.
- Skip link in boilerplate.
- Keyboard tab order follows DOM naturally.
- `prefers-reduced-motion` honored (one media query disabling transitions).
- WCAG AA color contrast, both themes.
- Touch targets ≥ 44px in default density, ≥ 48px in comfortable.
- Form labels + `aria-describedby` for errors.
- Error states not conveyed by color alone (icon or text in addition to border).

**Phase 2 — v6.1+ formal audit:**
- WCAG 2.2 AA full audit.
- Screen reader testing (NVDA on Windows).
- Keyboard-trap testing in modals.
- Focus management in `<dialog>` and popovers.
- Zoom to 200%.
- Motion-safe beyond `prefers-reduced-motion`.

---

## 12. Verification & definition of done

**Verification stack:**
- **Build + lint** run every iteration (mandatory).
- **Playwright property assertions** (opt-in): no horizontal scrollbar at 320/768/1440px; expected elements visible; `:focus-visible` outline present after keyboard tab; `data-theme` and `data-density` change computed values; no console errors; no failed network requests. **No pixel-diff. No screenshot artifacts.**
- **Agent self-review checklist** (pasted in iteration output): uses only semantic tokens? All states covered? Works in all 6 theme×density combos? Contrast checked?
- **Human visual gate** on final rendered `spec.html` and `showcase.html`.

**Definition of done for v6.0:**

1. `DESIGN.md` complete (per §6.1).
2. `README.md` complete (per §6.2).
3. `_tokens.scss` canonical; no raw values in component CSS (stylelint passes).
4. `dist/boilerplate.html` renders correctly in 2 themes × 3 densities.
5. `dist/spec.html` generated; shows all tokens + all components in all 6 combos.
6. `dist/showcase.html` demonstrates ≥ 3 realistic layouts.
7. WCAG AA contrast passes in both themes.
8. Touch targets ≥ 44px default, ≥ 48px comfortable.
9. No Bootstrap; no CDN JS; no hardcoded hex outside tokens.
10. Tailwind `@theme` block matches token semantics; utilities resolve to `var(--…)`.
11. Playwright property assertions pass.
12. Agent self-review output included in ship artifact.
13. No hardcoded hex in demo assets (SVG, Pug inline).
14. Legacy `/v5.2/` untouched.

---

## 13. Handoff to the plan skill

The plan skill should decompose this document into ordered implementation steps. Recommended first principles:

1. **Token layer first.** `_tokens.scss` is upstream of everything else. If tokens are wrong, everything downstream drifts.
2. **Lint before components.** Stylelint config enforces the contract from the first component onward; setting it up early prevents rework.
3. **Button first.** It touches accent, border, radius, density, theme, focus, and states — the smallest vertical slice that proves the whole pipeline.
4. **Spec page early.** The generated spec page is the visual truth the agent iterates against. It should exist before the second component.
5. **Rest of Tier 1** in dependency order (forms depend on inputs; alerts depend on color tokens; etc.).
6. **Showcase last.** Curated compositions require all components.
7. **Playwright assertions** added as each component lands, not retrofitted at the end.

**Open for the plan skill to decide:**
- Exact ordering within Tier 1 components.
- Whether to scaffold all config files (stylelint, html-validate, pug-lint, vite, playwright) upfront or incrementally.
- Whether `gen-spec.mjs` runs as pre-build or during Vite build.
- Whether Tailwind `@theme` is authored before or after standalone CSS.

Nothing in this document is deferred to user input. It is ready for decomposition.

---