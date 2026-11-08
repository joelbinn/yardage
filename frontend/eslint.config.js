// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const sonarjs = require('eslint-plugin-sonarjs');

/**
 * Lagerregler (hexagonal arkitektur): beroenden pekar alltid inåt mot domain/.
 * Kompositionsroten (app.config.ts) är den enda platsen som kopplar ihop portar och adaptrar.
 */
const layer = (dir, forbidden, message) => ({
  files: [`src/app/${dir}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [{ name: '@angular/common/http', message: 'HTTP hör hemma i infrastructure/.' }],
        patterns: [{ group: forbidden.map((d) => `**/${d}/**`), message }],
      },
    ],
  },
});

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    plugins: { sonarjs },
    processor: angular.processInlineTemplates,
    rules: {
      // Komplexitetskrav: mål 1–10 (se CODING_STANDARDS.md).
      complexity: ['error', 10],
      'sonarjs/cognitive-complexity': ['error', 10],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  layer('application', ['infrastructure', 'features'], 'application/ beror bara på domain/ och portar.'),
  layer('features', ['infrastructure'], 'features/ når adaptrar via portar i application/.'),
  {
    // domain/ är ramverksfri: varken yttre lager eller Angular/RxJS.
    files: ['src/app/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['**/application/**', '**/infrastructure/**', '**/features/**'], message: 'domain/ beror inte på yttre lager.' },
            { group: ['@angular/*', 'rxjs', 'rxjs/*'], message: 'domain/ är ramverksfri TypeScript.' },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
  },
  {
    ignores: ['dist/', '.angular/', 'node_modules/', 'test-results/', 'playwright-report/'],
  },
);
