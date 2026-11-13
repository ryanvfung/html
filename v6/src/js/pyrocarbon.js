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
const applyTheme = (theme) => { root.dataset.theme = theme; const label = theme === 'dark' ? 'Dark' : 'Light'; themeButtons.forEach((b) => { b.textContent = `Theme: ${label}`; b.setAttribute('aria-label', `Theme: ${label}. Activate to switch theme.`); b.setAttribute('aria-pressed', String(theme === 'dark')); }); };
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

const initialTheme = root.dataset.theme || null;
const initialDensity = root.dataset.density || null;
applyTheme(initialTheme || storage.get('pc-theme') || (darkQuery.matches ? 'dark' : 'light'));
applyDensity(initialDensity || storage.get('pc-density') || 'default');
darkQuery.addEventListener('change', (event) => { if (!initialTheme && !storage.get('pc-theme')) applyTheme(event.matches ? 'dark' : 'light'); });
themeButtons.forEach((button) => button.addEventListener('click', () => { const next = root.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(next); storage.set('pc-theme', next); }));
densityButtons.forEach((button) => button.addEventListener('click', () => { const next = densityOrder[(densityOrder.indexOf(root.dataset.density) + 1) % densityOrder.length]; applyDensity(next); storage.set('pc-density', next); }));

document.querySelectorAll('[data-nav-toggle]').forEach((toggle) => {
  const id = toggle.getAttribute('aria-controls');
  if (!id) return;
  const list = document.getElementById(id);
  if (!list) return;
  toggle.addEventListener('click', () => {
    const open = list.dataset.open !== 'true';
    list.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
  });
});
