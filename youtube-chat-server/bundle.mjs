import { readFileSync, readdirSync, unlinkSync, existsSync } from 'fs';
import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'));
const downloadsDir = join(__dirname, '../public/downloads');

// 기존 빌드 파일 정리 (서버 실행 파일 및 압축 파일)
if (existsSync(downloadsDir)) {
  readdirSync(downloadsDir).forEach(file => {
    if (file.startsWith('mongbok_youtube_chat_server_') || file.startsWith('youtube_chat_server_')) {
      try {
        unlinkSync(join(downloadsDir, file));
      } catch (err) {
        console.error(`❌ Failed to delete ${file}: ${err.message}`);
      }
    }
  });
  console.log(`🧹 cleaned old builds in public/downloads`);
}

await build({
  entryPoints: ['server.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/server.cjs',
  define: {
    __SERVER_VERSION__: JSON.stringify(version),
    // CJS 번들에서 import.meta.url 폴리필 (youtubei.js 등 ESM 라이브러리가 내부적으로 사용)
    'import.meta.url': '__importMetaUrl__',
  },
  banner: {
    js: 'var __importMetaUrl__ = require("url").pathToFileURL(__filename).href;',
  },
  logOverride: {
    'empty-import-meta': 'silent',
  },
});

console.log(`✅ bundled (v${version}) → dist/server.cjs`);
