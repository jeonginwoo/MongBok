# 진행 상태 원장 (PROGRESS)

> **모든 세션은 이 파일을 읽는 것으로 시작하고, 이 파일을 갱신하는 것으로 끝난다.**

## 현재 상태 (2026-09-06)

- **버전:** v1.8.0 — 녹화 엔진 WebCodecs 전환(탐색 인덱스 내장) 완료
- **진행:** 녹화 파이프라인 MediaRecorder → WebCodecs+워커 전면 교체, 4시간 녹화 검증 통과 — main 병합·버전 업 완료, push(=배포) 대기
- **검증 상태:** verify.sh 초록 + 브라우저 확인 완료(2026-09-06, 사용자 — 4시간 녹화 싱크 유지)
- **다음 작업:** push·배포 후 새 작업 선정
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

- [x] 녹화 중 프리셋 변경 확인 다이얼로그: `PresetSelector`에서 `isRecordingAtom`이 켜져 있으면 확인 다이얼로그를 띄우고, 확인 시 `setIsRecording(false)`를 명시적으로 호출 후 전환 (종료 기준 "manual"에서도 동작이 일관되도록). 완료 2026-08-06 — main 커밋 7af7660, verify 초록, reviewer APPROVE, 브라우저 확인 완료(2026-08-07, 정상)
- [x] 치지직 HLS 볼륨 통합: 마지막 사용자 설정 `{volume, muted}`를 `atomWithStorage`로 보존, 새 플레이어 배치 시 초기값으로 상속(배치 후엔 독립). 저장은 사용자 조작 핸들러(뮤트 버튼·슬라이더)에서만. 저장 상태가 뮤트면 `needsUnmute` 건너뜀. 완료 2026-08-06 — 커밋 6ac970b, verify 초록, reviewer APPROVE, 브라우저 확인 완료(2026-08-07, 정상) → main 병합(67fd624)
- [x] 1번 채널 방제/카테고리 변경 시 녹화 분할(설정 토글, 기본 꺼짐): 1차 구현(recorder 정지 → 새 파일 열기, 03a6972+083e0b7)은 브라우저 테스트에서 분할 시 녹화 전체 종료 — 저장 대화상자로 시작한 녹화(폴더 미지정)는 회전 파일을 열 수 없어 설계상 전체 종료로 빠지는 구조였음. 준비-후-교체 방식으로 재설계(4b1b90f): 새 파일·새 recorder를 먼저 준비해 교체 후 이전 것 정지 — 실패 시 분할만 건너뛰고 기존 녹화 유지(스낵바 알림), 프레임 공백 없음. 세그먼트별 writable/chunks 클로저 바인딩. 파일명에 라이브 카테고리 추가 포함. verify 초록. **브랜치 `feat/record-split-on-change` 브라우저 재확인 후 병합 대기**
- [x] `ChzzkHlsPlayer.jsx`의 렌더 중 ref 미러 패턴 3곳(latestUrlRef·targetLatencyRef·storedVolumeRef)을 `useEffect` 미러로 정리 (reviewer 지적 — react-compiler 환경에서 Rules of React 위반. 기존 관행이라 볼륨 커밋에서는 미수정, 파일 단위로 일괄 정리). 완료 2026-08-07 — 같은 패턴 1곳(onErrorRef) 추가 발견해 4곳 일괄 정리, 커밋 b836600, verify 초록, reviewer APPROVE(stale 읽기 경로 전수 추적 — 없음), 브라우저 확인 완료(재생·볼륨 상속·딜레이 설정 정상) → main 병합
- [x] `SettingsArea.jsx`의 setState updater 내부 `localStorage.setItem` 패턴 정리 (reviewer 지적 — 비순수 updater, StrictMode 이중 실행·react-compiler 가정 위반. 기존 핸들러 전반의 관행이라 파일 단위로 일괄 정리). 완료 2026-08-07 — 해당 키 전부 atomWithStorage라 수동 setItem 15곳은 중복으로 판명, 이동 아닌 삭제(updater 5곳 순수화·죽은 validateBoolean 게이트 제거·폴더 해제는 RESET). 커밋 41bbb17, verify 초록, reviewer APPROVE, 브라우저 확인 완료(토글·알림음·폴더·셀렉트·JSON 패널 정상) → main 병합
- [ ] 녹화 파일명 초 단위 충돌 가드 (reviewer 지적 MINOR — teardown 선행으로 저장 완료 전 재녹화가 가능해져, 같은 초에 같은 1번 채널 조합이면 파일명이 겹쳐 완성본을 덮어쓸 수 있음. `getDisplayMedia` 픽커 시간 때문에 실사용상 희박 — 이 영역 다시 만질 때 유니크 가드 추가. 2026-09-06 WebCodecs 전환은 이 영역 전면 재작성이었으나 4시간 검증을 마친 빌드를 흔들지 않으려 의도적 보류)
- [x] `ControlButtonGroup.jsx`의 같은 패턴 정리 (SettingsArea 정리 시 reviewer 지적 — updater 내부 `validateBoolean`+수동 `setItem` 4곳: controllerExpanded·pointerEventsEnabled·showCurrentTime·themeMode. 전부 atomWithStorage라 수동 setItem은 중복, 삭제로 정리. showCurrentTime·pointerEventsEnabled는 SettingsArea와 양쪽 토글 키라 현재 비대칭 상태). 완료 2026-08-09 — 같은 패턴 1곳(chatFontSizeAdjustment 수동 setItem) 추가 발견해 5곳 일괄 정리, 죽은 validate 게이트 제거(handleChangeTheme 통째 제거 포함). 커밋 700f964+8cd89d7, verify 초록, reviewer APPROVE(5개 키 동기 atomWithStorage·stale 읽기 경로 없음 확인), 브라우저 확인 완료(단축키 토글 5종·새로고침 유지 정상) → main 병합, v1.7.3
- [ ] `ControlButtonGroup.jsx` `applyLiveStatusUpdate`의 `setChannels` updater 내부 `"channels"` setItem 정리 (패턴 정리 ③에서 발견 — `channelsAtom`은 plain atom이고 저장 형태가 `{zoneId}` 프로젝션이라 중복 아님·삭제 불가, updater 밖으로 이동 필요. 같은 값 재기록이라 실해 없음, 이 영역 다시 만질 때 처리)
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

