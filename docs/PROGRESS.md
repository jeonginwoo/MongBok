# 진행 상태 원장 (PROGRESS)

> **모든 세션은 이 파일을 읽는 것으로 시작하고, 이 파일을 갱신하는 것으로 끝난다.**

## 현재 상태 (2026-08-07)

- **버전:** v1.6.0 — 멀티뷰 핵심 기능(4개 플랫폼·레이아웃·녹화·프리셋) 안정화 단계
- **진행:** 프리셋 경고·HLS 볼륨 통합은 브라우저 확인 완료 후 main 반영. 녹화 분할은 1차 브라우저 테스트 실패(분할 시 녹화 전체 종료) → 준비-후-교체 방식으로 재설계 완료, 재테스트 대기
- **검증 상태:** verify.sh 초록. 녹화 분할 재설계분은 브라우저 재확인 필요
- **다음 작업:** `feat/record-split-on-change` 브라우저 재확인(실방송에서 방제 변경) → 병합
- **차단 요소:** 녹화 분할 재테스트는 방제 변경 권한이 있는 실방송 필요 (사용자만 가능)

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

- [x] 녹화 중 프리셋 변경 확인 다이얼로그: `PresetSelector`에서 `isRecordingAtom`이 켜져 있으면 확인 다이얼로그를 띄우고, 확인 시 `setIsRecording(false)`를 명시적으로 호출 후 전환 (종료 기준 "manual"에서도 동작이 일관되도록). 완료 2026-08-06 — main 커밋 7af7660, verify 초록, reviewer APPROVE, 브라우저 확인 완료(2026-08-07, 정상)
- [x] 치지직 HLS 볼륨 통합: 마지막 사용자 설정 `{volume, muted}`를 `atomWithStorage`로 보존, 새 플레이어 배치 시 초기값으로 상속(배치 후엔 독립). 저장은 사용자 조작 핸들러(뮤트 버튼·슬라이더)에서만. 저장 상태가 뮤트면 `needsUnmute` 건너뜀. 완료 2026-08-06 — 커밋 6ac970b, verify 초록, reviewer APPROVE, 브라우저 확인 완료(2026-08-07, 정상) → main 병합(67fd624)
- [x] 1번 채널 방제/카테고리 변경 시 녹화 분할(설정 토글, 기본 꺼짐): 1차 구현(recorder 정지 → 새 파일 열기, 03a6972+083e0b7)은 브라우저 테스트에서 분할 시 녹화 전체 종료 — 저장 대화상자로 시작한 녹화(폴더 미지정)는 회전 파일을 열 수 없어 설계상 전체 종료로 빠지는 구조였음. 준비-후-교체 방식으로 재설계(4b1b90f): 새 파일·새 recorder를 먼저 준비해 교체 후 이전 것 정지 — 실패 시 분할만 건너뛰고 기존 녹화 유지(스낵바 알림), 프레임 공백 없음. 세그먼트별 writable/chunks 클로저 바인딩. 파일명에 라이브 카테고리 추가 포함. verify 초록. **브랜치 `feat/record-split-on-change` 브라우저 재확인 후 병합 대기**
- [ ] `ChzzkHlsPlayer.jsx`의 렌더 중 ref 미러 패턴 3곳(latestUrlRef·targetLatencyRef·storedVolumeRef)을 `useEffect` 미러로 정리 (reviewer 지적 — react-compiler 환경에서 Rules of React 위반. 기존 관행이라 볼륨 커밋에서는 미수정, 파일 단위로 일괄 정리)
- [ ] `SettingsArea.jsx`의 setState updater 내부 `localStorage.setItem` 패턴 정리 (reviewer 지적 — 비순수 updater, StrictMode 이중 실행·react-compiler 가정 위반. 기존 핸들러 전반의 관행이라 파일 단위로 일괄 정리)
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

### 2026-08-07 — 브라우저 확인 반영: 볼륨 병합, 녹화 분할 재설계 + 파일명 카테고리

