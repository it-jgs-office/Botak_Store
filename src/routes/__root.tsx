import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { hydrateStorefrontState } from "../lib/store";
import { endSession, restoreSession } from "../lib/actions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Halaman gagal dimuat</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terjadi kesalahan. Coba muat ulang.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Coba lagi
          </button>
          <a
            href="/"
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground"
          >
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BotakStore — Joki Game Terpercaya" },
      {
        name: "description",
        content: "Layanan joki rank dan top up Mobile Legends dengan progres transparan.",
      },
      { property: "og:title", content: "BotakStore — Joki Game Terpercaya" },
      {
        property: "og:description",
        content: "Layanan joki rank dan top up Mobile Legends dengan progres real-time.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://botakstore.id/" },
      { property: "og:site_name", content: "BotakStore" },
      { property: "og:locale", content: "id_ID" },
      { property: "og:image", content: "https://botakstore.id/preview.jpg" },
      { property: "og:image:width", content: "1303" },
      { property: "og:image:height", content: "533" },
      { property: "og:image:alt", content: "BotakStore — Joki Game Terpercaya" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "BotakStore — Joki Game Terpercaya" },
      {
        name: "twitter:description",
        content: "Layanan joki rank dan top up Mobile Legends dengan progres real-time.",
      },
      { name: "twitter:image", content: "https://botakstore.id/preview.jpg" },
      { name: "theme-color", content: "#101419" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/iconbotak.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    void hydrateStorefrontState().catch(() => undefined);
    void restoreSession();

    window.addEventListener("botakstore:session-expired", endSession);
    return () => window.removeEventListener("botakstore:session-expired", endSession);
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
