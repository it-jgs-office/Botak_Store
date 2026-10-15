import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Gamepad2,
  History,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  TicketPercent,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { LogoutConfirmDialog, PublicLayout } from "@/components/bs/PublicLayout";
import { Field, useHydrated, useSession } from "@/components/bs/ui";
import { changePassword, deleteAccount, logout, restoreSession, updateProfile } from "@/lib/actions";
import { getProfileExtras, saveProfileExtras, type ProfileExtras } from "@/lib/profile-extras";
import { useDB } from "@/lib/store";
import { rupiah } from "@/lib/format";
import type { Order } from "@/lib/types";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil Saya — BotakStore" },
      { name: "description", content: "Lihat dan kelola profil akun BotakStore kamu." },
      ...routeSeo("/profil", "Profil Saya — BotakStore", "Lihat dan kelola profil akun BotakStore kamu."),
    ],
  }),
  component: ProfilPage,
});

type TxGroup = "semua" | "menunggu" | "diproses" | "berhasil" | "gagal";
type ProfileSection = "voucher" | "riwayat" | "pengaturan";

function profileExtrasSignature(extras: ProfileExtras) {
  return [
    extras.gameNickname ?? "",
    extras.gameUserId ?? "",
    extras.gameServerId ?? "",
    extras.notifOrder,
    extras.notifPromo,
  ].join("|");
}

function txGroup(order: Order): Exclude<TxGroup, "semua"> {
  if (order.status === "completed") return "berhasil";
  if (order.status === "cancelled" || order.paymentStatus === "failed" || order.paymentStatus === "expired")
    return "gagal";
  if (order.status === "waiting_payment") return "menunggu";
  return "diproses";
}

const TX_TABS: { id: TxGroup; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "menunggu", label: "Menunggu Bayar" },
  { id: "diproses", label: "Diproses" },
  { id: "berhasil", label: "Berhasil" },
  { id: "gagal", label: "Gagal & Expired" },
];

const TX_BADGE: Record<Exclude<TxGroup, "semua">, { label: string; className: string }> = {
  menunggu: { label: "Menunggu bayar", className: "bg-amber-100 text-amber-800" },
  diproses: { label: "Diproses", className: "bg-blue-100 text-blue-800" },
  berhasil: { label: "Berhasil", className: "bg-emerald-100 text-emerald-800" },
  gagal: { label: "Gagal / Expired", className: "bg-red-100 text-red-700" },
};

