// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Konfigurasi deployment frontend BotakStore dan API Laravel.
// - `pages` + `prerender`: every public route is rendered to static HTML at
//   build time (<route>/index.html), including full <head> OG meta so link
//   previews (WhatsApp/FB/X) work without a Node server.
// - `spa`: unknown paths (e.g. /profil, /checkout) fall back to the app
//   shell; Apache rewrites them via deploy/frontend/.htaccess.
// - `sitemap`: sitemap.xml generated with the production host.
// Auth-gated routes (/profil, /checkout, /dashboard, /botakstore-admin/*)
// are intentionally NOT prerendered — they render client-side after login.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    pages: [
      { path: "/" },
      { path: "/topup" },
      { path: "/topup/mobile-legends" },
      { path: "/joki" },
      { path: "/joki/mobile-legends" },
      { path: "/joki/valorant" },
      { path: "/joki/pubg" },
      { path: "/joki/efootball" },
      { path: "/cek-order" },
      { path: "/voucher" },
      { path: "/faq" },
      { path: "/kebijakan" },
      { path: "/login" },
      { path: "/daftar" },
    ],
    prerender: {
      enabled: true,
      crawlLinks: false,
      autoSubfolderIndex: true,
      failOnError: false,
    },
    spa: { enabled: true },
    sitemap: { enabled: true, host: "https://botakstore.id" },
  },
});
