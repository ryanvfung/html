import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      minHeight: getComputedStyle(document.querySelector('main .btn')!).minHeight,
    };
  }, [theme, density]);
  const light = await apply('light', 'default');
  const dark = await apply('dark', 'default');
  expect(dark.bg).not.toBe(light.bg);
  const controlHeights = { compact: '36px', default: '44px', comfortable: '48px' } as const;
  for (const theme of ['light', 'dark']) {
    for (const density of ['compact', 'default', 'comfortable']) {
      const result = await apply(theme, density);
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      expect(await page.evaluate(() => document.documentElement.dataset.density)).toBe(density);
      expect(result.minHeight, `${theme}/${density} control height`).toBe(controlHeights[density as keyof typeof controlHeights]);
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

test('theme control exposes the current value', async ({ page }) => {
  await page.goto('/boilerplate.html');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toHaveText('Theme: Light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.click();
  await expect(toggle).toHaveText('Theme: Dark');
  await expect(toggle).toHaveAttribute('aria-label', 'Theme: Dark. Activate to switch theme.');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveText('Theme: Light');
});

test('spec combo fields use the documented form pattern', async ({ page }) => {
  await page.goto('/spec.html');
  const groups = page.locator('.combo .form-group');
  await expect(groups).toHaveCount(6);
  const input = page.locator('.combo .form-group input.form-control').first();
  await expect(input).toHaveAttribute('name', /.+/);
  const label = page.locator('.combo .form-group label').first();
  await expect(input).toHaveAttribute('id', (await label.getAttribute('for'))!);
});

test('each nav toggle controls only its own list', async ({ page }) => {
  await page.route('**/boilerplate.html', async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const secondNav = '<nav class="site-nav" aria-label="Secondary">'
      + '<button class="site-nav__toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="second-nav-list">Menu</button>'
      + '<ul id="second-nav-list" class="site-nav__list"><li><a href="./spec.html">Second</a></li></ul></nav>';
    await route.fulfill({ response, body: html.replace('<main id="main">', `${secondNav}<main id="main">`) });
  });
  await page.setViewportSize({ width: 375, height: 720 });
  await page.goto('/boilerplate.html');
  const firstToggle = page.locator('nav[aria-label="Primary"] [data-nav-toggle]');
  const secondToggle = page.locator('nav[aria-label="Secondary"] [data-nav-toggle]');
  const firstList = page.locator('#site-nav-list');
  const secondList = page.locator('#second-nav-list');
  await firstToggle.click();
  await expect(firstList).toHaveAttribute('data-open', 'true');
  await expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(secondToggle).toHaveAttribute('aria-expanded', 'false');
  await firstToggle.click();
  await expect(firstList).toHaveAttribute('data-open', 'false');
  await secondToggle.click();
  await expect(secondList).toHaveAttribute('data-open', 'true');
  await expect(secondToggle).toHaveAttribute('aria-expanded', 'true');
  await expect(firstList).toHaveAttribute('data-open', 'false');
});

test('gen-spec ignores commented-out tokens', () => {
  const out = execSync('node scripts/gen-spec.mjs', { encoding: 'utf8' });
  expect(out).toContain('94 tokens');
  expect(readFileSync('src/pug/_generated.pug', 'utf8')).not.toContain('phantom-token');
});
