import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  BadgePercent,
  Bell,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, LogoutConfirmDialog } from "@/components/bs/PublicLayout";
import { NativeSelect, ToneBadge, useHydrated, useSession } from "@/components/bs/ui";
import {
  TRANSITIONS,
  assignJokier,
  changeOrderStatus,
  deleteCoupon,
  logout,
  setRefundStatus,
  setTicketStatus,
  simulatePayment,
  updateSettings,
  upsertCoupon,
  upsertGame,
  upsertJokier,
  upsertService,
} from "@/lib/actions";
import {
  ORDER_STATUS_META,
  PAYMENT_STATUS_META,
  REFUND_STATUS_META,
  TICKET_STATUS_META,
  fmtDate,
  fmtDateTime,
  rupiah,
  uid,
} from "@/lib/format";
import { useDB } from "@/lib/store";
import type {
  Coupon,
  OrderStatus,
  RefundStatus,
  StoreSettings,
  TicketStatus,
} from "@/lib/types";

export const Route = createFileRoute("/botakstore-admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — BotakStore" },
      { name: "description", content: "Pusat pengelolaan operasional BotakStore." },
    ],
  }),
  component: AdminDashboard,
});

type AdminView =
  | "overview"
  | "orders"
  | "catalog"
  | "customers"
  | "jokiers"
  | "tickets"
  | "refunds"
  | "coupons"
  | "settings";

