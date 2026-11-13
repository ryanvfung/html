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
