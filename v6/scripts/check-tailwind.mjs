import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cli = resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs');
const outDir = mkdtempSync(join(tmpdir(), 'pyrocarbon-tailwind-'));
const probe = resolve(root, 'tailwind-probe.html');
const out = join(outDir, 'tailwind.css');
try {
  writeFileSync(probe, '<div class="bg-surface-canvas p-4 text-sm font-display"></div>');
  execFileSync(process.execPath, [cli, '-i', 'src/tokens/_tailwind-theme.css', '-o', out], { cwd: root, stdio: 'pipe' });
  const css = readFileSync(out, 'utf8');
  for (const needle of ['--spacing-4: var(--space-4)', '.bg-surface-canvas']) {
    if (!css.includes(needle)) throw new Error(`check-tailwind: missing ${needle}`);
  }
  console.log('check-tailwind: @theme mappings resolve to token variables');
} finally {
  rmSync(probe, { force: true });
  rmSync(outDir, { recursive: true, force: true });
}
