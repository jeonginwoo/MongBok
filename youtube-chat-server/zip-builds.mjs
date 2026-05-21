import archiver from "archiver";
import { createWriteStream, existsSync, unlinkSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const downloadsDir = resolve(__dirname, "../public/downloads");

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const files = [
  { src: "youtube_chat_server_win-x64.exe", zipPrefix: "mongbok_youtube_chat_server_win-x64" },
  { src: "youtube_chat_server_macos-x64",   zipPrefix: "mongbok_youtube_chat_server_macos-x64" },
  { src: "youtube_chat_server_linux-x64",   zipPrefix: "mongbok_youtube_chat_server_linux-x64" },
];

for (const { src, zipPrefix } of files) {
  const srcPath = resolve(downloadsDir, src);
  const zipName = `${zipPrefix}_v${version}.zip`;
  const zipPath = resolve(downloadsDir, zipName);

  if (!existsSync(srcPath)) {
    console.log(`⏭️  ${src} not found, skipping`);
    continue;
  }

  await new Promise((resolvePromise, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ${zipName} (${(archive.pointer() / 1024 / 1024).toFixed(1)} MB)`);
      unlinkSync(srcPath);
      console.log(`🗑️  ${src} 삭제됨`);
      resolvePromise();
    });
    archive.on("error", reject);
    archive.pipe(output);
    
    const isExe = src.endsWith('.exe');
    const internalName = `mongbok_youtube_chat_server_v${version}${isExe ? '.exe' : ''}`;
    archive.file(srcPath, { name: internalName });
    archive.finalize();
  });
}
