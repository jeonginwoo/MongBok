# 진행 상태 원장 (PROGRESS)

> **모든 세션은 이 파일을 읽는 것으로 시작하고, 이 파일을 갱신하는 것으로 끝난다.**

## 현재 상태 (2026-08-06)

- **버전:** v1.6.0 — 멀티뷰 핵심 기능(4개 플랫폼·레이아웃·녹화·프리셋) 안정화 단계
- **진행:** 컨벤션 검토에서 나온 정리 작업 전부 완료 — 작업 큐 비어 있음
- **검증 상태:** verify.sh 초록 + dev 서버에서 `/api/youtube/server-version` 응답 동일 확인 (2026-08-06)
- **다음 작업:** 없음 — 다음 세션에서 새 작업 선정 (참고: main이 origin/main보다 17커밋 앞 — push 필요)
- **차단 요소:** 없음

## 결정 기록 (Decision Log)

| 날짜 | 결정 | 근거 |
|------|------|------|
| 2026-08-02 | 하네스 구성을 pms_mcp_v2에서 이식 (지시문 영어 · 기록물 한국어 관례 포함) | 학습 샌드박스에서 검증된 구성 — LLM 지시문은 영어가 더 안정적, 기록물은 사람이 읽는 문서 |
| 2026-08-02 | verify는 lint + production build 2단계 (--quick은 lint만) | 테스트 스위트가 없어 기계 검증 가능한 것이 이 둘뿐. 런타임 동작은 브라우저 수동 확인이 유일한 수단임을 CLAUDE.md에 명시 |
| 2026-08-02 | eslint `no-unused-vars` · `react-hooks/rules-of-hooks`를 임시 warn 강등 | 기존 부채(미사용 변수 ~35건 · 훅 조기 반환 23건) 때문에 error 유지 시 verify가 도입 첫날부터 빨간불 — 부채 상환 후 error 복원 (큐 등록) |
| 2026-08-02 | eslint 설정에서 Vite용 react-refresh 플러그인 제거, node 전역 추가 | 플러그인 미설치로 eslint 자체가 실행 불가였음. Vite 잔재로 Next.js와 무관 · route.js와 process.env 때문에 node 전역 필요 |
| 2026-08-02 | ralph(자율 루프)는 도입하지 않음 | 선제 부품 금지 원칙 — 큐가 쌓이고 반복 고통이 생기면 그때 추가 |

## 작업 큐

> 계획이 합의된, 커밋 단위로 잘게 쪼갠 작업만 넣는다. 작업 중 발견한 후속 일감은
> `- [ ]`로 추가만 한다 — 몰래 실행 금지(scope creep 차단).

- [x] 훅 조기 반환 리팩터링: `if (!x) return null`이 훅 호출보다 앞에 있는 패턴 제거 (대상 5개 파일: `ChannelListChannelInfo.jsx` · `LiveCategory.jsx` · `LiveTags.jsx` · `DraggableChat.jsx` · `DraggableView.jsx`). eslint `react-hooks/rules-of-hooks` error 복원 포함. 완료 2026-08-06 — verify 초록, 5개 컴포넌트 브라우저 확인 완료(이상 없음)
- [x] 미사용 변수 정리 (34건): 데드코드는 삭제, 의도적 보존(레이아웃 정의 등)은 `_` 프리픽스. eslint `no-unused-vars` error 복원 포함. 완료 2026-08-06 — verify 초록, reviewer APPROVE, 브라우저 확인 완료(채팅 재연결·컨트롤러 버튼·화면 로드 이상 없음)
- [x] `"use client"` 누락 11개 파일 명시 (컨벤션 전수 검토 2026-08-06에서 발견): 컴포넌트 8(ControllerArea · ManualArea · ChannelListChannelInfo · LiveCategory · LiveTags · UserCount · ChatRow · RatioSelector) + 훅 3(useLayoutManager · usePopupWindow · useScreenRecorder). 완료 2026-08-06 — verify 초록, 브라우저 화면 로드 확인 완료
- [x] 상대경로 import 9건 `@/` 별칭 전환: useSoopChat(2) · SettingsArea(1) · ChatView(5) · PresetSelector(1). 완료 2026-08-06 — verify 초록
- [x] 숲 이모티콘 조회를 `api/live.js` + `soop_live_client` 경유로 이전 (useSoopEmoticons.js의 플랫폼 REST 직접 fetch — 불변식 1 위반). 완료 2026-08-06 — verify 초록, 브라우저에서 이모티콘 렌더 확인 완료
- [x] 유튜브 채널 route fail-soft 적용: `channel/[id]/route.js`의 404/500을 빈 데이터 200으로. 소비측(live.js)은 `!data.channel`이면 throw라 동작 동일 확인. 완료 2026-08-06 — verify 초록, 브라우저에서 없는 채널 검색 확인 완료
- [x] `server-version/route.js`의 HTTP 메서드 외 `export const REQUIRED_SERVER_VERSION` 제거 (route 파일은 허용된 export만 — 컨벤션 검토에서 발견한 경미 항목). 완료 2026-08-06 — verify 초록, dev 서버 엔드포인트 응답 동일 확인

## 세션 로그

### 형식 (복사해서 사용)

```
### YYYY-MM-DD — <작업 요약>
- 완료: <한 것 + 검증 결과>
- 미해결: <다음 세션으로 넘기는 것>
- 다음 작업: <구체적으로>
```

### 2026-08-06 — server-version route 여분 export 제거 (작업 큐 소진)