### 2026-09-06 — 녹화 엔진 WebCodecs 전환: 탐색 인덱스 내장·워커 인코딩·A/V 싱크 실측 (v1.8.0)

- 완료: MediaRecorder → WebCodecs 파이프라인 전면 교체, 여러 세션에 걸친 브라우저 실측 디버깅 끝에 `feat/webcodecs-recorder` 커밋 aee4ff2 → main ff 병합. 발단은 사용자 질문 "녹화본이 인덱싱이 안 돼 재인코딩을 거친다" — MediaRecorder는 스트리밍용 파일(Cues/duration 없음)을 뱉는 구조라 앱 안에서 못 고침. ① **탐색 인덱스**: 신규 `recordPipeline.js`(워커 전용)가 webm-muxer/mp4-muxer(신규 의존성 2개)로 직접 먹싱, 파일 닫을 때 FileSystemWritableFileStream seek으로 Cues(WebM)/moov(MP4)·duration 기록 — ffmpeg 후처리 불필요, 키프레임 2초 고정으로 탐색 정밀도 확보. 컨테이너는 코덱이 결정(H.264→MP4·VP9/VP8→WebM, `recordFormat.js` 공용 표) — 비표준 H.264-in-WebM 제거, 파일명 확장자·픽커 accept 연동. ② **워커 인코딩**(`recordWorker.js`): 1차 구현(메인 스레드)은 콘솔 계측으로 영상·오디오 동시 유실 확인(57→44fps, 오디오 216→175청크/5s — 오디오는 VFR이 없으므로 동반 하락 = 스레드 정체 증명) → 캡처 읽기·인코딩·먹싱·파일 쓰기 전부 워커로 이동. 트랙 대신 MediaStreamTrackProcessor.readable을 transfer(트랙을 옮기면 메인의 stop/onended/readyState 상실), 파일은 FileSystemFileHandle을 넘겨 워커가 연다(writable은 구조화 복제 불가). 저장 중 배너·종료 경고는 워커의 state 메시지 기반으로 전환. ③ **A/V 싱크**: 두 트랙 타임스탬프 원점이 상이(실측 14일+ 차이 — strict 먹서 기본값이 오디오 전량을 조용히 거부해 무음 녹화가 1차 증상) → permissive/cross-track-offset + 시작 시 첫 샘플 도착 시각으로 클럭 오프셋 실측. 도착 순서 앵커링이 만들던 상수 오프셋(영상 인코더 초기화 지연 = 실측 17청크 ≈ 360ms만큼 소리 선행)은 초기화 구간 오디오를 큐로 보존해 제거. ④ **분할(회전)** 재설계: 새 세그먼트 예약 → 다음 키프레임에서 교체 — recorder 겹침·이중 인코딩 없이 프레임 공백 0, 실패 시 기존 녹화 유지 불변. ⑤ 시작 이중 실행 가드(startingRef), 빈 세그먼트 abort 정리, 처리량 계측(📊 5초 간격) 존치 — 이번 디버깅의 핵심 도구였음. verify 초록, 브라우저 확인 완료(사용자 — 무음→해결, 끊김→해결, 소리 선행→해결 순차 검증, 최종 4시간 녹화 끝까지 싱크 유지)
- 미해결: ① 파일명 초 단위 충돌 가드 — 검증 마친 빌드 유지를 위해 의도적 보류(큐 항목에 추기) ② MediaRecorder 폴백 제거로 파이어폭스 녹화 불가(미지원 스낵바 안내) — Region Capture 등이 이미 크로미움 전제라 수용, 필요 시 재논의 ③ 초장시간(수십 시간) 클럭 드리프트 미검증 — 문제 시 타임스탬프 재보정 검토
- 다음 작업: push·배포(v1.8.0 마이너 — feat 1건), 이후 새 작업 선정

