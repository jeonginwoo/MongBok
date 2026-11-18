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

# 매뉴얼의 확장 다운로드 링크는 manifest 버전으로 파일명을 만든다 —
# 버전만 올리고 zip을 다시 만들지 않으면 배포본에서 404가 된다
step "chzzk-extension zip" node -e "
const v = require('./chzzk-extension/manifest.json').version;
const f = 'public/downloads/mongbok_chzzk_extension_v' + v + '.zip';
if (!require('fs').existsSync(f)) { console.error('missing ' + f + ' — run: bash scripts/zip-chzzk-extension.sh'); process.exit(1); }
"

step "lint" npx eslint src

if [ "$QUICK" != "--quick" ]; then
  step "build" npm run --silent build
fi

exit $fail
