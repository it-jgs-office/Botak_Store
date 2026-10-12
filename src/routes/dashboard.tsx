import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { ArrowRight, Gamepad2, LogOut, PackageCheck, ReceiptText, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { OrderStatusBadge, useHydrated, useSession } from "@/components/bs/ui";
import { logout } from "@/lib/actions";
import { fmtDateTime, rupiah } from "@/lib/format";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Akun — BotakStore" },
      { name: "description", content: "Lihat ringkasan dan progres pesanan BotakStore." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const db = useDB();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { session, user } = useSession();
  const orders = useMemo(
    () => (session ? db.orders.filter((order) => order.customerId === session.userId) : []),
    [db.orders, session],
  );
  const activeOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  ).length;

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/login", replace: true });
  }, [hydrated, navigate, session]);

  if (!hydrated || !session || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <PublicLayout>
      <section className="border-b border-[#e8e4d8] bg-gradient-to-br from-[#fff9e4] via-white to-[#f7f8fa]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:py-14">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a7600]">
                Dashboard akun
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">Halo, {user.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pantau pesanan joki Mobile Legends kamu dari sini.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
            >
              <LogOut /> Keluar
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <DashboardStat
            icon={<ReceiptText />}
            label="Total pesanan"
            value={String(orders.length)}
          />
          <DashboardStat icon={<Gamepad2 />} label="Sedang diproses" value={String(activeOrders)} />
          <DashboardStat
            icon={<PackageCheck />}
            label="Pesanan selesai"
            value={String(orders.filter((order) => order.status === "completed").length)}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Pesanan saya</h2>
                <p className="mt-1 text-sm text-muted-foreground">Riwayat pesanan terbaru.</p>
              </div>
              <Button asChild size="sm" className="text-[#17191d]">
                <Link to="/joki">
                  Pesan lagi <ArrowRight />
                </Link>
              </Button>
            </div>

            {orders.length ? (
              <div className="mt-5 divide-y divide-border">
                {orders.slice(0, 6).map((order) => (
                  <article
                    key={order.id}
                    className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-bold">{order.detail.serviceName}</p>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.id} · {fmtDateTime(order.createdAt)}
                      </p>
                      {order.detail.fromRank && (
                        <p className="mt-2 text-sm text-[#505862]">
                          {order.detail.fromRank} {order.detail.fromStars ?? 0}★ →{" "}
                          {order.detail.toRank} {order.detail.toStars ?? 0}★
                        </p>
                      )}
                    </div>
                    <div className="sm:text-right">
                      <p className="font-black">{rupiah(order.price.total)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Progres {order.progress}%
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#dfe3e7] bg-[#fafbfc] px-5 py-12 text-center">
                <Gamepad2 className="mx-auto h-9 w-9 text-[#c39a12]" />
                <p className="mt-3 font-bold">Belum ada pesanan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pilih paket joki untuk membuat pesanan pertamamu.
                </p>
                <Button asChild className="mt-5 text-[#17191d]">
                  <Link to="/joki">Lihat paket joki</Link>
                </Button>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-border bg-white p-5 shadow-card sm:p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff2b8] text-[#8a6900]">
              <UserRound className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-lg font-black">Informasi akun</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">Nama</dt>
                <dd className="mt-1 font-bold">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">Email</dt>
                <dd className="mt-1 break-all font-bold">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-muted-foreground">WhatsApp</dt>
                <dd className="mt-1 font-bold">{user.phone}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </PublicLayout>
  );
}

function DashboardStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-card">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff4c5] text-[#8b6900] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
