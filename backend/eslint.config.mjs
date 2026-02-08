import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import pluginNode from 'eslint-plugin-n';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // Base config for all JavaScript/TypeScript files
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        // Define Node.js globals explicitly
        process: 'readonly',
        console: 'readonly',
        global: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'eqeqeq': 'error',
      'curly': 'error',
      'prefer-const': 'error',
    },
  },
  
  // TypeScript specific config
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
      'n': pluginNode,
    },
    rules: {
      ...ts.configs.recommended.rules,
      // Disable JS no-unused-vars in favor of TS version
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      // Node.js specific rules
      'n/no-process-exit': 'warn',
      'n/no-deprecated-api': 'error',
    },
  },
  
  // Test files configuration
  {
    files: ['**/tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        beforeAll: 'readonly',
        afterEach: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      // Relaxed rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
    },
  },
];