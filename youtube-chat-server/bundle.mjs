import { readFileSync } from 'fs';
import { build } from 'esbuild';

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));

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
