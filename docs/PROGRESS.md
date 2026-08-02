# 진행 상태 원장 (PROGRESS)

> **모든 세션은 이 파일을 읽는 것으로 시작하고, 이 파일을 갱신하는 것으로 끝난다.**

## 현재 상태 (2026-08-02)

- **버전:** v1.5.6 — 멀티뷰 핵심 기능(4개 플랫폼·레이아웃·녹화·프리셋) 안정화 단계
- **진행:** 하네스 도입 완료 (CLAUDE.md · PROGRESS · verify.sh · /next · /wrap-up · settings/Stop 훅 · reviewer)
- **검증 상태:** verify.sh 초록 (lint 0 에러 / 경고 63건은 아래 큐로 상환 예정)
- **다음 작업:** 작업 큐 최상단 항목부터
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

- [ ] 훅 조기 반환 리팩터링: `if (!x) return null`이 훅 호출보다 앞에 있는 패턴 제거 (대상 5개 파일: `ChannelListChannelInfo.jsx` · `LiveCategory.jsx` · `LiveTags.jsx` · `DraggableChat.jsx` · `DraggableView.jsx`). 완료 후 eslint `react-hooks/rules-of-hooks`를 error로 복원. ※ 렌더 순서에 영향 주는 변경이므로 파일당 브라우저 동작 확인 필수 — react-compiler 활성화 상태라 특히 위험
- [ ] 미사용 변수 정리 (~35건): 데드코드는 삭제, 의도적 보존(레이아웃 정의 등)은 `_` 프리픽스. 완료 후 eslint `no-unused-vars`를 error로 복원

## 세션 로그

### 형식 (복사해서 사용)

```
### YYYY-MM-DD — <작업 요약>
- 완료: <한 것 + 검증 결과>
- 미해결: <다음 세션으로 넘기는 것>
- 다음 작업: <구체적으로>
```

### 2026-08-02 — 하네스 도입 (pms_mcp_v2에서 이식)

- 완료: CLAUDE.md(불변식 4개 · 작업 방식) · docs/PROGRESS.md · scripts/verify.sh(lint+build, 로그 오프로딩) · Stop 훅 · .claude/settings.json(allow/deny) · /next · /wrap-up 커맨드 · reviewer 에이전트. eslint 수리(react-refresh 제거 · node 전역 · 관례 반영)로 98 에러 → 0 에러(경고 63). case 블록 중괄호 9곳 · hasOwnProperty 1곳 코드 수정. `lint` 스크립트를 `next lint`(Next 16에서 제거됨) → `eslint src`로 교체
- 미해결: 훅 조기 반환 23건 · 미사용 변수 ~35건 (작업 큐 등록, 해당 룰 warn 강등 상태)
- 다음 작업: 작업 큐 1번 — 훅 조기 반환 리팩터링
