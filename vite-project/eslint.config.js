import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // App code routes diagnostics through lib/debug.ts (dev-only traces) and
      // lib/reportError.ts (production error sink). A bare console call is a bug:
      // esbuild strips console in production builds, so it logs nowhere that matters.
      'no-console': 'error',
    },
  },
  {
    // CLI scripts print to stdout as their entire interface, and they never ship
    // in a bundle, so console is the correct tool there.
    files: ['scripts/**/*.{ts,tsx}', '*.config.{ts,js}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // The sanctioned console call sites.
    files: ['src/lib/debug.ts', 'src/lib/reportError.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // These files intentionally export a hook or variant helper alongside a
    // component. For the shadcn/ui files that is upstream's own structure, which
    // CLAUDE.md says to keep as copied source rather than restructure. The cost is
    // a slower Fast Refresh for these files only; correctness is unaffected.
    files: [
      'src/components/ui/button.tsx',
      'src/components/ui/form.tsx',
      'src/components/feature-shots/shared.tsx',
      'src/features/auth/AuthContext.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
)
