# 컨벤션 (CONVENTIONS)

> CLAUDE.md의 구조 불변식 4개가 최상위 규칙이다 — 이 문서는 그것을 반복하지 않고,
> 그 아래 단계의 Git / Next.js 세부 관례만 담는다. 충돌 시 CLAUDE.md가 이긴다.

## Git

### 브랜치

- 단독 개발 프로젝트 — `main` 브랜치에서 직접 작업한다.
- 렌더 순서·플레이어 등 **런타임 위험이 큰 리팩터링**은 브랜치를 파서 작업하고,
  브라우저 확인 후 main에 합친다 (예: 작업 큐의 훅 조기 반환 리팩터링).
- `main`에 force push 금지.

### 커밋 단위

- **verify.sh 초록이 아닌 상태로 커밋하지 않는다.**
- 한 커밋 = 한 논리적 변경. 작업 큐의 항목 하나가 곧 커밋 하나가 되도록 잘게 쪼갠다.
- 기능 변경과 대규모 포맷 정리를 한 커밋에 섞지 않는다 (diff 리뷰 불가능해짐).

### 커밋 메시지

형식: `<prefix>: <한국어 요약>` — 요약은 명사형으로 끝내고, 여러 변경은 쉼표로 나열한다.

| prefix | 용도 | 예시 (실제 히스토리) |
|--------|------|---------------------|
| `feat:` | 새 기능 추가 | `feat: 치지직 HLS 직접 재생 플레이어 도입` |
| `fix:` | 버그 수정 | `fix: 프리셋 변경 시 비정상 데이터 생성 방지` |
| `update:` | 기존 기능 개선·변경 | `update: 트위치 방송 종료시간 표시, 별풍선UI 분리현상 수정` |
| `style:` | UI 스타일·포맷 정리 | `style: 설정동기화 json 포맷 개선` |
| `chore:` | 빌드·설정 등 잡무 | `chore: 매뉴얼 유튜브 채팅서버 버전 표시` |

- 본문(body)은 선택 — 요약으로 부족한 *왜*가 있을 때만 쓴다.

### 버전

- **main에 push하면 Vercel이 즉시 배포한다** — 즉 push가 곧 배포다.
  push 전에 반드시 버전 업 여부를 판단하고, 올려야 하면 push 직전 커밋에서 올린다.
- 버전은 **배포(릴리스) 단위**로 올린다 — 커밋 단위도, 세션 단위도 아니다.
  커밋·세션은 작업의 단위일 뿐, 사용자가 보는 것이 바뀌는 단위는 배포이기 때문.
- 등급 판단: 배포 전에 `git log v<지난버전>..HEAD --oneline`으로 지난 배포 이후
  커밋을 훑어, **가장 높은 등급 하나**로 결정한다.
  - **메이저**: 시스템 자체가 바뀌는 변경
  - **마이너**: `feat:` 커밋이 하나라도 있음
  - **패치**: `fix:` / `update:` / `style:` / `chore:` 뿐임
- 버전 출처는 `package.json`의 `version` 하나뿐. 배포 직전 마지막 커밋에서 올리고,
  그 커밋 요약 끝에 `(v1.6.0)`처럼 버전을 병기한다.
- **유튜브 채팅 서버 버전(`REQUIRED_SERVER_VERSION`)은 앱 버전과 독립** —
  사용자가 내려받은 로컬 서버와의 호환성 계약이므로, 앱 배포와 무관하게
  프로토콜이 실제로 깨질 때만 올린다.

## Next.js

### 언어·파일 규칙

- **플레인 JavaScript** — TypeScript 도입 금지. 컴포넌트는 `.jsx`, 훅·유틸·데이터·atom은 `.js`.
- 네이밍: 컴포넌트 `PascalCase.jsx` · 훅 `use*.js` · 그 외 `camelCase.js`.
- import는 상대경로 대신 `@/` 별칭을 쓴다 (`@/components/...`, `@/atoms/...`).

### 디렉터리 역할

- `src/app/`은 **라우팅 진입점 전용** — `layout.jsx` · `page.jsx` · `api/**/route.js`만 둔다.
  실제 UI는 전부 `src/components/`에 있고 `page.jsx`는 조립만 한다.
- 새 화면 영역은 `src/components/<이름>Area.jsx` 관례를 따른다
  (ViewArea · ControllerArea · SettingsArea · ManualArea).

### 서버/클라이언트 경계

- 이 앱은 사실상 **전부 클라이언트 렌더링** — 상호작용 컴포넌트와 훅은 파일 첫 줄에
  `"use client"`를 명시한다. 서버 컴포넌트는 `layout.jsx`(metadata 소유자)뿐이다.
- **react-compiler가 활성화되어 있다** — 훅 규칙 위반(조건부 호출, 훅보다 앞선 early return)은
  경고가 아니라 실제 오동작으로 이어진다. 새 코드에서 절대 만들지 않는다.

### 플랫폼 API 프록시 — 2가지 경로

새 플랫폼 API를 붙일 때 아래 둘 중 하나를 고른다 (컴포넌트 직접 호출은 불변식 위반):

1. **CORS 우회만 필요하면 `next.config.mjs`의 `rewrites`** — `/api/<플랫폼>/<용도>/:path*` →
   플랫폼 도메인. 소비는 `src/api/client.js`의 axios 클라이언트로.
2. **서버에서만 돌 수 있는 로직(youtubei.js 등)은 `src/app/api/**/route.js`** Route Handler로.

### Route Handler 에러 관례

- **fail-soft**: 조회 실패 시 500 대신 빈 데이터(`{ channels: [] }` 등)를 **200**으로 반환한다.
  멀티뷰 특성상 플랫폼 하나의 장애가 전체 화면을 깨면 안 되기 때문.
- 에러는 `console.error`에 플랫폼 태그를 붙여 남긴다 (예: `"❌ [YouTube API] 검색 실패:"`).

### 이미지

- 외부 썸네일·프로필 이미지 도메인은 반드시 `next.config.mjs`의 `images.remotePatterns`에
  등록한다 — 누락 시 프로덕션 빌드에서만 터져서 verify로도 못 잡는다.

### 환경 변수

- 클라이언트에서 읽는 값은 `NEXT_PUBLIC_` 접두사 필수. 빌드 시점 주입 값은
  `next.config.mjs`의 `env`에서 관리한다 (APP_VERSION · REQUIRED_SERVER_VERSION 방식).

### 스타일·상태

- UI는 MUI v7 + `sx` prop — 별도 CSS 파일 추가 금지 (`src/css/index.css`는 전역 리셋 전용).
- 컴포넌트 간 상태는 jotai atom (CLAUDE.md 불변식 3). atom은 성격별로
  `src/atoms/ui.js`(일시적 UI 상태) · `src/atoms/setting.js`(영속 설정)에 나눠 담는다.
