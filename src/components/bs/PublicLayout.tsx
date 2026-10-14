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
import { ACTIVE_PAKASIR_PAYMENT_METHODS } from "@/lib/pakasir";
import { useHydrated, useSession } from "./ui";
import { BannerSlider } from "./BannerSlider";
import { ServiceNavigation, type ServiceSection } from "./ServiceNavigation";
import { SiteFaq } from "./SiteFaq";

const MARQUEE_PAYMENT_METHODS = [
  ...ACTIVE_PAKASIR_PAYMENT_METHODS,
  ...ACTIVE_PAKASIR_PAYMENT_METHODS,
  ...ACTIVE_PAKASIR_PAYMENT_METHODS,
];

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
  hideHeader = false,
  serviceNavigation,
  liftChat = false,
}: {
  children: ReactNode;
  banner?: "full" | "compact" | "none";
  footerGap?: "default" | "tight";
  showFaq?: boolean;
  hideHeader?: boolean;
  serviceNavigation?: ServiceSection;
  liftChat?: boolean;
}) {
  const { session, user, db } = useSession();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <header
        className={`sticky top-0 z-40 border-b border-white/10 bg-[#101419] text-white shadow-[0_8px_28px_-22px_rgba(0,0,0,.75)] transition-transform duration-300 motion-reduce:transition-none ${
          hideHeader ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:gap-4 sm:px-4 sm:py-0">
        <Logo />
          <div className="hidden sm:order-none sm:mx-auto sm:max-w-2xl sm:flex-1 sm:block">
            <ServiceNavigation active={serviceNavigation} />
          </div>
          <div className="flex items-center gap-2">
            {hydrated && session && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Buka menu profil"
                    title={user.name}
                    className="flex items-center gap-1 rounded-full bg-primary py-1 pl-1 pr-2 text-[#101419] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6a900]"
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
      <main className="pb-16 sm:pb-0">{children}</main>
      {showFaq && <SiteFaq />}
      {/* Payment Method Marquee */}
      <div className="border-t border-white/10 bg-[#101419] py-2.5 sm:py-3 overflow-hidden">
        <div className="flex animate-marquee gap-3 whitespace-nowrap sm:gap-8">
          {MARQUEE_PAYMENT_METHODS.map((item, i) => (
            <span
              key={`${item.id}-${i}`}
              className="inline-flex shrink-0 items-center px-3 py-1.5"
            >
              <img
                src={item.icon}
                alt={item.name}
                loading="lazy"
                className="h-6 w-auto max-w-[88px] object-contain sm:h-7"
              />
            </span>
          ))}
        </div>
      </div>
      <footer className={`border-t border-white/10 bg-[#101419] text-white pb-16 sm:pb-0`}>
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
            <Link to="/topup" className="block text-white/60 hover:text-primary">
              Top Up Game
            </Link>
            <Link to="/joki" className="block text-white/60 hover:text-primary">
              Joki Rank
            </Link>
            <Link to="/cek-order" className="block text-white/60 hover:text-primary">
              Cek Pesanan
            </Link>
            <Link to="/voucher" className="block text-white/60 hover:text-primary">
              Voucher
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
      <a
        href={`https://wa.me/${db.settings.whatsapp}?text=KOMPLAIN`}
        target="_blank"
        rel="noreferrer"
        aria-label="Komplain melalui WhatsApp"
        title="Komplain melalui WhatsApp"
        className={`fixed ${liftChat ? "bottom-36" : "bottom-20"} right-3 z-[60] block h-12 w-12 rounded-full transition duration-200 hover:-translate-y-1 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd84d] focus-visible:ring-offset-2 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16`}
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
      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi mobile"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#101419] sm:hidden"
      >
        <div className="flex items-center justify-around px-1 pb-1">
          <ServiceNavigation active={serviceNavigation} mobile />
        </div>
      </nav>
    </div>
  );
}
