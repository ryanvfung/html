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
