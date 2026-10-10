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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // One canonical host. The apex redirects to www; a URL naming the apex
      // in a canonical, og:url or JSON-LD splits Google's signals across two hosts.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/https:..trainpace\\.com/]',
          message: 'Use https://www.trainpace.com (BASE_URL from @/lib/seo), not the bare apex.',
        },
        {
          selector: 'TemplateElement[value.raw=/https:..trainpace\\.com/]',
          message: 'Use https://www.trainpace.com (BASE_URL from @/lib/seo), not the bare apex.',
        },
      ],
    },
  },
)
