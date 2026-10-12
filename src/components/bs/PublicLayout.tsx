import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LayoutDashboard, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated, useSession } from "./ui";
import { BannerSlider } from "./BannerSlider";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/topup", label: "Top Up" },
  { to: "/joki", label: "Joki Rank" },
  { to: "/cek-order", label: "Cek Pesanan" },
  { to: "/faq", label: "Promo" },
] as const;

export function Logo({ animated = true }: { animated?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="Botak Store"
      className={`logo-lockup ${animated ? "logo-lockup-animated" : ""}`}
    >
      <span className="logo-icon-shell">
        <img src="/iconbotak.png" alt="" className="logo-icon brand-logo" />
      </span>
      <img src="/logobotak.png" alt="Botak Store" className="logo-wordmark" />
    </Link>
  );
}

export function dashboardPath(role?: string) {
  return "/dashboard";
}

export function PublicLayout({
  children,
  banner = "full",
}: {
  children: ReactNode;
  banner?: "full" | "compact" | "none";
}) {
  const { session, user } = useSession();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090d10] text-white shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-md px-3 py-2 text-sm text-white/75 transition hover:text-primary"
                activeProps={{ className: "text-primary font-semibold" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <div className="hidden h-9 w-44 items-center gap-2 rounded-lg border border-white/10 bg-white/[.06] px-3 text-white/45 xl:flex">
              <Search className="h-4 w-4" />
              <span className="text-xs">Cari paket joki...</span>
            </div>
            <ShoppingCart className="mx-1 h-5 w-5 text-white/80" />
            {hydrated && session && user ? (
              <>
                <Button asChild size="sm" className="text-[#101419]">
                  <Link to={dashboardPath(session.role)}>
                    <LayoutDashboard /> Dashboard
                  </Link>
                </Button>
                <Link
                  to="/profil"
                  aria-label="Profil saya"
                  title={user.name}
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-black text-[#101419] transition hover:brightness-95"
                >
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              </>
            ) : (
              <>
                <Button asChild size="sm" className="text-[#101419]">
                  <Link to="/login">Masuk</Link>
                </Button>
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        {open && (
          <div className="border-t border-white/10 px-4 py-3 lg:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm"
              >
                {n.label}
              </Link>
            ))}
            {session && (
              <Link
                to={dashboardPath(session.role)}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            <Link
              to={session ? "/profil" : "/login"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-primary-glow"
            >
              <UserRound className="h-4 w-4" />
              {session ? "Profil saya" : "Masuk"}
            </Link>
          </div>
        )}
      </header>
      {banner !== "none" && <BannerSlider variant={banner} />}
      <main>{children}</main>
      <footer className="mt-20 border-t border-border bg-[#101419] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <Logo animated={false} />
            <p className="max-w-sm text-sm text-white/60">
              Layanan joki Mobile Legends dengan paket jelas, progres transparan, dan penjoki
              terverifikasi.
            </p>
            <p className="text-xs text-white/40">
              Prototype demo â€” semua data & pembayaran adalah simulasi.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Layanan</p>
            <Link to="/topup" className="block text-white/60 hover:text-primary">
              Top Up Game
            </Link>
            <Link to="/joki" className="block text-white/60 hover:text-primary">
              Joki Rank
            </Link>
            <Link to="/cek-order" className="block text-white/60 hover:text-primary">
              Cek Pesanan
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Bantuan</p>
            <Link to="/faq" className="block text-white/60 hover:text-primary">
              FAQ
            </Link>
            <Link to="/kebijakan" className="block text-white/60 hover:text-primary">
              Kebijakan Layanan
            </Link>
            <Link to="/login" className="block text-white/60 hover:text-primary">
              Masuk Demo
            </Link>
          </div>
        </div>
        <p className="border-t border-white/10 py-4 text-center text-xs text-white/40">
          Â© 2026 BotakStore. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
