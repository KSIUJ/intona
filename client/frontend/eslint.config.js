import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { importX } from 'eslint-plugin-import-x'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      importX.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: {
      'import-x/resolver': {
        node: { extensions: ['.js', '.jsx', '.json'] },
      },
    },
    rules: {
      'import-x/no-unresolved': 'error',
      'import-x/no-extraneous-dependencies': 'error',
    },
  },
  {
    files: ['eslint.config.js'],
    rules: {
      'import-x/no-named-as-default': 'off',
    },
  },
])