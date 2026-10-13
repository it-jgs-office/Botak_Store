import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions";
import { useHydrated, useSession } from "./ui";
import { BannerSlider } from "./BannerSlider";
import { SiteFaq } from "./SiteFaq";

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

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
          <AlertDialogDescription>
            Kamu perlu masuk kembali untuk melihat profil dan riwayat transaksi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Tetap masuk</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 text-white hover:bg-red-700">
            <LogOut /> Ya, keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PublicLayout({
  children,
  banner = "full",
  footerGap = "default",
  showFaq = true,
}: {
  children: ReactNode;
  banner?: "full" | "compact" | "none";
  footerGap?: "default" | "tight";
  showFaq?: boolean;
}) {
  const { session, user, db } = useSession();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090d10] text-white shadow-lg">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 sm:h-16 sm:px-4">
          <Logo />
          <div className="flex items-center gap-2">
            {hydrated && session && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Buka menu profil"
                    title={user.name}
                    className="flex items-center gap-1 rounded-full bg-primary py-1 pl-1 pr-2 text-[#101419] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#101419] text-sm font-black text-[#ffd84d]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={10}
                  className="w-56 rounded-2xl border-[#ecd46e] bg-white p-2 shadow-[0_18px_45px_-24px_rgba(0,0,0,.35)]"
                >
                  <DropdownMenuLabel className="px-3 py-2">
                    <span className="block truncate font-black text-[#172033]">{user.name}</span>
                    <span className="mt-0.5 block truncate text-xs font-normal text-[#718096]">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#efe4b0]" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl px-3 py-2.5 font-bold text-[#202738] focus:bg-[#fff8df]">
                    <Link to="/profil"><UserRound /> Profil Saya</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl px-3 py-2.5 font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                    onSelect={(event) => {
                      event.preventDefault();
                      setLogoutOpen(true);
                    }}
                  >
                    <LogOut /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-[#ffd84d]">
                  <Link to="/daftar">Daftar</Link>
                </Button>
                <Button asChild size="sm" className="text-[#101419]">
                  <Link to="/login">Masuk</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      {banner !== "none" && (
        <div className="mx-auto w-full max-w-7xl px-3 pt-3 sm:px-4 sm:pt-4">
          <BannerSlider variant={banner} />
        </div>
      )}
      <main>{children}</main>
      {showFaq && <SiteFaq />}
      <footer className={`${showFaq || footerGap === "tight" ? "mt-4" : "mt-20"} border-t border-border bg-[#101419] text-white`}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:py-10 md:grid-cols-4 md:gap-8 md:py-12">
          <div className="col-span-2 space-y-3 md:col-span-2">
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
            <a href="/#topup" className="block text-white/60 hover:text-primary">
              Top Up Game
            </a>
            <a href="/#joki" className="block text-white/60 hover:text-primary">
              Joki Rank
            </a>
            <a href="/#orders" className="block text-white/60 hover:text-primary">
              Cek Pesanan
            </a>
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
      <a
        href={`https://wa.me/${db.settings.whatsapp}?text=KOMPLAIN`}
        target="_blank"
        rel="noreferrer"
        aria-label="Komplain melalui WhatsApp"
        title="Komplain melalui WhatsApp"
        className="fixed bottom-3 right-3 z-[60] block h-12 w-12 rounded-full transition duration-200 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd84d] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16"
      >
        <img
          src="/icon/icon-wa.webp"
          alt="WhatsApp"
          className="h-full w-full object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,.28)]"
        />
      </a>
      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          logout();
          navigate({ to: "/login" });
        }}
      />
    </div>
  );
}
