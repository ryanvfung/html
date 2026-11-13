export default {
  customSyntax: 'postcss-scss',
  rules: {
    'color-no-hex': true,
    'declaration-no-important': true,
    'declaration-property-value-disallowed-list': {
      '/^(padding|margin|gap|font-size)(-(top|right|bottom|left|x|y))?$/': ['/\\d+px/'],
      'background-clip': ['text'], '-webkit-background-clip': ['text'],
    },
    'function-disallowed-list': ['darken', 'lighten', 'adjust-hue', 'transparentize', 'adjust-color', 'scale-color'],
    'selector-max-specificity': '0,4,0',
    'declaration-property-value-allowed-list': { 'font-family': ['/^var\\(--font-/'] },
    'custom-property-pattern': '^[a-z][a-z0-9]*(-[a-z0-9]+)*$',
    'no-invalid-position-at-import-rule': true,
  },
  overrides: [
    { files: ['src/tokens/_tokens.scss'], rules: { 'color-no-hex': null } },
    { files: ['src/styles/_spec-generated.scss'], rules: { 'color-no-hex': null } },
    { files: ['src/styles/reset.scss'], rules: { 'declaration-no-important': null } },
  ],
};
