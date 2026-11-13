import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pug from 'pug';

const root = resolve(import.meta.dirname, '..');
for (const name of ['boilerplate', 'spec', 'showcase']) {
  const html = pug.renderFile(resolve(root, `src/pug/${name}.pug`), { basedir: resolve(root, 'src/pug') });
  writeFileSync(resolve(root, `dist/${name}.html`), html);
  console.log(`build-pages: ${name}.html`);
}
