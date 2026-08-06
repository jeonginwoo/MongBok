# Mongbok (몽복) — multi-platform streaming multiview

Next.js 16 (App Router) + React 19 + MUI v7 + Jotai web app that plays CHZZK /
SOOP / YouTube / Twitch streams side by side. Plain JavaScript — no TypeScript.

## Session start

Read `docs/PROGRESS.md` first — current state, work queue, decision log.

## Commands

```bash
bash scripts/verify.sh        # full verification (lint + production build)
                              # --quick: lint only
                              # full log → build/last-verify.log; on FAIL read only the failing part
npm run dev                   # dev server — runtime behavior can only be checked here, in a browser
```

## Structure rules (invariants — never write code that violates them)

1. Platform REST/GraphQL calls go through the shared axios clients in
   `src/api/client.js` (consumed by `src/api/live.js` · `search.js`).
   Components never call platform HTTP APIs directly.
2. Realtime chat (websocket/polling) logic lives in `src/hooks/use*Chat.js` —
   one hook per platform.
3. Cross-component state is a jotai atom in `src/atoms/`. Never introduce
   another state-management library.
4. Screen ratio / layout definitions live only in `src/data/canvas.js`.

## Way of working

- There is NO test suite. verify.sh covers lint + build only; runtime behavior
  must be checked in the browser. When you could not check it, say so
  explicitly — never imply a feature was verified when it wasn't.
- Never claim a task done unless `bash scripts/verify.sh` passes. On FAIL, read
  only the failing part of `build/last-verify.log` (grep/tail) — never the whole log.
- All eslint rules run at error (no temporary downgrades remain). Vars kept
  unused on purpose (e.g. layout definitions in `src/data/canvas.js`) are
  `_`-prefixed — eslint ignores `^[A-Z_]`.
- Code comments in Korean, explaining *why*, not *what*.
- Git and Next.js conventions live in `docs/CONVENTIONS.md` — read it before
  committing or adding routes / platform APIs / external image domains.