### 2026-08-18 — 배치 채널 갱신 주기 동기화 키 channelRefreshInterval 추가

- 완료: 60초 고정이던 배치(zoneId) 채널 자동 갱신 주기를 새 키 `channelRefreshInterval`(atomWithStorage, 초 단위, 기본 60, 허용 10~600 정수)로 전환 — `record`와 같은 "설정 UI 없음, 동기화 JSON 직접 지정" 방식. 동기화 파이프라인 전체 연결(SETTINGS_ORDER · validateChannelRefreshInterval — 카운트다운이 정수 감산이라 소수 불허 · SETTING_ATOM_MAP · 설정 JSON 갱신 deps). ControlButtonGroup의 자동 갱신 타이머·카운트다운이 설정값을 따르고 값 변경 시 즉시 재시작, 수동 갱신 핸들러의 잔존 하드코딩 60도 수정(reviewer MINOR 지적 반영). 매뉴얼 "배치된 채널은 N초"·녹화 분할 툴팁 "N초 주기" 문구 동적화. 목록(비배치) 채널 10분 주기는 불변. main 커밋 0edc5fc, verify 초록, reviewer APPROVE(동기화 라운드트립·타이머 stale closure·훅 deps 전수 확인), 브라우저 확인 완료(2026-08-18, 사용자) → v1.7.7(패치) push·배포
- 미해결: 없음
- 다음 작업: 새 작업 선정

### 2026-08-17 — 녹화 기능 기본 숨김 전환 (설정 동기화로만 노출)

- 완료: 새 설정 키 `record`(atomWithStorage, 기본 false, UI 토글 없음) 도입 — 설정 동기화 JSON에 `"record": true`를 직접 입력·저장해야만 녹화 관련 UI가 보인다. 숨김 대상: ① SettingsArea 녹화 설정 블록 전체(저장 위치~알림음 크기, 앞 Divider 포함) ② 컨트롤러 녹화 버튼 — 단 녹화 진행 중이면 종료 수단으로 계속 노출(`recordFeatureEnabled || isRecording`) ③ 매뉴얼 "방송 화면 녹화" 항목 + 설정 항목 설명에서 "녹화" 문구 제거 ④ SettingChangeIndicator의 녹화 관련 변경 알림. 자동 녹화 트리거도 플래그로 게이트(과거 설정으로 autoRecordEnabled가 남아 있어도 보이지 않는 녹화가 시작되지 않도록). 동기화 파이프라인 전체 연결: SETTINGS_ORDER·validatePreferences(validateBoolean)·SETTING_ATOM_MAP(프리셋 전환 시 적용/RESET)·설정 JSON 갱신 deps. 브랜치 `update/record-feature-hidden` 커밋 13e4942, verify 초록, reviewer APPROVE(라운드트립·훅 순서·JSX 균형·숨김 누출 경로 전수 확인)
- 참고(reviewer MINOR, 설계 의도와 일치): 기본값 false는 localStorage에 안 쓰이므로 동기화 JSON에 키가 안 보이는 게 정상. 켠 뒤 키 없는 JSON을 저장하면 전체 교체 규칙에 따라 다시 꺼진다(기존 동기화 의미론 그대로)
- 마무리(같은 날): 브라우저 확인 완료(사용자) 직후 키 이름을 `recordFeatureEnabled` → `record`로 단축(사용자 요청, 커밋 별도) — 순수 문자열 rename이라 동작 동일, rename 후 verify 초록. 주의: 이전 키로 켜 둔 브라우저는 새 키가 없어 다시 숨김 상태가 되므로 `"record": true`를 재지정해야 함 → main 병합, v1.7.5(패치) push·배포
- 다음 작업: 새 작업 선정

