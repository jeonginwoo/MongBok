#!/usr/bin/env bash
# Full verification in one command.
# Full logs are offloaded to build/last-verify.log — the console prints only
# PASS/FAIL per step, so verification output never floods the context window.
# Usage: bash scripts/verify.sh [--quick]   (--quick: lint only, for fast loops)
set -u

QUICK="${1:-}"
LOG="build/last-verify.log"
mkdir -p build
: > "$LOG"

fail=0

step() {
  local name="$1"; shift
  echo "== $name ==" >> "$LOG"
  if "$@" >> "$LOG" 2>&1; then
    echo "PASS  $name"
  else
    echo "FAIL  $name  (see $LOG)"
    fail=1
  fi
}

step "lint" npx eslint src

if [ "$QUICK" != "--quick" ]; then
  step "build" npm run --silent build
fi

exit $fail
