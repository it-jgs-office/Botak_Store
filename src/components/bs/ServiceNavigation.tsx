import { Link, useRouterState } from "@tanstack/react-router";
import { BadgeDollarSign, ClipboardList, Gamepad2, Target, TicketPercent } from "lucide-react";

export type ServiceSection = "home" | "joki" | "topup" | "orders" | "voucher";

const items = [
  { id: "home", label: "Beranda", to: "/", icon: Gamepad2 },
  { id: "topup", label: "Top Up", to: "/topup", icon: BadgeDollarSign },
  { id: "joki", label: "Joki Rank", to: "/joki", icon: Target },
  { id: "orders", label: "Cek Pesanan", to: "/cek-order", icon: ClipboardList },
  { id: "voucher", label: "Voucher", to: "/voucher", icon: TicketPercent },
] as const;

const mobileItems = [items[1], items[2], items[0], items[3], items[4]] as const;

export function ServiceNavigation({
  active,
  mobile = false,
}: {
  active?: ServiceSection;
  mobile?: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routeActive: ServiceSection | undefined =
    pathname === "/"
      ? "home"
      : pathname.startsWith("/topup")
        ? "topup"
        : pathname.startsWith("/joki")
          ? "joki"
          : pathname.startsWith("/cek-order")
            ? "orders"
            : pathname.startsWith("/voucher")
              ? "voucher"
              : active;

  if (mobile) {
    return (
      <>
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = routeActive === item.id;
          return (
            <Link
              key={item.id}
              to={item.to}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition ${
                isActive ? "text-[#ffd84d]" : "text-white/60 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#ffd84d]" : "text-white/60"}`} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <nav
      aria-label="Navigasi layanan"
      className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="mx-auto flex min-w-max items-center justify-center gap-1 sm:gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = routeActive === item.id;
        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-black transition sm:h-10 sm:gap-2 sm:px-4 sm:text-sm ${
              isActive
                ? "bg-[#ffd84d] text-[#17191d] shadow-[0_8px_20px_-12px_rgba(169,123,0,.75)]"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={2.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      </div>
    </nav>
  );
}
