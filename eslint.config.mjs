import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', '.output/**', '.nitro/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts', 'middleware.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': ['error', { ignoreRestArgs: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|e|error)$',
        },
      ],
    },
  },
  {
    files: ['src/app/store/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../pages/**', '../../pages/**', 'src/app/pages/**'],
        },
      ],
    },
  },
  {
    files: ['src/app/pages/admin/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/common/http',
              message: 'Admin page components must use shared services instead of importing HttpClient directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/api/projects/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '../../utils/authGuard',
              importNames: ['authGuard'],
              message: 'Project preview access must use adminGuard, not authGuard.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/server/api/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='end'] > Literal:first-child",
          message: 'Do not return plain-text API responses via res.end(). Use shared api-response/api-errors helpers.',
        },
      ],
    },
  },
];
