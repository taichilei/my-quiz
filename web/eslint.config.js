import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // Google 风格核心规则（去掉了依赖废弃插件的）
      'camelcase': ['error'],
      'max-len': ['error', {code: 80, ignoreTrailingComments: true}],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'es5'],
      'no-var': ['error'],
      'prefer-const': ['error'],
      'arrow-spacing': ['error'],
      // Prettier
      'prettier/prettier': 'error',
    },
  },
  prettier,
  {
    ignores: ['dist/', 'node_modules/'],
  },
];