- 완료: `server-version/route.js`의 `REQUIRED_SERVER_VERSION`에서 `export` 키워드만 제거 — GET 핸들러는 그대로 사용, import하는 곳은 원래 없음(useYoutubeChat·ManualArea는 환경변수 직접 참조). main 직접 커밋(6a2c25c) — 런타임 위험 없는 한 줄 변경이라 컨벤션대로 브랜치 없이 진행. verify 초록. 런타임 확인은 브라우저 대신 dev 서버 `/api/youtube/server-version` 호출로 — 응답 `{"requiredVersion":"1.0.9"}` 동일(이 route의 유일한 소비 경로가 이 응답이므로 충분)
- 미해결: 없음 — 작업 큐 비어 있음. main이 origin/main보다 17커밋 앞서 있어 push 필요
- 다음 작업: 새 작업 선정 (기능 개선·버그 등 사용자와 합의)

### 2026-08-06 — 미사용 변수 정리 + no-unused-vars error 복원

- 완료: `no-unused-vars` 경고 34건 상환 — 데드코드 삭제(미사용 import 6건 · ControlButtonGroup 미사용 핸들러 2건 · 치지직/숲/트위치 훅의 잔재 `retryBuster` 상태 3건 등. 실제 재연결 트리거는 `webSocketBuster`로 유지 확인, 유튜브 훅의 retryBuster는 진짜 트리거라 보존), canvas.js 레이아웃 정의 5건은 `_` 프리픽스 보존, jotai 훅을 값 전용 `useAtomValue`·세터 전용 `useSetAtom`으로 정리. eslint `no-unused-vars` error 복원 — 임시 강등 룰 전부 해소. 브랜치 chore/unused-vars 커밋 3건(e659f35 · acff7ad · aa1be71) 각 verify 초록, reviewer APPROVE(지적된 ViewArea의 죽은 ThemeProvider import도 제거). 브라우저 확인 완료(2026-08-06, 이상 없음): 채팅 재연결(치지직·숲·트위치) · 컨트롤러 버튼/단축키(V·T·P) · 화면 전체 로드
- 미해결: 없음
- 다음 작업: 작업 큐 최상단 — `server-version/route.js`의 `REQUIRED_SERVER_VERSION` 여분 export 제거

### 2026-08-06 — 훅 조기 반환 리팩터링 + rules-of-hooks error 복원

- 완료: 조기 반환(`if (!x) return null`)이 훅보다 앞에 있던 23건을 5개 파일에서 훅 뒤로 이동 — Info 계열 3개(LiveCategory · LiveTags · ChannelListChannelInfo)는 단순 이동, Draggable 2개(DraggableChat · DraggableView)는 훅 인자가 channel을 참조해 옵셔널 체이닝 동반. eslint `react-hooks/rules-of-hooks`를 error로 복원. 브랜치 refactor/hooks-early-return에서 커밋 3건(6ed0eb6 · aaa4c82 · c8ec50a), 각 커밋 verify 초록. reviewer 에이전트 검토 통과(코드 결함 없음). 브라우저 확인 완료(2026-08-06, 이상 없음): 채널 목록 스켈레톤·툴팁·오프라인 표시, 영상/채팅 뷰 렌더·드래그·HLS·연결 상태 오버레이 — react-compiler 최적화 대상 편입에 따른 이상 없음
- 미해결: 없음
- 다음 작업: 작업 큐 최상단 — 미사용 변수 정리(~35건), 완료 후 `no-unused-vars` error 복원

### 2026-08-06 — Next.js 컨벤션 전수 검토 + 위반 4건 수정

- 완료: CONVENTIONS.md 기준 전수 검토(디렉터리 역할·네이밍·별칭·"use client"·API 경로·fail-soft·이미지 도메인·환경변수·스타일/atom — 이미지·atom·환경변수 등은 위반 없음 확인). 위반 4건 수정: ① "use client" 누락 11개 파일 명시 ② 상대경로 import 9건 @/ 전환 ③ 숲 이모티콘 조회를 api/live.js `getSoopEmoticons`(soop_live_client 경유)로 이전 — 불변식 1 위반 해소 ④ 유튜브 채널 route 404/500 → 빈 데이터 200 fail-soft. 커밋 4건(530b1b7 · fa08ddf · d01a0f2 · 2c48a91), 각 커밋 verify 초록
- 미해결: 없음 — 브라우저 확인 3건(숲 이모티콘 렌더 · 유튜브 없는 채널 검색 · 화면 전체 로드) 사용자 확인 완료(2026-08-06, 이상 없음). server-version route 여분 export는 큐 등록만
- 다음 작업: 작업 큐 최상단(훅 조기 반환 리팩터링, 브랜치 파서 진행)

### 2026-08-02 — 하네스 도입 (pms_mcp_v2에서 이식)

- 완료: CLAUDE.md(불변식 4개 · 작업 방식) · docs/PROGRESS.md · scripts/verify.sh(lint+build, 로그 오프로딩) · Stop 훅 · .claude/settings.json(allow/deny) · /next · /wrap-up 커맨드 · reviewer 에이전트. eslint 수리(react-refresh 제거 · node 전역 · 관례 반영)로 98 에러 → 0 에러(경고 63). case 블록 중괄호 9곳 · hasOwnProperty 1곳 코드 수정. `lint` 스크립트를 `next lint`(Next 16에서 제거됨) → `eslint src`로 교체
- 미해결: 훅 조기 반환 23건 · 미사용 변수 ~35건 (작업 큐 등록, 해당 룰 warn 강등 상태)
- 다음 작업: 작업 큐 1번 — 훅 조기 반환 리팩터링
