import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import promisePlugin from 'eslint-plugin-promise'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      promise: promisePlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
        node: true,
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      // Promise
      ...promisePlugin.configs.recommended.rules,

      // Named exports (pages allow default)
      'import/no-default-export': 'error',

      // Import ordering: design-system → external → internal (shared→entities→features→widgets)
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@sentbe/**', group: 'external', position: 'before' },
            { pattern: '@/shared/**', group: 'internal', position: 'before' },
            { pattern: '@/entities/**', group: 'internal' },
            { pattern: '@/features/**', group: 'internal' },
            { pattern: '@/widgets/**', group: 'internal', position: 'after' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
    },
  },
  {
    // app router pages need default exports for Next.js
    files: ['app/**/*.tsx', 'app/**/*.ts', 'next.config.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  // FSD views layer and shared/ui + widgets also need default exports
  {
    files: [
      'src/views/**/*.tsx',
      'src/views/**/*.ts',
      'src/shared/ui/**/*.tsx',
      'src/shared/ui/**/*.ts',
      'src/widgets/**/*.tsx',
      'src/widgets/**/*.ts',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  // FSD layer boundary rules (no-restricted-imports)
  // shared: cannot import from upper layers
  {
    files: ['src/shared/**/*.ts', 'src/shared/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/src/entities/**'], message: 'shared cannot import from entities' },
            { group: ['@/src/features/**'], message: 'shared cannot import from features' },
            { group: ['@/src/widgets/**'], message: 'shared cannot import from widgets' },
            { group: ['@/src/views/**'], message: 'shared cannot import from views' },
          ],
        },
      ],
    },
  },
  // entities: can use shared only
  {
    files: ['src/entities/**/*.ts', 'src/entities/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/src/features/**'], message: 'entities cannot import from features' },
            { group: ['@/src/widgets/**'], message: 'entities cannot import from widgets' },
            { group: ['@/src/views/**'], message: 'entities cannot import from views' },
          ],
        },
      ],
    },
  },
  // features: can use shared + entities
  {
    files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/src/widgets/**'], message: 'features cannot import from widgets' },
            { group: ['@/src/views/**'], message: 'features cannot import from views' },
          ],
        },
      ],
    },
  },
  // widgets: can use shared + entities + features
  {
    files: ['src/widgets/**/*.ts', 'src/widgets/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['@/src/views/**'], message: 'widgets cannot import from views' }],
        },
      ],
    },
  },
]
