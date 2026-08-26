import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui generated components frequently export helper functions alongside
      // components (variants, dashboardPath, etc.). Fast-refresh still works in practice.
      'react-refresh/only-export-components': 'off',
      // The strict hooks plugin flags common shadcn/ui patterns (setState in useEffect
      // for derived state, matchMedia listeners, etc.) that do not cause real bugs.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      // Allow destructuring a prefixed underscore variable to remove a sensitive field.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
])
