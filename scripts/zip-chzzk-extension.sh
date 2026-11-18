#!/usr/bin/env bash
# chzzk-extension/ → public/downloads/mongbok_chzzk_extension_v<버전>.zip
# 매뉴얼의 다운로드 버튼이 manifest 버전으로 파일명을 만들기 때문에, 확장을
# 고치면 manifest 버전을 올리고 이 스크립트를 다시 돌려 zip을 함께 커밋해야 한다.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./chzzk-extension/manifest.json').version")
OUT_DIR="public/downloads"
OUT="$OUT_DIR/mongbok_chzzk_extension_v${VERSION}.zip"
# 압축을 풀면 항상 같은 이름의 폴더가 나오게 해, 업데이트 시 같은 위치에
# 덮어쓰고 확장을 새로고침만 하면 되도록 한다
ROOT_NAME="mongbok_chzzk_extension"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir "$STAGE/$ROOT_NAME"
cp chzzk-extension/background.js chzzk-extension/content.js "$STAGE/$ROOT_NAME/"
# 배포본에서는 개발용 호스트(localhost)를 뺀다 — 그대로 두면 사용자 PC의 모든
# 로컬 웹앱에 content script가 주입된다. 개발 시에는 chzzk-extension/ 폴더를 직접 로드
node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('chzzk-extension/manifest.json', 'utf8'));
for (const cs of m.content_scripts) cs.matches = cs.matches.filter((p) => p.startsWith('https://'));
fs.writeFileSync(process.argv[1], JSON.stringify(m, null, 2) + '\n');
" "$STAGE/$ROOT_NAME/manifest.json"

# 이전 버전 zip이 배포물에 남지 않도록 정리
rm -f "$OUT_DIR"/mongbok_chzzk_extension_v*.zip
ABS_OUT="$(pwd)/$OUT"

if command -v zip >/dev/null 2>&1; then
  (cd "$STAGE" && zip -qr "$ABS_OUT" "$ROOT_NAME")
elif [ -x /c/Windows/System32/tar.exe ]; then
  # Git Bash의 GNU tar는 zip을 못 만든다 — Windows 내장 bsdtar 사용.
  # PowerShell Compress-Archive는 경로 구분자를 \로 써서 macOS/Linux에서 풀리지 않는다
  /c/Windows/System32/tar.exe -a -cf "$(cygpath -w "$ABS_OUT")" -C "$(cygpath -w "$STAGE")" "$ROOT_NAME"
else
  echo "zip 도구를 찾을 수 없습니다 (zip 또는 Windows tar.exe 필요)" >&2
  exit 1
fi

echo "✅ $OUT"
