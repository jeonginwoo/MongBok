---
description: End a session — verify, record, commit
---

End the current session.

1. Run `bash scripts/verify.sh`. If it fails, fix it first — never wrap up red.
2. Update `docs/PROGRESS.md`:
   - 현재 상태 (진행 위치 · 다음 작업 · 검증 상태)
   - 세션 로그 entry (use the 형식 template, newest on top) — include whether
     runtime behavior was checked in the browser or not
   - any new decisions → 결정 기록, always with 근거
   - discovered follow-up work → 작업 큐 as `- [ ]`, never silently done
3. If CLAUDE.md drifted from reality during this session, fix it now.
4. Commit with the existing convention: `feat:|fix:|update:|style: <Korean summary>`.
