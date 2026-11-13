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
