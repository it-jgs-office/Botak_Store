/**
 * Pack hasil `vite build` (TanStack Start + nitro) menjadi folder `dist/`
 * siap upload ke shared hosting cPanel/Apache, seperti build React SPA
 * pada umumnya.
 *
 * - Menyalin SELURUH isi .output/public/ -> dist/
 *   (HTML prerender tiap route, _shell.html, assets/, gambar,
 *   robots.txt, sitemap.xml, preview.jpg).
 * - Menyalin _shell.html -> dist/index.html agar "/" selalu punya file
 *   (hosting yang mengabaikan DirectoryIndex tetap jalan).
 * - Menyalin deploy/frontend/.htaccess -> dist/.htaccess
 *   (HTTPS, www->apex, SPA fallback, cache).
 *
 * Cara upload: unggah SELURUH ISI folder dist/ (termasuk .htaccess)
 * ke document root botakstore.id (biasanya public_html).
 */
import { rmSync, cpSync, copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(frontendRoot, ".output", "public");
const dist = resolve(frontendRoot, "dist");
const shell = resolve(src, "_shell.html");
const htaccessSrc = resolve(frontendRoot, "..", "deploy", "frontend", ".htaccess");

if (!existsSync(src)) {
  console.error(`[copy-dist] ${src} tidak ditemukan. Jalankan "vite build" dulu.`);
  process.exit(1);
}
if (!existsSync(shell)) {
  console.error("[copy-dist] _shell.html tidak ditemukan di hasil build.");
  process.exit(1);
}

rmSync(dist, { recursive: true, force: true });
cpSync(src, dist, { recursive: true });
copyFileSync(shell, resolve(dist, "index.html"));

if (existsSync(htaccessSrc)) {
  copyFileSync(htaccessSrc, resolve(dist, ".htaccess"));
  console.log("[copy-dist] .htaccess ikut disalin ke dist/.");
} else {
  console.warn("[copy-dist] deploy/frontend/.htaccess tidak ketemu, lewati.");
}

console.log(`[copy-dist] Siap upload: ${dist}`);
