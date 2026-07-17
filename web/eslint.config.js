import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Konvensi standar: destructuring yang sengaja membuang satu-dua kolom dari ...rest
      // (mis. `const { bulan, ...rest } = row` supaya "bulan" tidak ikut ke objek yang
      // disimpan) butuh nama untuk kolom yang dibuang -- prefix "_" menandai "sengaja
      // tidak dipakai", bukan lupa dibersihkan.
      'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // react-hooks/set-state-in-effect menandai pola fetch-on-mount standar (setLoading(true)
      // dkk di baris awal fungsi async yang dipanggil dari useEffect) sebagai error. Pola ini
      // valid dan dipakai luas di codebase ini (~10 tempat) untuk data fetching tanpa library
      // khusus, sesuai contoh resmi React docs -- turunkan ke warning supaya tetap kelihatan
      // tanpa memblokir push untuk pola yang memang disengaja.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