### 2026-08-12 — 저장 중 배너·프리셋 다이얼로그를 리모컨 블록 기준으로 이동

- 완료: ① 녹화 종료 후 "녹화 파일 저장 중..." 배너가 앱 최상단에 떠 캔버스 높이를 줄이던 문제 — 컨트롤러+설정창을 세로 flex 래퍼로 감싸고(래퍼째 팝업 portal) 배너를 래퍼 첫 자식으로 이동, `RecordingSavingBanner.jsx` 신규 추출 (커밋 85cd6c1은 컨트롤러 컬럼 안 1차 배치, f6d4498에서 사용자 피드백으로 두 패널 전체 폭 상단으로 확장). 팝업 root가 `max-content` 폭이라 긴 문구가 창 폭을 늘리지 않게 `width:0; minWidth:100%` 처리, 접힘(80px)+설정 닫힘일 땐 아이콘+툴팁 축약. ② 녹화 중 프리셋 변경 다이얼로그의 절대배치 기준을 설정창 Paper → 이 래퍼로 교체(`dialogContainerRef`를 page.jsx에서 소유해 전달) — 두 패널을 포함한 가운데 표시, backdrop도 전체 덮음. 두 커밋 각각 verify 초록 + reviewer APPROVE(내재 폭 계산·높이 stretch·ref 타이밍·잔존 참조 전수 확인)
- 마무리(2026-08-13): 브라우저 확인 완료(사용자 — 배너 전체 폭 표시·캔버스 불변, 접힘 시 아이콘+툴팁, 다이얼로그 두 패널 가운데 표시, 분리 팝업 폭 정상) → v1.7.4(패치) push·배포. 합의된 트레이드오프: 리모컨 분리 중 저장 진행 시 메인 창에는 배너 없음(탭 제목 경고는 유지)
- 다음 작업: 새 작업 선정

### 2026-08-09 — 패턴 정리 ③: ControlButtonGroup updater 순수화 + v1.7.3 배포

- 완료: `ControlButtonGroup.jsx`의 토글 updater 내부 `validateBoolean`+수동 `setItem` 3곳(controllerExpanded·pointerEventsEnabled·showCurrentTime)을 순수 토글로 축소, 같은 패턴 2곳 추가 정리 — handleChangeTheme 통째 제거(유일 호출자 handleToggleTheme가 light/dark만 생성해 validate가 죽은 로직, 직접 setThemeMode), handleChangeChatFontSize의 수동 setItem 삭제. 5개 키 전부 동기 저장 atomWithStorage라 수동 setItem은 중복 — 이동 아닌 삭제(SettingsArea 정리와 동일 판단). SettingsArea와 양쪽 토글 키(showCurrentTime·pointerEventsEnabled) 비대칭 해소. reviewer 지적 코스메틱(한 줄에 붙은 break/case) 후속 커밋으로 분리 수정. 브랜치 `refactor/control-button-group-pure-updaters` 커밋 700f964+8cd89d7, verify 초록, reviewer APPROVE(localStorage 직접 읽는 소비처는 전부 set 이후 이벤트 핸들러라 stale 읽기 없음 확인). 브라우저 확인 완료(사용자 — C/V/T/M/←→ 단축키 토글·새로고침 유지 정상) → main 병합(fast-forward), 병합 후 verify 초록, v1.7.3(패치) push·배포
- 미해결: 없음
- 다음 작업: 큐 잔여 2건은 모두 "이 영역 다시 만질 때" 성격(녹화 파일명 충돌 가드 · applyLiveStatusUpdate updater 내 channels setItem 이동) — 새 작업 선정 필요

