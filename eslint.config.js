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
      // 미사용 변수 부채 상환 완료(2026-08-06)로 error 복원.
      // 의도적 보존(레이아웃 정의 등)은 _ 프리픽스로 표시하는 관례
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none' }],
      // 빈 catch로 의도적으로 무시하는 관례(localStorage 접근 등)가 코드베이스 전반에 있음
      'no-empty': ['error', { allowEmptyCatch: true }],
      // "훅보다 앞선 조기 반환" 부채 상환 완료(2026-08-06)로 error 복원
      'react-hooks/rules-of-hooks': 'error',
    },
  },
])
