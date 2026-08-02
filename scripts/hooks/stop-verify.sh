#!/usr/bin/env bash
# Stop hook: block ending the session while the code is broken.
# exit 0 = allow stop. exit 2 = block stop; stderr is fed back to Claude
# so it can fix the problem itself (block + feedback).
#
# Guard: only act when src/ files were actually touched —
# doc-only or chat-only sessions must never be blocked.

if git status --porcelain -- src 2>/dev/null | grep -q .; then
  if ! bash scripts/verify.sh --quick >/dev/null 2>&1; then
    echo "verify --quick is failing. Fix it before ending the session — read only the failing part of build/last-verify.log." >&2
    exit 2
  fi
fi
exit 0