### 2026-08-09 — 녹화 상태 오판·프리셋 경고 다이얼로그 버그 수정 + v1.7.2 배포

- 완료: ① 녹화 종료 후 파일 저장 중에도 `isRecordingAtom`이 켜져 있어 프리셋 변경 경고가 뜨던 문제(특히 브라우저 '공유 중지' 종료 경로) — `recorder.onstop`에서 teardown을 finalizeSegment보다 먼저 실행해 종료 즉시 상태 해제, 저장 표시는 `isSavingRecordingAtom` 유지 (커밋 1267e6e). ② 프리셋 변경 확인 다이얼로그가 화면 중앙에 떠 녹화본에 찍히고, 리모컨 분리 시 메인 문서 body portal + 팝업 head에만 있는 emotion 스타일 때문에 깨져 보이던 문제 — SettingsArea Paper(`position:relative`)로 portal 하고 Modal/backdrop을 절대배치로 전환해 도킹/분리 모두 설정 패널 안에만 표시 (커밋 0c8a5e7). verify 초록, reviewer APPROVE, 브라우저 확인 완료(사용자 — 도킹·리모컨 양쪽 정상) → v1.7.2(패치) push·배포
- 미해결: reviewer MINOR — 저장 완료 전 재녹화 시 같은 초 파일명 충돌 가능성 (큐 등록, 실사용상 희박)
- 다음 작업: 큐 최상단 — `ControlButtonGroup.jsx` 패턴 정리

### 2026-08-07 — 패턴 정리 ②: SettingsArea 비순수 updater 정리 + v1.7.1 배포

- 완료: `SettingsArea.jsx`의 setState updater 내부 부수효과 5곳(자동 숨김·자동 녹화·녹화 분할·알림음·현재 시간 토글)을 렌더 값 기반 직접 set으로 순수화 — StrictMode 이중 실행 시 알림음 2회 재생 가능성도 함께 해소. 분석 결과 해당 키 전부가 `atomWithStorage`(set 시 동기 저장)라 수동 `localStorage.setItem` 15곳은 위치 문제가 아닌 중복 — 이동 아닌 삭제로 정리. 폴더 해제는 `setRecordSaveDirName(RESET)`으로(키 제거+기본값, 기존과 최종 상태 동일), 알림음 핸들러의 `setData` 3곳은 기존 useEffect가 커버해 삭제, 수동 setItem만 게이트하던 `validateBoolean` 4곳도 죽은 로직이라 제거. 브랜치 `refactor/settings-area-pure-updaters` 커밋 41bbb17, verify 초록, reviewer APPROVE(키별 atomWithStorage 여부·쓰기 타이밍 의존·RESET 동치성 전수 확인). 브라우저 확인 완료(토글 5종 저장·새로고침 유지, 알림음 1회 재생, 폴더 지정/해제+분할 자동 꺼짐, 셀렉트류, JSON 패널 — 사용자 확인) → main 병합(fast-forward), 병합 후 verify 초록. 보류 중이던 패턴 정리 ①과 함께 v1.7.1(패치)로 push·배포
- 미해결: 없음
- 다음 작업: 큐 최상단 — `ControlButtonGroup.jsx` 같은 패턴 정리(reviewer 지적: updater 내부 validateBoolean+setItem 4곳, showCurrentTime·pointerEventsEnabled는 SettingsArea와 비대칭 상태)

### 2026-08-07 — 패턴 정리 ①: ChzzkHlsPlayer 렌더 중 ref 미러 → useEffect 미러