const NAVIGATION = [
  { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
  { id: "orders", label: "Pesanan", icon: ClipboardList },
  { id: "catalog", label: "Katalog", icon: Boxes },
  { id: "customers", label: "Pelanggan", icon: Users },
  { id: "jokiers", label: "Penjoki", icon: UserCog },
  { id: "tickets", label: "Tiket bantuan", icon: Headphones },
  { id: "refunds", label: "Refund", icon: WalletCards },
  { id: "coupons", label: "Voucher", icon: BadgePercent },
  { id: "settings", label: "Pengaturan", icon: Settings },
] as const;

function AdminDashboard() {
  const db = useDB();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { session, user } = useSession();
  const [view, setView] = useState<AdminView>("overview");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (hydrated && session?.role !== "admin") {
      navigate({ to: "/botakstore-admin/login", replace: true });
    }
  }, [hydrated, navigate, session]);

  if (!hydrated || session?.role !== "admin" || !user) {
    return <div className="min-h-screen bg-[#f3f5f8]" />;
  }

  const openView = (nextView: AdminView) => {
    setView(nextView);
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#0a0f18] text-white lg:flex">
        <div className="flex h-20 items-center border-b border-white/[.08] px-5">
          <Logo animated={false} />
        </div>
        <div className="px-4 pb-2 pt-5">
          <p className="px-3 text-[10px] font-black uppercase tracking-[.22em] text-white/35">Admin workspace</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openView(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                view === item.id
                  ? "bg-[#ffd84d] text-[#101419] shadow-[0_10px_24px_-14px_rgba(255,216,77,.8)]"
                  : "text-white/60 hover:bg-white/[.06] hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.id === "tickets" && db.tickets.filter((ticket) => ticket.status === "open").length > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                  {db.tickets.filter((ticket) => ticket.status === "open").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/[.08] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[.04] p-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#ffd84d] text-sm font-black text-[#101419]">A</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{user.name}</p>
              <p className="truncate text-[10px] text-white/40">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e3e7ed] bg-white/95 px-3 backdrop-blur sm:px-5 lg:ml-64 lg:h-20 lg:px-8">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenu(true)}
            aria-label="Buka menu admin"
            className="grid h-9 w-9 place-items-center rounded-lg border border-[#e3e7ed] bg-white lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#a17b00]">BotakStore Admin</p>
            <h1 className="text-base font-black sm:text-lg">{NAVIGATION.find((item) => item.id === view)?.label}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-[#e6e9ee] bg-[#f8f9fb] px-3 py-2 text-xs font-bold text-[#687180] sm:flex">
            <Bell className="h-4 w-4 text-[#b58b00]" />
            {db.notifications.filter((item) => item.userId === "u-admin" && !item.read).length} notifikasi
          </span>
          <Link
            to="/"
            target="_blank"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#e3e7ed] bg-white px-3 text-xs font-bold hover:bg-[#fff9e5]"
          >
            <Store className="h-4 w-4" /> <span className="hidden sm:inline">Lihat toko</span>
          </Link>
        </div>
      </header>

      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-black/55" onClick={() => setMobileMenu(false)} />
          <aside className="relative flex h-full w-[82%] max-w-xs flex-col bg-[#0a0f18] p-3 text-white shadow-2xl">
            <div className="flex h-14 items-center justify-between px-2">
              <Logo animated={false} />
              <button type="button" onClick={() => setMobileMenu(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
              {NAVIGATION.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                    view === item.id ? "bg-[#ffd84d] text-[#101419]" : "text-white/65"
                  }`}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </button>
              ))}
            </nav>
            <button type="button" onClick={() => setLogoutOpen(true)} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-bold text-red-300">
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </aside>
        </div>
      )}

      <main className="p-3 sm:p-5 lg:ml-64 lg:p-8">
        <div className="mx-auto max-w-[1500px]">
          {view === "overview" && <OverviewPanel onOpen={openView} />}
          {view === "orders" && <OrdersPanel />}
          {view === "catalog" && <CatalogPanel />}
          {view === "customers" && <CustomersPanel />}
          {view === "jokiers" && <JokiersPanel />}
          {view === "tickets" && <TicketsPanel />}
          {view === "refunds" && <RefundsPanel />}
          {view === "coupons" && <CouponsPanel />}
          {view === "settings" && <SettingsPanel />}
        </div>
      </main>

      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          logout();
          navigate({ to: "/botakstore-admin/login" });
        }}
      />
    </div>
  );
}

function OverviewPanel({ onOpen }: { onOpen: (view: AdminView) => void }) {
  const db = useDB();
  const paidRevenue = db.orders
    .filter((order) => ["paid", "partially_refunded"].includes(order.paymentStatus))
    .reduce((sum, order) => sum + order.price.total, 0);
  const activeOrders = db.orders.filter((order) => !["completed", "cancelled"].includes(order.status)).length;
  const completedOrders = db.orders.filter((order) => order.status === "completed").length;
  const customerCount = db.users.filter((user) => user.role === "customer").length;
  const maxStatus = Math.max(
    1,
    ...Object.keys(ORDER_STATUS_META).map(
      (status) => db.orders.filter((order) => order.status === status).length,
    ),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="overflow-hidden rounded-2xl bg-[#111722] p-5 text-white shadow-[0_20px_45px_-30px_rgba(15,23,42,.7)] sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#ffd84d]">Operational control</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Semua aktivitas toko dalam satu layar.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Pantau transaksi, proses pesanan, kinerja penjoki, tiket pelanggan, dan performa promo.
            </p>
          </div>
          <Button onClick={() => onOpen("orders")} className="bg-[#ffd84d] font-black text-[#101419] hover:bg-[#ffca24]">
            Kelola pesanan
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Pendapatan" value={rupiah(paidRevenue)} hint="Transaksi lunas" icon={<CircleDollarSign />} tone="gold" />
        <MetricCard label="Pesanan aktif" value={activeOrders} hint={`${completedOrders} selesai`} icon={<PackageCheck />} tone="blue" />
        <MetricCard label="Pelanggan" value={customerCount} hint={`${db.users.length} total akun`} icon={<Users />} tone="violet" />
        <MetricCard label="Perlu ditangani" value={db.tickets.filter((ticket) => ticket.status === "open").length + db.refunds.filter((refund) => refund.status === "requested").length} hint="Tiket & refund" icon={<Headphones />} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <AdminCard title="Pesanan terbaru" action={<button type="button" onClick={() => onOpen("orders")} className="text-xs font-black text-[#987400]">Lihat semua</button>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-[#edf0f3] text-[10px] uppercase tracking-wider text-[#8a93a0]">
                <tr><th className="pb-3">Pesanan</th><th className="pb-3">Pelanggan</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-[#edf0f3]">
                {db.orders.slice(0, 6).map((order) => (
                  <tr key={order.id}>
                    <td className="py-3"><p className="font-black">{order.id}</p><p className="text-xs text-[#8a93a0]">{order.detail.serviceName}</p></td>
                    <td className="py-3"><p className="font-bold">{order.customerName}</p><p className="text-xs text-[#8a93a0]">{fmtDateTime(order.createdAt)}</p></td>
                    <td className="py-3"><ToneBadge tone={ORDER_STATUS_META[order.status].tone}>{ORDER_STATUS_META[order.status].label}</ToneBadge></td>
                    <td className="py-3 text-right font-black">{rupiah(order.price.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard title="Sebaran status pesanan">
          <div className="space-y-3.5">
            {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((status) => {
              const count = db.orders.filter((order) => order.status === status).length;
              return (
                <div key={status}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-[#5d6673]">{ORDER_STATUS_META[status].label}</span>
                    <span className="font-black">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#edf0f3]">
                    <div className="h-full rounded-full bg-[#ffd84d]" style={{ width: `${(count / maxStatus) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function OrdersPanel() {
  const db = useDB();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const orders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return db.orders.filter(
      (order) =>
        (status === "all" || order.status === status) &&
        (!query ||
          order.id.toLowerCase().includes(query) ||
          order.customerName.toLowerCase().includes(query) ||
          order.detail.serviceName.toLowerCase().includes(query)),
    );
  }, [db.orders, search, status]);

  const changeStatus = (orderId: string, current: OrderStatus, next: OrderStatus) => {
    if (current === "waiting_payment" && next === "waiting_assignment") {
      simulatePayment(orderId, "paid");
      return;
    }
    changeOrderStatus(orderId, next, { by: "admin" });
  };

  return (
    <AdminCard title="Manajemen pesanan" subtitle="Pantau pembayaran, penugasan, dan progres seluruh transaksi.">
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
        <SearchField value={search} onChange={setSearch} placeholder="Cari invoice, pelanggan, atau layanan..." />
        <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as "all" | OrderStatus)} className="h-10 border-[#dfe4ea] bg-white">
          <option value="all">Semua status</option>
          {(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((item) => <option key={item} value={item}>{ORDER_STATUS_META[item].label}</option>)}
        </NativeSelect>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e6e9ee]">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-[#f7f8fa] text-[10px] uppercase tracking-wider text-[#7c8592]">
            <tr><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Penjoki</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Aksi</th></tr>
          </thead>
          <tbody className="divide-y divide-[#e9ecf0] bg-white">
            {orders.map((order) => {
              const assigned = db.jokiers.find((jokier) => jokier.id === order.jokierId);
              return (
                <tr key={order.id} className="align-top hover:bg-[#fffdf5]">
                  <td className="px-4 py-3"><p className="font-black">{order.id}</p><p className="mt-1 text-xs text-[#89919d]">{fmtDateTime(order.createdAt)}</p></td>
                  <td className="px-4 py-3"><p className="font-bold">{order.customerName}</p><p className="mt-1 text-xs text-[#89919d]">{order.customerPhone}</p></td>
                  <td className="px-4 py-3"><p className="max-w-[180px] font-bold">{order.detail.serviceName}</p><p className="mt-1 text-xs text-[#89919d]">{order.detail.gameName}</p></td>
                  <td className="px-4 py-3"><ToneBadge tone={PAYMENT_STATUS_META[order.paymentStatus].tone}>{PAYMENT_STATUS_META[order.paymentStatus].label}</ToneBadge></td>
                  <td className="px-4 py-3"><ToneBadge tone={ORDER_STATUS_META[order.status].tone}>{ORDER_STATUS_META[order.status].label}</ToneBadge><p className="mt-2 text-xs font-bold text-[#687180]">Progres {order.progress}%</p></td>
                  <td className="px-4 py-3">
                    {order.status === "waiting_assignment" ? (
                      <NativeSelect
                        defaultValue=""
                        onChange={(event) => event.target.value && assignJokier(order.id, event.target.value)}
                        className="h-9 min-w-40 bg-white text-xs"
                      >
                        <option value="">Pilih penjoki</option>
                        {db.jokiers.filter((jokier) => jokier.status !== "offline").map((jokier) => <option key={jokier.id} value={jokier.id}>{jokier.name}</option>)}
                      </NativeSelect>
                    ) : (
                      <span className="text-xs font-bold text-[#5f6875]">{assigned?.name ?? "Belum ditugaskan"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-black">{rupiah(order.price.total)}</td>
                  <td className="px-4 py-3">
                    {TRANSITIONS[order.status].length > 0 ? (
                      <NativeSelect
                        key={`${order.id}-${order.status}`}
                        defaultValue=""
                        onChange={(event) => {
                          const next = event.target.value as OrderStatus;
                          if (next) changeStatus(order.id, order.status, next);
                        }}
                        className="h-9 min-w-44 bg-white text-xs font-bold"
                      >
                        <option value="">Ubah status</option>
                        {TRANSITIONS[order.status].map((next) => <option key={next} value={next}>{ORDER_STATUS_META[next].label}</option>)}
                      </NativeSelect>
                    ) : <span className="text-xs text-[#9aa2ad]">Tidak ada aksi</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[#89919d]">Menampilkan {orders.length} dari {db.orders.length} pesanan.</p>
    </AdminCard>
  );
}

function CatalogPanel() {
  const db = useDB();
  const [search, setSearch] = useState("");
  const services = db.services.filter((service) => {
    const game = db.games.find((item) => item.id === service.gameId);
    const query = search.toLowerCase();
    return !query || service.name.toLowerCase().includes(query) || game?.name.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <AdminCard title="Game" subtitle="Atur game yang tampil di katalog pelanggan.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {db.games.map((game) => (
            <article key={game.id} className="rounded-xl border border-[#e5e8ed] bg-[#fafbfc] p-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-xs font-black text-white" style={{ background: `hsl(${game.hue} 55% 42%)` }}>{game.short}</span>
              <h3 className="mt-3 truncate text-sm font-black">{game.name}</h3>
              <p className="mt-1 text-[10px] text-[#8a93a0]">{db.services.filter((service) => service.gameId === game.id).length} layanan</p>
              <button
                type="button"
                onClick={() => upsertGame({ ...game, status: game.status === "active" ? "inactive" : "active" })}
                className={`mt-3 w-full rounded-lg px-2 py-2 text-[10px] font-black ${game.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
              >
                {game.status === "active" ? "Aktif" : "Nonaktif"}
              </button>
            </article>
          ))}
        </div>
      </AdminCard>

      <AdminCard title="Layanan" subtitle="Kelola ketersediaan layanan joki dan top up.">
        <SearchField value={search} onChange={setSearch} placeholder="Cari layanan atau game..." className="mb-4 max-w-xl" />
        <div className="overflow-x-auto rounded-xl border border-[#e6e9ee]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#f7f8fa] text-[10px] uppercase tracking-wider text-[#7c8592]"><tr><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Game</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Harga dasar</th><th className="px-4 py-3">Terjual</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-[#e9ecf0] bg-white">
              {services.map((service) => {
                const game = db.games.find((item) => item.id === service.gameId);
                const basePrice = service.pricing.pricePerStar ?? service.pricing.flatPrice ?? service.pricing.tiers?.[0]?.stepPrice ?? 0;
                return (
                  <tr key={service.id}>
                    <td className="px-4 py-3"><p className="font-black">{service.name}</p><p className="mt-1 max-w-sm truncate text-xs text-[#89919d]">{service.description}</p></td>
                    <td className="px-4 py-3 font-bold">{game?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-xs font-bold uppercase text-[#687180]">{service.type.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3 font-black">{rupiah(basePrice)}</td>
                    <td className="px-4 py-3 font-bold">{service.sold}</td>
                    <td className="px-4 py-3"><button type="button" onClick={() => upsertService({ ...service, status: service.status === "active" ? "inactive" : "active" })} className={`rounded-full px-3 py-1.5 text-[10px] font-black ${service.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{service.status === "active" ? "Aktif" : "Nonaktif"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}

function CustomersPanel() {
  const db = useDB();
  const [search, setSearch] = useState("");
  const customers = db.users.filter((user) => user.role === "customer" && (!search || `${user.name} ${user.email} ${user.phone}`.toLowerCase().includes(search.toLowerCase())));
  return (
    <AdminCard title="Data pelanggan" subtitle="Akun pelanggan dan ringkasan aktivitas transaksinya.">
      <SearchField value={search} onChange={setSearch} placeholder="Cari nama, email, atau WhatsApp..." className="mb-4 max-w-xl" />
      <div className="overflow-x-auto rounded-xl border border-[#e6e9ee]">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-[#f7f8fa] text-[10px] uppercase tracking-wider text-[#7c8592]"><tr><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Total belanja</th><th className="px-4 py-3">Terdaftar</th></tr></thead>
          <tbody className="divide-y divide-[#e9ecf0] bg-white">
            {customers.map((customer) => {
              const orders = db.orders.filter((order) => order.customerId === customer.id);
              return <tr key={customer.id}><td className="px-4 py-3"><p className="font-black">{customer.name}</p><p className="mt-1 text-xs text-[#89919d]">{customer.email}</p></td><td className="px-4 py-3 font-bold">{customer.phone}</td><td className="px-4 py-3 font-black">{orders.length}</td><td className="px-4 py-3 font-black">{rupiah(orders.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.price.total, 0))}</td><td className="px-4 py-3 text-xs text-[#687180]">{fmtDate(customer.createdAt)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

function JokiersPanel() {
  const db = useDB();
  return (
    <AdminCard title="Manajemen penjoki" subtitle="Pantau kapasitas, status kerja, dan performa tim.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {db.jokiers.map((jokier) => {
          const active = db.orders.filter((order) => order.jokierId === jokier.id && !["completed", "cancelled"].includes(order.status)).length;
          const user = db.users.find((item) => item.id === jokier.userId);
          return (
            <article key={jokier.id} className="rounded-2xl border border-[#e5e8ed] bg-[#fafbfc] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#111722] text-sm font-black text-[#ffd84d]">{jokier.name.charAt(0)}</span><div className="min-w-0"><h3 className="truncate font-black">{jokier.name}</h3><p className="truncate text-xs text-[#89919d]">{user?.email}</p></div></div>
                <ToneBadge tone={jokier.status === "available" ? "success" : jokier.status === "busy" ? "warning" : "neutral"}>{jokier.status}</ToneBadge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center"><MiniMetric label="Aktif" value={active} /><MiniMetric label="Selesai" value={jokier.completed} /><MiniMetric label="Rating" value={jokier.rating.toFixed(1)} /></div>
              <div className="mt-4 grid grid-cols-[1fr_100px] gap-2">
                <NativeSelect value={jokier.status} onChange={(event) => upsertJokier({ ...jokier, status: event.target.value as typeof jokier.status })} className="h-9 bg-white text-xs font-bold"><option value="available">Tersedia</option><option value="busy">Sibuk</option><option value="offline">Offline</option></NativeSelect>
                <Input type="number" min={1} value={jokier.capacity} onChange={(event) => upsertJokier({ ...jokier, capacity: Math.max(1, Number(event.target.value) || 1) })} className="h-9 bg-white text-xs" aria-label={`Kapasitas ${jokier.name}`} />
              </div>
              <p className="mt-2 text-[10px] text-[#89919d]">Kapasitas maksimum pekerjaan aktif.</p>
            </article>
          );
        })}
      </div>
    </AdminCard>
  );
}

function TicketsPanel() {
  const db = useDB();
  return (
    <AdminCard title="Tiket bantuan" subtitle="Kelola pertanyaan dan komplain pelanggan.">
      <div className="grid gap-3 xl:grid-cols-2">
        {db.tickets.map((ticket) => {
          const customer = db.users.find((user) => user.id === ticket.customerId);
          const lastMessage = ticket.messages.at(-1);
          return (
            <article key={ticket.id} className="rounded-2xl border border-[#e5e8ed] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-[#a17b00]">{ticket.id} · {ticket.category}</p><h3 className="mt-1 font-black">{ticket.subject}</h3></div><ToneBadge tone={TICKET_STATUS_META[ticket.status].tone}>{TICKET_STATUS_META[ticket.status].label}</ToneBadge></div>
              <p className="mt-3 line-clamp-2 rounded-xl bg-[#f7f8fa] px-3 py-2 text-xs leading-5 text-[#66707d]">{lastMessage?.text ?? "Belum ada pesan."}</p>
              <div className="mt-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold">{customer?.name ?? "Pelanggan"}</p><p className="text-[10px] text-[#89919d]">{fmtDateTime(ticket.createdAt)}</p></div><NativeSelect value={ticket.status} onChange={(event) => setTicketStatus(ticket.id, event.target.value as TicketStatus)} className="h-9 w-44 bg-white text-xs font-bold">{(Object.keys(TICKET_STATUS_META) as TicketStatus[]).map((status) => <option key={status} value={status}>{TICKET_STATUS_META[status].label}</option>)}</NativeSelect></div>
            </article>
          );
        })}
      </div>
    </AdminCard>
  );
}

function RefundsPanel() {
  const db = useDB();
  return (
    <AdminCard title="Pengajuan refund" subtitle="Tinjau nominal, alasan, dan status pengembalian dana.">
      <div className="overflow-x-auto rounded-xl border border-[#e6e9ee]">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[#f7f8fa] text-[10px] uppercase tracking-wider text-[#7c8592]"><tr><th className="px-4 py-3">Refund</th><th className="px-4 py-3">Pesanan</th><th className="px-4 py-3">Pelanggan</th><th className="px-4 py-3">Alasan</th><th className="px-4 py-3">Nominal</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-[#e9ecf0] bg-white">
            {db.refunds.map((refund) => {
              const order = db.orders.find((item) => item.id === refund.orderId);
              const customer = db.users.find((item) => item.id === refund.customerId);
              return <tr key={refund.id}><td className="px-4 py-3"><p className="font-black">{refund.id}</p><p className="mt-1 text-xs text-[#89919d]">{fmtDate(refund.createdAt)}</p></td><td className="px-4 py-3 font-bold">{order?.id}</td><td className="px-4 py-3"><p className="font-bold">{customer?.name}</p><p className="text-xs text-[#89919d]">{customer?.email}</p></td><td className="max-w-xs px-4 py-3 text-xs leading-5 text-[#687180]">{refund.reason}</td><td className="px-4 py-3 font-black">{rupiah(refund.amount)}</td><td className="px-4 py-3"><NativeSelect value={refund.status} onChange={(event) => setRefundStatus(refund.id, event.target.value as RefundStatus)} className="h-9 min-w-40 bg-white text-xs font-bold">{(Object.keys(REFUND_STATUS_META) as RefundStatus[]).map((status) => <option key={status} value={status}>{REFUND_STATUS_META[status].label}</option>)}</NativeSelect></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </AdminCard>
  );
}

function CouponsPanel() {
  const db = useDB();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", type: "percent" as Coupon["type"], value: 10, minOrder: 0, quota: 100, expiresAt: "2026-12-31" });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = upsertCoupon({ id: uid("c"), code: form.code.trim().toUpperCase(), type: form.type, value: form.value, minOrder: form.minOrder, quota: form.quota, used: 0, active: true, expiresAt: new Date(`${form.expiresAt}T16:59:00.000Z`).toISOString() });
    if (!result.ok) { setError(result.error); return; }
    setError("");
    setForm({ ...form, code: "" });
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <AdminCard title="Tambah voucher" subtitle="Buat kode promo baru.">
        <form onSubmit={submit} className="space-y-3">
          <AdminField label="Kode voucher"><Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="PROMO26" className="h-10 bg-white uppercase" /></AdminField>
          <div className="grid grid-cols-2 gap-2"><AdminField label="Jenis"><NativeSelect value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Coupon["type"] })} className="h-10 bg-white"><option value="percent">Persen</option><option value="fixed">Nominal</option></NativeSelect></AdminField><AdminField label="Nilai"><Input type="number" min={1} value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })} className="h-10 bg-white" /></AdminField></div>
          <AdminField label="Minimal transaksi"><Input type="number" min={0} value={form.minOrder} onChange={(event) => setForm({ ...form, minOrder: Number(event.target.value) })} className="h-10 bg-white" /></AdminField>
          <div className="grid grid-cols-2 gap-2"><AdminField label="Kuota"><Input type="number" min={1} value={form.quota} onChange={(event) => setForm({ ...form, quota: Number(event.target.value) })} className="h-10 bg-white" /></AdminField><AdminField label="Berakhir"><Input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} className="h-10 bg-white" /></AdminField></div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
          <Button type="submit" className="w-full bg-[#ffd84d] font-black text-[#101419] hover:bg-[#ffca24]"><Plus /> Tambah voucher</Button>
        </form>
      </AdminCard>
      <AdminCard title="Daftar voucher" subtitle={`${db.coupons.filter((coupon) => coupon.active).length} voucher aktif`}>
        <div className="space-y-2.5">
          {db.coupons.map((coupon) => (
            <article key={coupon.id} className="flex flex-col gap-3 rounded-xl border border-[#e5e8ed] bg-[#fafbfc] p-3 sm:flex-row sm:items-center">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff1ae] text-[#8a6800]"><BadgePercent className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{coupon.code}</h3><ToneBadge tone={coupon.active ? "success" : "neutral"}>{coupon.active ? "Aktif" : "Nonaktif"}</ToneBadge></div><p className="mt-1 text-xs text-[#7b8491]">{coupon.type === "percent" ? `${coupon.value}%` : rupiah(coupon.value)} · Min. {rupiah(coupon.minOrder)} · Terpakai {coupon.used}/{coupon.quota}</p></div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => upsertCoupon({ ...coupon, active: !coupon.active })}>{coupon.active ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="icon" variant="outline" onClick={() => { if (window.confirm(`Hapus voucher ${coupon.code}?`)) deleteCoupon(coupon.id); }} aria-label={`Hapus ${coupon.code}`} className="h-8 w-8 text-red-600"><Trash2 /></Button></div>
            </article>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}

function SettingsPanel() {
  const db = useDB();
  const [form, setForm] = useState<StoreSettings>(db.settings);
  const [saved, setSaved] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <AdminCard title="Pengaturan toko" subtitle="Informasi ini digunakan pada storefront dan kanal bantuan.">
        <form onSubmit={submit} className="space-y-4">
          <AdminField label="Nama toko"><Input value={form.storeName} onChange={(event) => setForm({ ...form, storeName: event.target.value })} className="h-11 bg-white" /></AdminField>
          <AdminField label="Nomor WhatsApp"><Input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value.replace(/\D/g, "") })} className="h-11 bg-white" /></AdminField>
          <AdminField label="Pengumuman"><textarea value={form.announcement} onChange={(event) => setForm({ ...form, announcement: event.target.value })} rows={4} className="w-full rounded-xl border border-[#dfe4ea] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ffd84d]" /></AdminField>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-[#e4e8ed] bg-[#fafbfc] p-4"><span><span className="block text-sm font-black">Mode pemeliharaan</span><span className="mt-1 block text-xs text-[#7f8895]">Hentikan sementara transaksi baru di storefront.</span></span><button type="button" onClick={() => setForm({ ...form, maintenance: !form.maintenance })} className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.maintenance ? "bg-[#ffd84d]" : "bg-[#cdd3da]"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${form.maintenance ? "left-6" : "left-1"}`} /></button></label>
          <Button type="submit" className="bg-[#111722] font-black text-white hover:bg-[#232b39]">{saved ? <><RefreshCw /> Tersimpan</> : <><ShieldCheck /> Simpan pengaturan</>}</Button>
        </form>
      </AdminCard>
      <AdminCard title="Audit data frontend" subtitle="Pemetaan kesiapan integrasi backend.">
        <div className="space-y-3 text-sm">
          {[
            { label: "Pesanan, akun & pembayaran", ready: true },
            { label: "Katalog joki, penjoki & voucher", ready: true },
            { label: "Tiket, refund & pengaturan toko", ready: true },
            { label: "Produk, harga & metode top up", ready: false },
            { label: "Banner, FAQ & kebijakan", ready: false },
          ].map((item) => <div key={item.label} className="flex items-center gap-2.5 rounded-lg bg-[#f7f8fa] px-3 py-2.5 font-bold text-[#596372]"><PackageCheck className={`h-4 w-4 ${item.ready ? "text-emerald-600" : "text-amber-500"}`} /><span className="min-w-0 flex-1">{item.label}</span><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${item.ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.ready ? "Prototype" : "Migrasi"}</span></div>)}
        </div>
      </AdminCard>
    </div>
  );
}

function MetricCard({ label, value, hint, icon, tone }: { label: string; value: ReactNode; hint: string; icon: ReactNode; tone: "gold" | "blue" | "violet" | "red" }) {
  const tones = { gold: "bg-[#fff4bf] text-[#8a6800]", blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", red: "bg-red-50 text-red-600" };
  return <article className="rounded-2xl border border-[#e5e8ed] bg-white p-3.5 shadow-[0_12px_30px_-26px_rgba(15,23,42,.45)] sm:p-5"><div className={`grid h-9 w-9 place-items-center rounded-xl sm:h-10 sm:w-10 [&>svg]:h-4 [&>svg]:w-4 ${tones[tone]}`}>{icon}</div><p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#8a93a0] sm:text-xs">{label}</p><p className="mt-1 truncate text-lg font-black sm:text-2xl">{value}</p><p className="mt-1 text-[10px] text-[#8a93a0] sm:text-xs">{hint}</p></article>;
}

function MiniMetric({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-white px-2 py-2.5"><p className="text-base font-black">{value}</p><p className="text-[9px] font-bold uppercase tracking-wider text-[#9199a4]">{label}</p></div>;
}

function AdminCard({ title, subtitle, action, children, className = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#e4e8ed] bg-white p-3.5 shadow-[0_18px_45px_-38px_rgba(15,23,42,.55)] sm:p-5 ${className}`}><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-black sm:text-lg">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-[#7f8895]">{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function SearchField({ value, onChange, placeholder, className = "" }: { value: string; onChange: (value: string) => void; placeholder: string; className?: string }) {
  return <label className={`relative block ${className}`}><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949f]" /><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 border-[#dfe4ea] bg-white pl-9" /></label>;
}

function AdminField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black text-[#4d5663]">{label}</span>{children}</label>;
}
