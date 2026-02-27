import archiver from "archiver";
import { createWriteStream, existsSync, unlinkSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const downloadsDir = resolve(__dirname, "../public/downloads");

const files = [
  { src: "youtube-chat-server-win-x64.exe", zip: "youtube-chat-server-win-x64.zip" },
  { src: "youtube-chat-server-macos-x64",   zip: "youtube-chat-server-macos-x64.zip" },
  { src: "youtube-chat-server-linux-x64",   zip: "youtube-chat-server-linux-x64.zip" },
];

for (const { src, zip } of files) {
  const srcPath = resolve(downloadsDir, src);
  const zipPath = resolve(downloadsDir, zip);

  if (!existsSync(srcPath)) {
    console.log(`⏭️  ${src} not found, skipping`);
    continue;
  }

  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ ${zip} (${(archive.pointer() / 1024 / 1024).toFixed(1)} MB)`);
      resolve();
    });
    archive.on("error", reject);
    archive.pipe(output);
    archive.file(srcPath, { name: src });
    archive.finalize();
  });
}
