import '../styles/index.scss';

/** @typedef {'light' | 'dark'} Theme */
/** @typedef {'compact' | 'default' | 'comfortable'} Density */

const root = document.documentElement;
const storage = {
  /** @param {string} key @returns {string | null} */
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  /** @param {string} key @param {string} value */
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeButtons = document.querySelectorAll('[data-theme-toggle]');
const densityButtons = document.querySelectorAll('[data-density-toggle]');
/** @type {Density[]} */
const densityOrder = ['compact', 'default', 'comfortable'];
/** @type {Record<Density, string>} */
const densityLabels = { compact: 'Compact', default: 'Default', comfortable: 'Comfortable' };

/** @param {string | null | undefined} value @returns {Theme | null} */
const toTheme = (value) => (value === 'light' || value === 'dark' ? value : null);
/** @param {string | null | undefined} value @returns {Density | null} */
const toDensity = (value) => (densityOrder.includes(/** @type {Density} */ (value)) ? /** @type {Density} */ (value) : null);

/** @param {Theme} theme */
const applyTheme = (theme) => { root.dataset.theme = theme; const label = theme === 'dark' ? 'Dark' : 'Light'; themeButtons.forEach((b) => { b.textContent = `Theme: ${label}`; b.setAttribute('aria-label', `Theme: ${label}. Activate to switch theme.`); b.setAttribute('aria-pressed', String(theme === 'dark')); }); };
/** @param {Density} density */
const applyDensity = (density) => {
  root.dataset.density = density;
  const label = densityLabels[density];
  densityButtons.forEach((button) => {
    button.textContent = `Density: ${label}`;
    button.setAttribute('aria-label', `Density: ${label}. Activate to cycle density.`);
  });
  const status = document.querySelector('[data-density-status]');
  if (status) status.textContent = `Density: ${label}`;
};

const initialTheme = toTheme(root.dataset.theme);
const initialDensity = toDensity(root.dataset.density);
applyTheme(initialTheme ?? toTheme(storage.get('pc-theme')) ?? (darkQuery.matches ? 'dark' : 'light'));
applyDensity(initialDensity ?? toDensity(storage.get('pc-density')) ?? 'default');
darkQuery.addEventListener('change', (event) => { if (!initialTheme && !toTheme(storage.get('pc-theme'))) applyTheme(event.matches ? 'dark' : 'light'); });
themeButtons.forEach((button) => button.addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next); storage.set('pc-theme', next); }));
densityButtons.forEach((button) => button.addEventListener('click', () => { const current = toDensity(root.dataset.density) ?? 'default'; const next = densityOrder[(densityOrder.indexOf(current) + 1) % densityOrder.length]; applyDensity(next); storage.set('pc-density', next); }));

document.querySelectorAll('[data-nav-toggle]').forEach((toggle) => {
  const id = toggle.getAttribute('aria-controls');
  const controlled = id ? document.getElementById(id) : null;
  const fallback = toggle.closest('.site-nav')?.querySelector('.site-nav__list');
  const list = controlled ?? fallback;
  if (!(list instanceof HTMLElement)) return;
  toggle.addEventListener('click', () => {
    const open = list.dataset.open !== 'true';
    list.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });
});