function ProfilPage() {
  const db = useDB();
  const navigate = useNavigate();
  const hydrated = useHydrated();
  const { session, user } = useSession();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [visiblePassword, setVisiblePassword] = useState<"current" | "next" | "confirm" | null>(null);
  const [tab, setTab] = useState<TxGroup>("semua");
  const [activeSection, setActiveSection] = useState<ProfileSection>("riwayat");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileExtras, setProfileExtras] = useState<ProfileExtras>({
    avatar: null,
    gameNickname: "",
    gameUserId: "",
    gameServerId: "",
    notifOrder: true,
    notifPromo: true,
  });
  const [savedProfileExtras, setSavedProfileExtras] = useState<ProfileExtras>({
    avatar: null,
    gameNickname: "",
    gameUserId: "",
    gameServerId: "",
    notifOrder: true,
    notifPromo: true,
  });
  const [savingExtras, setSavingExtras] = useState(false);

  useEffect(() => {
    if (hydrated && !session) navigate({ to: "/login", replace: true });
  }, [hydrated, navigate, session]);

  useEffect(() => {
    if (!hydrated || session?.role !== "customer") return;

    let active = true;
    void restoreSession();
    void getProfileExtras()
      .then((extras) => {
        if (active) {
          setProfileExtras(extras);
          setSavedProfileExtras(extras);
        }
      })
      .catch(() => {
        if (active) toast.error("Data preferensi profil belum dapat dimuat.");
      });

    return () => {
      active = false;
    };
  }, [hydrated, session?.role, session?.userId]);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone ?? "" });
    }
  }, [user]);

  const orders = useMemo(
    () =>
      session
        ? [...db.orders]
            .filter((order) => order.customerId === session.userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [db.orders, session],
  );

  if (!hydrated || !session || !user) {
    return <div className="min-h-screen bg-background" />;
  }

  const activeOrders = orders.filter(
    (o) =>
      txGroup(o) === "diproses" &&
      o.detail.serviceName.toLocaleLowerCase("id-ID").startsWith("joki "),
  );
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.price.total, 0);
  const filteredOrders = tab === "semua" ? orders : orders.filter((o) => txGroup(o) === tab);
  const counts = TX_TABS.map((t) => ({
    ...t,
    count: t.id === "semua" ? orders.length : orders.filter((o) => txGroup(o) === t.id).length,
  }));
  const vouchers = db.coupons.filter(
    (coupon) => coupon.active && coupon.used < coupon.quota && new Date(coupon.expiresAt).getTime() > Date.now(),
  );
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;
  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const cleanPhone = form.phone.replace(/[\s-]/g, "");
  const phoneValid = !cleanPhone || /^(?:08\d{8,11}|628\d{8,11})$/.test(cleanPhone);
  const formattedPhone = cleanPhone.startsWith("08")
    ? `+62 ${cleanPhone.slice(1, 4)}-${cleanPhone.slice(4, 8)}-${cleanPhone.slice(8)}`
    : cleanPhone.startsWith("62")
      ? `+62 ${cleanPhone.slice(2, 5)}-${cleanPhone.slice(5, 9)}-${cleanPhone.slice(9)}`
      : cleanPhone;
  const profileChanged = form.name.trim() !== user.name || cleanPhone !== (user.phone ?? "");
  const passwordStrength = [
    passwords.next.length >= 8,
    /[a-z]/.test(passwords.next) && /[A-Z]/.test(passwords.next),
    /\d/.test(passwords.next),
    /[^A-Za-z0-9]/.test(passwords.next),
  ].filter(Boolean).length;
  const extrasChanged = profileExtrasSignature(profileExtras) !== profileExtrasSignature(savedProfileExtras);

  const save = async () => {
    if (form.name.trim().length < 3) {
      toast.error("Nama minimal 3 karakter.");
      return;
    }
    if (!phoneValid) {
      toast.error("Nomor WhatsApp tidak valid.");
      return;
    }
    const result = await updateProfile(user.id, { name: form.name.trim(), phone: cleanPhone });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil berhasil diperbarui.");
  };

  const savePassword = async () => {
    if (passwords.next !== passwords.confirm) {
      toast.error("Konfirmasi kata sandi baru belum sama.");
      return;
    }
    const result = await changePassword(user.id, passwords.current, passwords.next);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPasswords({ current: "", next: "", confirm: "" });
    toast.success("Kata sandi berhasil diganti.");
  };

  const saveExtras = async () => {
    setSavingExtras(true);
    try {
      const saved = await saveProfileExtras({
        gameNickname: profileExtras.gameNickname.trim(),
        gameUserId: profileExtras.gameUserId.trim(),
        gameServerId: profileExtras.gameServerId.trim(),
        notifOrder: profileExtras.notifOrder,
        notifPromo: profileExtras.notifPromo,
      });
      setProfileExtras(saved);
      setSavedProfileExtras(saved);
      toast.success("Preferensi akun berhasil disimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preferensi akun gagal disimpan.");
    } finally {
      setSavingExtras(false);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    const result = await deleteAccount(user.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDeleteOpen(false);
    toast.success("Akun berhasil dihapus.");
    navigate({ to: "/", replace: true });
  };

  const copyVoucher = (code: string) => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => toast.success(`Kode ${code} disalin.`))
      .catch(() => toast.error("Gagal menyalin kode."));
  };

  return (
    <PublicLayout banner="none" showFaq={false}>
      <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4 sm:py-8 md:py-12">
        {/* ===== Header profil ===== */}
        <section className="rounded-2xl border border-border bg-white p-4 shadow-card sm:rounded-3xl sm:p-7">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="shrink-0">
                  {profileExtras.avatar ? (
                    <img
                      src={profileExtras.avatar}
                      alt={`Foto profil ${user.name}`}
                      className="h-14 w-14 rounded-2xl object-cover shadow-md sm:h-20 sm:w-20 sm:rounded-3xl"
                    />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#151a20] text-lg font-black text-[#ffd84d] shadow-md sm:h-20 sm:w-20 sm:rounded-3xl sm:text-2xl">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Halo, {firstName}! 👋</p>
                  <h1 className="truncate text-lg font-black sm:mt-0.5 sm:text-3xl">{user.name}</h1>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full sm:h-11 sm:w-fit"
                onClick={() => setLogoutOpen(true)}
              >
                <LogOut /> Keluar
              </Button>
            </div>
            <div className="mt-4 grid min-w-0 gap-2 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2 sm:text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4c5] px-3 py-1 text-xs font-black text-[#8b6900]">
                <ShieldCheck className="h-3.5 w-3.5" /> Member
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{user.email}</span>
              </span>
              {user.phone && (
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Phone className="h-4 w-4 shrink-0" /> <span className="truncate">{formattedPhone}</span>
                </span>
              )}
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" /> Member sejak{" "}
                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
        </section>

        {/* ===== Statistik ===== */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4">
          <ProfilStat
            icon={<History />}
            label="Total transaksi"
            value={String(orders.length)}
            hint={`${orders.filter((o) => txGroup(o) === "berhasil").length} berhasil`}
          />
          <ProfilStat
            icon={<Wallet />}
            label="Total belanja"
            value={rupiah(totalSpent)}
            hint="Yuk mulai jajan diamond 💎"
          />
          <ProfilStat
            icon={<Gamepad2 />}
            label="Joki aktif"
            value={String(activeOrders.length)}
            hint={activeOrders.length ? "Sedang dikerjakan" : "Nggak ada yang jalan"}
          />
        </div>

        {/* ===== Navigasi profil ===== */}
        <nav
          aria-label="Navigasi profil"
          className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-border bg-white p-1 shadow-sm sm:mt-6 sm:rounded-2xl sm:p-1.5"
        >
          {[
            { id: "riwayat" as const, icon: <History className="h-4 w-4" />, label: "Riwayat transaksi", short: "Riwayat" },
            { id: "voucher" as const, icon: <TicketPercent className="h-4 w-4" />, label: "Voucher member", short: "Voucher" },
            { id: "pengaturan" as const, icon: <Settings className="h-4 w-4" />, label: "Pengaturan akun", short: "Akun" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "page" : undefined}
              onClick={() => setActiveSection(item.id)}
              className={`inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-bold transition sm:flex-row sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm ${
                activeSection === item.id
                  ? "bg-[#151a20] text-[#ffd84d] shadow-sm"
                  : "text-muted-foreground hover:bg-[#fff8df] hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ===== Voucher member ===== */}
        {activeSection === "voucher" && (
        <section id="voucher" className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-card sm:mt-6 sm:rounded-3xl sm:p-7">
          <SectionTitle
            icon={<TicketPercent className="h-5 w-5" />}
            title="Benefit & Voucher Member"
            subtitle="Voucher khusus member terdaftar! Salin kodenya dan gunakan saat checkout pesananmu."
          />
          {vouchers.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-[#fafbfc] px-4 py-8 text-center sm:mt-6 sm:rounded-2xl sm:px-6 sm:py-14">
              <p className="text-lg font-black">Belum ada voucher aktif saat ini</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Pantau terus event promo dan promo musiman dari BotakStore untuk mendapatkan
                voucher menarik!
              </p>
              <Button asChild className="mt-5 text-[#17191d]">
                <Link to="/">
                  <Gamepad2 /> Lihat Katalog Game
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
              {vouchers.map((v) => (
                <div
                  key={v.code}
                  className="flex min-w-0 flex-col items-stretch justify-between gap-3 rounded-xl border border-[#ecd46e] bg-[#fff8df] p-3 sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-black tracking-wide">{v.code}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Diskon {v.type === "percent" ? `${v.value}%` : rupiah(v.value)} · sisa {v.quota - v.used} kode
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyVoucher(v.code)}
                  >
                    <Copy /> Salin
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* ===== Riwayat transaksi ===== */}
        {activeSection === "riwayat" && (
        <section id="riwayat" className="mt-4 overflow-hidden rounded-2xl border border-border bg-white p-3 shadow-card sm:mt-6 sm:rounded-3xl sm:p-7">
          <SectionTitle
            icon={<History className="h-5 w-5" />}
            title="Riwayat Transaksi"
            subtitle="Klik pesanan untuk lihat detail, cara bayar, atau status terbarunya."
          />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {counts.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex min-w-0 items-center justify-between gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition last:col-span-2 sm:w-auto sm:justify-start sm:gap-2 sm:px-4 sm:text-sm sm:last:col-span-1 ${
                  tab === t.id
                    ? "border-[#17191d] bg-[#17191d] text-[#ffd84d]"
                    : "border-border bg-white hover:border-[#ecd46e] hover:bg-[#fff8df]"
                }`}
              >
                <span className="truncate">{t.label}</span>
                <span
                  className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-xs font-black ${
                    tab === t.id ? "bg-[#ffd84d] text-[#17191d]" : "bg-[#f1f3f5] text-[#5b6470]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
          {filteredOrders.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Menampilkan 1-{filteredOrders.length} dari {filteredOrders.length} transaksi
            </p>
          )}
          {filteredOrders.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-border bg-[#fafbfc] px-4 py-10 text-center text-sm text-muted-foreground">
              Belum ada transaksi pada kategori ini.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
              {filteredOrders.map((order) => {
                const group = txGroup(order);
                const badge = TX_BADGE[group];
                return (
                  <li key={order.id} className="min-w-0">
                    <a
                      href={order.id.startsWith("BS-TOPUP-") || order.id.startsWith("BS-JOKI-")
                        ? `/invoice/${encodeURIComponent(order.id)}`
                        : "/cek-order"}
                      className="flex h-full min-w-0 flex-col items-stretch gap-2 overflow-hidden rounded-xl border border-border bg-[#fafbfc] p-2.5 transition hover:border-[#ecd46e] hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:gap-4 sm:rounded-2xl sm:p-4"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#fff4c5] text-[#8b6900] sm:h-12 sm:w-12 sm:rounded-xl">
                        <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 min-h-8 break-words text-xs font-black leading-4 sm:min-h-0 sm:truncate sm:text-sm">{order.detail.serviceName}</p>
                        <p className="mt-1 truncate text-[9px] text-muted-foreground sm:mt-0.5 sm:text-xs">
                          {order.id} ·{" "}
                          {new Date(order.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <span
                          className={`mt-1.5 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[9px] font-bold sm:px-2.5 sm:text-xs ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-auto shrink-0 border-t border-border/70 pt-2 text-xs font-black sm:mt-0 sm:border-0 sm:pt-0 sm:text-sm">{rupiah(order.price.total)}</p>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Pesanan yang dibuat tanpa login nggak muncul di sini — cek lewat{" "}
            <Link to="/cek-order" className="font-bold text-[#9a7600] underline">
              Cek Pesanan
            </Link>{" "}
            pakai nomor invoice.
          </p>
        </section>
        )}

        {/* ===== Pengaturan akun ===== */}
        {activeSection === "pengaturan" && (
        <section id="pengaturan" className="mt-4 rounded-2xl border border-border bg-white p-4 shadow-card sm:mt-6 sm:rounded-3xl sm:p-7">
          <SectionTitle
            icon={<Settings className="h-5 w-5" />}
            title="Pengaturan Akun"
            subtitle="Rapikan data diri & keamanan akunmu."
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6">
            <section className="rounded-xl border border-border bg-[#fafbfc] p-4 sm:rounded-2xl sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-black">
                <UserRound className="h-5 w-5 text-[#9a7600]" /> Edit profil
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Nama ini yang muncul di navbar & menu akun kamu.
              </p>
              <div className="mt-5 space-y-4">
                <Field label="Nama *">
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Nama lengkap"
                      className="h-11 pl-10"
                    />
                  </div>
                </Field>
                <Field label="Email">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input value={user.email} disabled className="h-11 bg-muted/60 pl-10" />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Email dipakai untuk login dan belum bisa diganti.
                  </p>
                </Field>
                <Field label="Nomor WhatsApp (opsional)">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      inputMode="tel"
                      className="h-11 pl-10"
                    />
                  </div>
                  {cleanPhone && phoneValid && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Nomor valid: {formattedPhone}
                    </p>
                  )}
                </Field>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button type="button" onClick={save} disabled={!profileChanged || !phoneValid} className="text-[#17191d]">
                  <Save /> Simpan Profil
                </Button>
                <span className="text-xs text-muted-foreground">
                  {profileChanged ? "Perubahan belum disimpan" : "Belum ada perubahan"}
                </span>
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <h4 className="flex items-center gap-2 font-black">
                  <Gamepad2 className="h-4 w-4 text-[#9a7600]" /> Data akun game
                </h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Data ini tersimpan aman di profil akunmu.
                </p>
                <div className="mt-4 space-y-3">
                  <Field label="Nickname game (opsional)">
                    <Input
                      value={profileExtras.gameNickname ?? ""}
                      onChange={(event) =>
                        setProfileExtras((current) => ({ ...current, gameNickname: event.target.value }))
                      }
                      placeholder="Nama dalam game"
                      className="h-10"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="User ID">
                      <Input
                        value={profileExtras.gameUserId ?? ""}
                        onChange={(event) =>
                          setProfileExtras((current) => ({ ...current, gameUserId: event.target.value }))
                        }
                        placeholder="User ID"
                        inputMode="numeric"
                        className="h-10"
                      />
                    </Field>
                    <Field label="Server / Zone">
                      <Input
                        value={profileExtras.gameServerId ?? ""}
                        onChange={(event) =>
                          setProfileExtras((current) => ({ ...current, gameServerId: event.target.value }))
                        }
                        placeholder="Zone"
                        inputMode="numeric"
                        className="h-10"
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-[#fafbfc] p-4 sm:rounded-2xl sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-black">
                <KeyRound className="h-5 w-5 text-[#9a7600]" /> Ganti password
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pakai password yang kuat dan jangan dibagi ke siapa pun ya 😉
              </p>
              <div className="mt-5 space-y-4">
                <Field label="Password lama *">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input
                      type={visiblePassword === "current" ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Password lama"
                      className="h-11 px-10"
                    />
                    <button type="button" aria-label="Tampilkan password lama" onClick={() => setVisiblePassword((value) => value === "current" ? null : "current")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777083]">
                      {visiblePassword === "current" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Password baru *">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input
                      type={visiblePassword === "next" ? "text" : "password"}
                      value={passwords.next}
                      onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                      placeholder="Minimal 8 karakter"
                      className="h-11 px-10"
                    />
                    <button type="button" aria-label="Tampilkan password baru" onClick={() => setVisiblePassword((value) => value === "next" ? null : "next")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777083]">
                      {visiblePassword === "next" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <span key={level} className={`h-1.5 rounded-full ${passwordStrength >= level ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Minimal 8 karakter. Campur huruf, angka & simbol biar makin aman.</p>
                </Field>
                <Field label="Ulangi password baru *">
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d879d]" />
                    <Input
                      type={visiblePassword === "confirm" ? "text" : "password"}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Ulangi password baru"
                      className="h-11 px-10"
                    />
                    <button type="button" aria-label="Tampilkan ulang password" onClick={() => setVisiblePassword((value) => value === "confirm" ? null : "confirm")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777083]">
                      {visiblePassword === "confirm" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </div>
              <div className="mt-5">
                <Button type="button" onClick={savePassword} disabled={!passwords.current || passwords.next.length < 8 || passwords.next !== passwords.confirm} className="text-[#17191d]">
                  <KeyRound /> Ganti password
                </Button>
              </div>
            </section>

          </div>

          <section className="mt-4 rounded-xl border border-border bg-[#fafbfc] p-4 sm:mt-6 sm:rounded-2xl sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-black">
                  <BellRing className="h-5 w-5 text-[#9a7600]" /> Notifikasi akun
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">Atur pemberitahuan yang ingin kamu terima.</p>
              </div>
              <Button type="button" onClick={() => void saveExtras()} disabled={savingExtras} className="text-[#17191d]">
                <Save /> {savingExtras ? "Menyimpan..." : "Simpan preferensi"}
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <span>
                  <span className="block text-sm font-black">Update pesanan</span>
                  <span className="block text-xs text-muted-foreground">Status pembayaran dan proses pesanan.</span>
                </span>
                <Switch
                  checked={profileExtras.notifOrder}
                  onCheckedChange={(checked) => setProfileExtras((current) => ({ ...current, notifOrder: checked }))}
                  aria-label="Notifikasi update pesanan"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
                <span>
                  <span className="block text-sm font-black">Promo & voucher</span>
                  <span className="block text-xs text-muted-foreground">Info diskon dan voucher terbaru.</span>
                </span>
                <Switch
                  checked={profileExtras.notifPromo}
                  onCheckedChange={(checked) => setProfileExtras((current) => ({ ...current, notifPromo: checked }))}
                  aria-label="Notifikasi promo dan voucher"
                />
              </label>
            </div>
            {extrasChanged && <p className="mt-3 text-xs text-muted-foreground">Perubahan preferensi belum disimpan.</p>}
          </section>

          {user.role !== "admin" && (
            <section className="mt-4 flex flex-col gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5">
              <div>
                <h3 className="font-black text-red-900">Hapus akun</h3>
                <p className="mt-1 text-sm text-red-800/80">Semua akses akun akan dihapus dan tidak dapat dikembalikan.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(true)} className="shrink-0 border-red-300 bg-white text-red-700 hover:bg-red-100 hover:text-red-800">
                <Trash2 /> Hapus akun
              </Button>
            </section>
          )}
        </section>
        )}
      </div>
      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={() => {
          logout();
          navigate({ to: "/login" });
        }}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun secara permanen?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Kamu akan langsung keluar dari akun BotakStore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={() => void removeAccount()} className="bg-red-600 text-white hover:bg-red-700">
              <Trash2 /> {deleting ? "Menghapus..." : "Ya, hapus akun"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PublicLayout>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#fff4c5] text-[#8b6900] sm:h-10 sm:w-10 sm:rounded-xl">
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-black sm:text-xl">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

function ProfilStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="relative flex min-h-24 flex-col justify-between overflow-hidden rounded-xl border border-border bg-white p-3 shadow-card sm:min-h-28 sm:rounded-2xl sm:p-5">
      <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-lg bg-[#fff4c5] text-[#8b6900] [&>svg]:h-4 [&>svg]:w-4 sm:right-4 sm:top-4 sm:h-11 sm:w-11 sm:rounded-xl sm:[&>svg]:h-5 sm:[&>svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-3 truncate text-base font-black sm:mt-4 sm:text-xl">{value}</p>
        <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{hint}</p>
      </div>
    </div>
  );
}
