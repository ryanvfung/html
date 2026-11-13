import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const paths = ['dist', 'src/pug/_generated.pug', 'src/styles/_spec-generated.scss'];
const status = execFileSync('git', ['status', '--porcelain', '--', ...paths], { cwd: root, encoding: 'utf8' });
if (status.trim()) {
  console.error(`check-dist: artifacts are stale or untracked:\n${status}`);
  process.exit(1);
}
console.log('check-dist: dist and generated artifacts are current');