- 완료: 렌더 본문 `ref.current = value` 대입 4곳(onErrorRef · latestUrlRef · targetLatencyRef · storedVolumeRef — 큐에 적힌 3곳 + 같은 패턴 onErrorRef 추가 발견)을 `useEffect(() => { ... }, [value])` 미러로 교체. `useRef(초기값)` 초기화는 유지라 마운트 시점 값 동일. 브랜치 `refactor/chzzk-hls-ref-mirror` 커밋 b836600, verify 초록. reviewer APPROVE — 네 ref의 `.current` 읽기 지점 전수 추적 결과 stale 읽기 없음(미러 effect가 소비 effect보다 선언 순서상 먼저 실행, 나머지 읽기는 전부 커밋 이후 비동기 콜백). 브라우저 확인 완료(재생 기본·볼륨 상속·딜레이 설정 정상, 사용자 확인 — onErrorRef 에러 복구 경로는 인위 재현이 어려워 미확인) → main 병합(fast-forward), 병합 후 verify 초록, 브랜치 삭제
- 미해결: push 보류 — 패턴 정리 ②까지 마친 뒤 v1.7.1(패치)로 한 번에 배포하기로 함(배포 단위 버전 규칙). main이 origin/main보다 1커밋 앞선 상태
- 다음 작업: 큐의 패턴 정리 ② — `SettingsArea.jsx`의 setState updater 내부 `localStorage.setItem` 정리, 완료 후 버전 업·push

### 2026-08-07 — 브라우저 확인 반영: 볼륨 병합, 녹화 분할 재설계 + 파일명 카테고리

- 완료: ① 프리셋 다이얼로그·HLS 볼륨 통합 브라우저 확인 완료(정상) — `feat/chzzk-hls-volume` main 병합(67fd624). ② 녹화 분할 1차 테스트 실패(분할 시점에 녹화 전체 종료, 재시작 안 됨) 원인 분석: 기존 설계가 "recorder 정지 → 새 파일 열기" 순서라 새 파일 열기 실패(특히 저장 대화상자로 시작한 녹화는 폴더 핸들이 없어 무조건 실패)가 곧 전체 종료였음. 준비-후-교체 방식으로 재설계(4b1b90f): 새 파일·새 recorder를 먼저 준비해 교체 후 이전 recorder 정지(onstop이 ref 비교로 회전/전체 종료 구분), 실패 시 분할만 건너뛰고 기존 녹화 유지 + 스낵바 알림, 세그먼트별 writable/chunks 클로저 바인딩으로 겹침 구간 혼선 방지. ③ 녹화 파일명에 라이브 카테고리 추가(`시간 채널명-방제-카테고리`, 있는 것만) — 같은 커밋. ④ 사용자 CONVENTIONS.md 버전 규칙 수정 커밋(e305fab). verify 초록
- 추가(같은 날): 녹화 분할 토글에 저장 폴더 전제 조건 적용(7cf1a3d) — ① 폴더 미지정 상태에서 켜려 하면 스낵바 경고 + false 유지 ② 폴더 해제 시 분할 자동 꺼짐(스낵바 안내) ③ 설정 동기화 유효성 검사에 `validateRecordSplitOnZone1Change` 추가(폴더 없으면 true 거부 — 기존엔 switch에 케이스가 없어 무검사 통과였음). verify 초록
- 추가(같은 날): 1번 채널 교체(위치 스와프 포함)도 분할 트리거에 포함(cca40a5, 사용자 합의) — 파일명이 1번 채널 기준이므로 채널이 바뀌면 파일도 나뉘는 것이 자연스럽고, 방제 변경 없이도 분할 테스트 가능. 사용자 테스트에서 "스와프로는 분할 안 됨"이 확인됐는데 이는 당시 설계(교체는 기준만 갱신)대로였음
- 마무리(같은 날): 녹화 분할 브라우저 확인 완료(채널 스와프로 분할·이어짐 정상, 사용자 확인) → `feat/record-split-on-change` main 병합(83073d8), 병합 후 verify 초록, origin/main push. 병합 완료 브랜치 2개(feat/chzzk-hls-volume · feat/record-split-on-change) 삭제
- 버전(같은 날): 첫 push에서 버전 업 누락(사용자 지적 — main push = Vercel 즉시 배포) → v1.7.0으로 후속 커밋(6e90e2d, feat 3건 = 마이너)·push. CONVENTIONS.md 버전 섹션에 "main push = 즉시 배포" 명시(787c07d). 참고: GitHub 저장소가 StreamFusion → MongBok으로 이전됨 — origin URL 갱신 필요(리다이렉트로는 동작)
- 미해결: 없음 — reviewer 지적 패턴 정리 2건은 큐 대기
- 다음 작업: 큐의 패턴 정리 2건

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
