import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTokens, renderArtifacts } from '../../scripts/gen-spec.mjs';

const fixture = `
@layer tokens {
:root {
  --surface-overlay: rgba(22,20,19,0.55);
  --space-16: clamp(8rem, 7.25rem + 3.75vw, 11rem);
  --text-base: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem);
  --orange-5: #ff7700;
  --neutral-0: #161413;
  /* --phantom-block: #123456; */
  // --phantom-line: #654321;
  --accent: var(--orange-5);
}
}
`;

test('ignores tokens inside comments', () => {
  const tokens = parseTokens(fixture);
  assert.equal(tokens.some((token) => token.name === '--phantom-block'), false);
  assert.equal(tokens.some((token) => token.name === '--phantom-line'), false);
});

test('captures whole values containing commas', () => {
  const tokens = parseTokens(fixture);
  const byName = Object.fromEntries(tokens.map((token) => [token.name, token.value]));
  assert.equal(byName['--surface-overlay'], 'rgba(22,20,19,0.55)');
  assert.equal(byName['--space-16'], 'clamp(8rem, 7.25rem + 3.75vw, 11rem)');
});

test('rejects values with unsafe Sass delimiters', () => {
  const unsafe = ':root { --surface-overlay: rgba(0,0,0,0.5); --bad: red} .x { --foo: bar; }';
  assert.throws(() => parseTokens(unsafe), /unsafe value/);
});

test('keys swatch classes by token name and emits an unbuffered banner', () => {
  const { pug, scss } = renderArtifacts(parseTokens(fixture));
  assert.match(pug, /^\/\/- AUTO-GENERATED/);
  assert.match(pug, /span\.sw-orange-5/);
  assert.match(scss, /\.sw-neutral-0 \{ --swatch: #161413; \}/);
  assert.doesNotMatch(pug, /phantom/);
});
