---
description: Start a session — restore state, plan before code
---

Start a work session.

1. Read `docs/PROGRESS.md` — current state, decision log, work queue.
2. Present a plan for the next task (queue top item unless the user says
   otherwise) and wait for user approval before writing any code.
3. Keep the unit of work small: one queue item (or one coherent feature/fix)
   per session.
4. Remember this project has no test suite — plan how the change will be
   verified in the browser, not just that verify.sh passes.