- 완료: ① 프리셋 다이얼로그·HLS 볼륨 통합 브라우저 확인 완료(정상) — `feat/chzzk-hls-volume` main 병합(67fd624). ② 녹화 분할 1차 테스트 실패(분할 시점에 녹화 전체 종료, 재시작 안 됨) 원인 분석: 기존 설계가 "recorder 정지 → 새 파일 열기" 순서라 새 파일 열기 실패(특히 저장 대화상자로 시작한 녹화는 폴더 핸들이 없어 무조건 실패)가 곧 전체 종료였음. 준비-후-교체 방식으로 재설계(4b1b90f): 새 파일·새 recorder를 먼저 준비해 교체 후 이전 recorder 정지(onstop이 ref 비교로 회전/전체 종료 구분), 실패 시 분할만 건너뛰고 기존 녹화 유지 + 스낵바 알림, 세그먼트별 writable/chunks 클로저 바인딩으로 겹침 구간 혼선 방지. ③ 녹화 파일명에 라이브 카테고리 추가(`시간 채널명-방제-카테고리`, 있는 것만) — 같은 커밋. ④ 사용자 CONVENTIONS.md 버전 규칙 수정 커밋(e305fab). verify 초록
- 추가(같은 날): 녹화 분할 토글에 저장 폴더 전제 조건 적용(7cf1a3d) — ① 폴더 미지정 상태에서 켜려 하면 스낵바 경고 + false 유지 ② 폴더 해제 시 분할 자동 꺼짐(스낵바 안내) ③ 설정 동기화 유효성 검사에 `validateRecordSplitOnZone1Change` 추가(폴더 없으면 true 거부 — 기존엔 switch에 케이스가 없어 무검사 통과였음). verify 초록
- 미해결: 녹화 분할 브라우저 재확인(실방송 방제 변경 → 분할·이어짐, 폴더 미지정 시 토글 차단 스낵바) 후 `feat/record-split-on-change` 병합. reviewer 지적 패턴 정리 2건은 큐 대기
- 다음 작업: 분할 재테스트 결과 확인 → 병합 → 큐의 패턴 정리 2건

### 2026-08-06 — 녹화·볼륨 개선 3건 구현 (프리셋 경고·HLS 볼륨 통합·녹화 분할)

- 완료: ① 녹화 중 프리셋 변경 확인 다이얼로그 — main 커밋 7af7660 (확인 시 종료 기준과 무관하게 명시적 녹화 종료). ② 치지직 HLS 볼륨 통합 — 브랜치 `feat/chzzk-hls-volume` 커밋 6ac970b (`chzzkHlsVolumeAtom` 신설, 배치 시점 상속·조작 핸들러에서만 저장·뮤트 상속 시 needsUnmute 생략, 설정 동기화/프리셋 대상 포함). ③ 방제/카테고리 변경 시 녹화 분할 — 브랜치 `feat/record-split-on-change` 커밋 03a6972+083e0b7 (스트림 유지·recorder 회전, `recordSplitOnZone1ChangeAtom` 토글 기본 꺼짐, 설정 UI·인디케이터 등록, 리뷰 지적으로 회전 파일 실패 시 전체 종료로 수정). 3건 모두 verify 초록, reviewer 검토 통과
- 미해결: 브랜치 2건 브라우저 확인 후 병합 — 볼륨: 치지직 플레이어 뮤트/볼륨 조절 → 새 치지직 채널 배치 시 상속·자동재생 폴백 정상 여부. 분할: 토글 켜고 녹화 중 1번 채널 방제 변경 → 파일 분할·이어짐 확인(실방송 필요). 프리셋 다이얼로그도 브라우저 확인 필요. reviewer가 지적한 기존 패턴 정리 2건 큐 등록만
- 다음 작업: 사용자 브라우저 확인 → 브랜치 병합 → 큐의 패턴 정리 2건

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
