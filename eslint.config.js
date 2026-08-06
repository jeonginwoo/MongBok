import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
    ],
    languageOptions: {
      ecmaVersion: 2020,
      // Next.js는 서버 코드(route.js)와 process.env 인라인 때문에 node 전역도 필요
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // 임시 강등: 기존 미사용 변수(데드코드 후보 ~35건) 정리 전까지 warn — docs/PROGRESS.md 작업 큐 참조.
      // 정리 완료 후 반드시 error로 복원할 것
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      // 빈 catch로 의도적으로 무시하는 관례(localStorage 접근 등)가 코드베이스 전반에 있음
      'no-empty': ['error', { allowEmptyCatch: true }],
      // "훅보다 앞선 조기 반환" 부채 상환 완료(2026-08-06)로 error 복원
      'react-hooks/rules-of-hooks': 'error',
    },
  },
])
