import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  Gem,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./ui";
import { rupiah } from "@/lib/format";
import { TOPUP_GAMES, TOPUP_PAYMENTS, type TopupPack } from "@/lib/topup-mock";

const NO_PACKS: TopupPack[] = [];

const GROUP_META: Record<string, { icon: string; description: string }> = {
  "Top Up Diamond": {
    icon: "💎",
    description: "Pilihan nominal diamond resmi & proses kilat",
  },
  "Pass & Membership": {
    icon: "🎟️",
    description: "Weekly Diamond Pass hemat & paket langganan",
  },
};

const packGroup = (pack: TopupPack) =>
  pack.label.toLowerCase().includes("pass") ? "Pass & Membership" : "Top Up Diamond";

export function TopupTab({ gameSlug }: { gameSlug?: string }) {
  const availableGames = TOPUP_GAMES.filter((item) => item.slug === "mobile-legends");
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [packId, setPackId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const game = availableGames.find((item) => item.slug === gameSlug);
  const packs = game?.packs ?? NO_PACKS;
  const selectedPack = packs.find((item) => item.id === packId);
  const visiblePacks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword
      ? packs.filter((item) => item.label.toLowerCase().includes(keyword))
      : packs;
  }, [packs, query]);
  const groups = [...new Set(packs.map(packGroup))];
  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  const isGroupOpen = (group: string) => {
    // Saat pencarian aktif, otomatis buka grup yang punya hasil cocok.
    if (query.trim()) return visiblePacks.some((item) => packGroup(item) === group);
    return !!openGroups[group];
  };
  useEffect(() => {
    if (selectedPack) {
      const group = packGroup(selectedPack);
      setOpenGroups((prev) => (prev[group] ? prev : { ...prev, [group]: true }));
    }
  }, [selectedPack]);

  const paymentMethods = TOPUP_PAYMENTS.filter(
    (item) => item.id === "qris" || item.id === "nobu-va",
  );
  const selectedPayment = paymentMethods.find((item) => item.id === paymentId);
  const subtotal = selectedPack?.price ?? 0;
  const paymentFee = selectedPayment?.fee ?? 0;
  const total = subtotal + paymentFee;
  const accountComplete = userId.trim().length >= 3 && serverId.trim().length > 0;
  const valid = accountComplete && !!selectedPack && !!paymentId && whatsapp.trim().length >= 8;

  const submit = () => {
    if (!valid) {
      toast.error("Lengkapi data akun, nominal, pembayaran, dan nomor WhatsApp.");
      return;
    }

    toast.success("Pesanan top up siap diproses.", {
      description: `${selectedPack?.label} · ${selectedPayment?.name} · ${rupiah(total)}`,
    });
  };

  if (!game) {
    return (
      <section className="mb-8">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a7500]">Daftar Game</p>
          <div className="mt-1 flex items-center gap-2.5">
            <h2 className="text-xl font-black text-[#111827] sm:text-2xl">Populer</h2>
            <img src="/icon/fire.gif" alt="" className="h-8 w-8 object-contain" />
          </div>
          <p className="mt-1 text-sm text-[#68758b]">Pilih game untuk melanjutkan top up.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          {availableGames.map((item) => (
            <Link
              key={item.slug}
              to="/topup/$slug"
              params={{ slug: item.slug }}
              aria-label={`Pilih ${item.name}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#ecd46e] bg-[#101827] shadow-[0_14px_35px_-26px_rgba(104,76,0,.65)] transition hover:-translate-y-1 hover:border-[#d7aa00] hover:shadow-[0_18px_35px_-22px_rgba(215,170,0,.65)]"
            >
              <img
                src="/topup-ml.jpg"
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101827] via-[#101827]/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-4">
                <p className="text-[10px] font-bold text-[#ffe785] sm:text-xs">{item.category}</p>
                <h3 className="mt-1 text-xs font-black leading-tight sm:text-base">{item.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[#68758b]">
        <a href="/" className="transition hover:text-[#8a6800]">Beranda</a>
        <span>›</span>
        <a href="/#topup" className="transition hover:text-[#8a6800]">Top Up</a>
        <span>›</span>
        <span className="font-bold text-[#202738]">Top Up Mobile Legends</span>
      </nav>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#ecd46e] bg-white p-4 shadow-[0_18px_45px_-32px_rgba(104,76,0,.45)] sm:rounded-[2rem] sm:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,#fff0a8,transparent_68%)]" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-[#ecd46e] bg-[#fff9df] p-2 sm:h-24 sm:w-24 sm:rounded-2xl">
            <img src="/mlbb-diamond.svg" alt="" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#ecd46e] bg-[#fff8df] px-3 py-1 text-[11px] font-black text-[#8a6800]">
              <Gem className="h-3.5 w-3.5" /> Top Up Game oleh {game.publisher}
            </p>
            <h1 className="mt-2 text-xl font-black tracking-tight text-[#101827] sm:text-3xl">
              Top Up Mobile Legends
            </h1>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Badge icon={<Zap />} label="Proses instan" />
          <Badge icon={<ShieldCheck />} label="Aman & legal" />
          <Badge icon={<MessageCircle />} label="CS via WhatsApp" />
          <Badge icon={<Clock3 />} label="Buka 24 jam" />
        </div>
        <p className="relative mt-4 text-sm text-[#526176]">{game.description}</p>
      </div>

      <details className="group mt-6 rounded-3xl border border-[#ecd46e] bg-white shadow-[0_14px_38px_-32px_rgba(104,76,0,.45)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-7">
          <span>
            <span className="text-xs font-black uppercase tracking-wider text-[#9a7500]">Wajib Dibaca</span>
            <strong className="mt-1 block text-lg text-[#172033]">Cara Top Up Mobile Legends</strong>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffd84d] px-4 py-2 text-xs font-black text-[#17191d] transition hover:bg-[#ffca24]">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Baca Panduan</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-[#efe4b0] px-5 py-5 sm:px-7">
          <p className="text-sm text-[#68758b]">
            Ikuti {game.howTo.length} langkah berikut sampai diamond masuk ke akun.
          </p>
          <ol className="mt-4 grid grid-cols-2 gap-2.5 md:gap-3">
            {game.howTo.map((step, index) => (
              <li key={step} className="flex flex-col gap-2 rounded-xl bg-[#fffbed] p-2.5 text-[11px] leading-4 text-[#4f5968] sm:flex-row sm:gap-3 sm:rounded-2xl sm:p-3 sm:text-sm sm:leading-6">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-xs font-black text-[#17191d]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <Step number="1" title="Pilih Nominal" description="Mau top up berapa Diamonds?">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8490a3]" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari produk... (misal: 86, pass, 257)"
                className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc] pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Hapus pencarian"
                  title="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8490a3] transition hover:text-[#202738]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {query.trim() ? (
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#68758b]">
                <span>
                  Hasil pencarian &ldquo;<b className="text-[#202738]">{query}</b>&rdquo;:{" "}
                  <span className="font-black text-[#8a6800]">{visiblePacks.length}</span> produk ditemukan
                </span>
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 font-black text-[#b03a2e] hover:underline"
                >
                  Reset
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#8490a3]">{visiblePacks.length} produk tersedia</p>
            )}
            <div className="mt-5 space-y-3">
              {groups.map((group, groupIndex) => {
                const products = visiblePacks.filter((item) => packGroup(item) === group);
                if (!products.length) return null;
                const open = isGroupOpen(group);
                const selectedInGroup = !!selectedPack && packGroup(selectedPack) === group;
                const meta = GROUP_META[group];
                return (
                  <div
                    key={group}
                    className={`overflow-hidden rounded-2xl border bg-white transition ${selectedInGroup ? "border-[#d7aa00] shadow-[0_12px_25px_-18px_rgba(215,170,0,.7)] ring-2 ring-[#ffd84d]/40" : "border-[#dce3ec]"}`}
                  >
                    <h3>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        aria-expanded={open}
                        aria-controls={`topup-group-panel-${groupIndex}`}
                        className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left transition ${open ? "bg-[#fff8df]" : "hover:bg-[#fffdf5]"}`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#ecd46e] bg-[#fff9df] text-lg">
                          {meta?.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-[15px] font-black leading-tight text-[#202738]">
                            {group}
                            <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#68758b]">
                              {products.length} produk
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#68758b]">
                            {selectedInGroup && selectedPack ? (
                              <span className="font-semibold text-[#8a6800]">
                                Dipilih: <b>{selectedPack.label}</b>
                              </span>
                            ) : (
                              meta?.description
                            )}
                          </span>
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-[#68758b] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                        />
                      </button>
                    </h3>
                    {open && (
                      <div
                        id={`topup-group-panel-${groupIndex}`}
                        className="border-t border-dashed border-[#e4e7ec] bg-[#fffdf5] p-3 sm:p-4"
                      >
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                          {products.map((item) => {
                            const active = item.id === packId;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPackId(item.id)}
                                aria-pressed={active}
                                className={`relative min-h-36 rounded-xl border p-2.5 text-center transition sm:min-h-44 sm:rounded-2xl sm:p-3 ${active ? "border-[#d7aa00] bg-[#fff8df] shadow-[0_12px_25px_-18px_rgba(215,170,0,.7)]" : "border-[#dce3ec] bg-white hover:-translate-y-0.5 hover:border-[#e4bd22]"}`}
                              >
                                {active && (
                                  <span className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d]">
                                    <Check className="h-4 w-4" />
                                  </span>
                                )}
                                {item.badge && (
                                  <span className="absolute right-2 top-2 rounded-full bg-[#ffd84d] px-2 py-1 text-[8px] font-black uppercase text-[#17191d]">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#fff4bd] text-2xl sm:h-16 sm:w-16 sm:rounded-2xl sm:text-3xl">
                                  {item.icon}
                                </span>
                                <span className="mt-2 block text-[10px] font-black leading-3 text-[#202738] sm:text-xs sm:leading-4">
                                  {item.label}
                                </span>
                                <span className="mt-2 block text-xs font-black text-[#8a6800] sm:text-sm">
                                  {rupiah(item.price)}
                                </span>
                                {game.instant && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#718096]">
                                    <Zap className="h-3 w-3" /> Proses instan
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {visiblePacks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dce3ec] bg-[#f8fafc] p-4 text-center sm:p-6">
                  <p className="font-black text-[#202738]">Produk Tidak Ditemukan</p>
                  <p className="mt-1 text-xs text-[#68758b]">
                    Tidak ada produk yang cocok dengan pencarian &ldquo;{query}&rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="mt-3 rounded-full bg-[#ffd84d] px-5 py-2 text-xs font-black text-[#17191d] transition hover:bg-[#f2c425]"
                  >
                    Reset Pencarian
                  </button>
                </div>
              )}
            </div>
          </Step>

          <Step
            number="2"
            title="Data Akun Game"
            description="Isi User ID & Zone ID dengan benar biar Diamonds nggak nyasar."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="User ID *" hint="ID Akun game">
                <Input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Contoh: 12345678"
                  className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]"
                />
              </Field>
              <Field label="Zone ID *" hint="Server / Zone ID">
                <Input
                  value={serverId}
                  onChange={(event) => setServerId(event.target.value)}
                  placeholder="Contoh: 1234"
                  className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]"
                />
              </Field>
            </div>
            <details className="mt-5 rounded-2xl border border-[#ecd46e] bg-[#fffbed] px-4 py-3 text-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-black text-[#202738]">
                <ChevronDown className="h-4 w-4 text-[#8a6800]" /> Cara menemukan User ID
              </summary>
              <p className="mt-2 leading-6 text-[#68758b]">
                Buka profil Mobile Legends, salin User ID dan Server ID yang tampil di bawah
                nickname kamu. Contoh: 12345678 (2041).
              </p>
            </details>
            {accountComplete && (
              <div className="mt-3 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4" /> Akun terdeteksi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" /> Player MLBB
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Indonesia
                </span>
              </div>
            )}
            <div className="mt-5 rounded-2xl border border-[#ecd46e] bg-[#fffbed] p-4">
              <p className="flex items-center gap-2 font-black text-[#715700]">
                <LockKeyhole className="h-4 w-4" /> Tanpa Login Akun
              </p>
              <p className="mt-1 text-xs leading-5 text-[#68758b]">
                Cukup User ID &amp; Zone ID. Pastikan data sudah benar — pesanan ke akun yang salah
                tidak dapat dikembalikan.
              </p>
            </div>
          </Step>

          <Step
            number="3"
            title="Pembayaran"
            description="Harga di tiap metode sudah termasuk biaya admin."
          >
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {paymentMethods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={!selectedPack}
                  onClick={() => setPaymentId(item.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${paymentId === item.id ? "border-[#d7aa00] bg-[#fff8df]" : "border-[#dce3ec] bg-white hover:border-[#e4bd22]"}`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17191d] text-sm font-black text-[#ffd84d]">
                    {item.icon}
                  </span>
                  <span>
                    <strong className="block text-sm">{item.name}</strong>
                    <span className="text-[11px] text-[#718096]">
                      {!selectedPack
                        ? "Pilih nominal dulu"
                        : item.fee
                          ? `+${rupiah(item.fee)}`
                          : "Tanpa biaya"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Step>

          <Step
            number="4"
            title="Kontak"
            description="Nomor WhatsApp untuk info & bukti pesanan."
          >
            <Field
              label="Nomor WhatsApp *"
              hint="Info & bukti pesanan dikirim ke nomor ini. Tenang, bukan buat spam."
            >
              <Input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="0812 3456 7890"
                className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]"
              />
            </Field>
            <div className="mt-5">
              <Field label="Email (opsional)" hint="Buat kirim salinan bukti transaksi.">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="kamu@email.com"
                  className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]"
                />
              </Field>
            </div>
          </Step>
        </div>

        <aside className="overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_18px_45px_-30px_rgba(104,76,0,.35)] lg:sticky lg:top-36">
          <div className="flex items-center gap-2 border-b border-[#ecd46e] bg-[#fff5c7] px-5 py-4">
            <Wallet className="h-5 w-5 text-[#8a6800]" />
            <h2 className="font-black text-[#202738]">Ringkasan Pesanan</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ece5c7] bg-[#fffdf5] p-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#fff4bd]">
                <img src="/mlbb-diamond.svg" alt="" className="h-9 w-9 object-contain" />
              </span>
              <div>
                <p className="text-sm font-black">Top Up Mobile Legends</p>
                <p className="mt-0.5 text-xs text-[#7b8798]">
                  {selectedPack?.label ?? "Belum pilih nominal"}
                </p>
              </div>
            </div>
            <SummaryRow label="Pembayaran" value={selectedPayment?.name ?? "Belum dipilih"} />
            <SummaryRow label="Subtotal" value={rupiah(subtotal)} />
            <SummaryRow
              label="Biaya admin"
              value={selectedPayment ? rupiah(paymentFee) : "—"}
            />
            <div className="mt-4 flex items-center justify-between border-t border-[#e5eaf0] pt-4">
              <span className="font-black">Total Bayar</span>
              <span className="text-xl font-black text-[#8a6800]">{rupiah(total)}</span>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={submit}
              className="mt-5 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]"
            >
              Beli Sekarang <Zap />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#718096]">
              <LockKeyhole className="h-4 w-4" /> Pembayaran aman · Diproses otomatis 24 jam
            </p>
            <p className="mt-2 text-center text-[11px] text-[#8490a3]">
              Dengan membeli, kamu setuju sama syarat &amp; ketentuan BotakStore.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ecd46e] bg-[#fff8df] px-3 py-2 text-[11px] font-black text-[#715700]">
      {icon}
      <span>{label}</span>
    </span>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-[0_18px_45px_-36px_rgba(31,42,61,.35)] sm:rounded-3xl sm:p-7">
      <header className="-mx-4 -mt-4 mb-4 flex items-start gap-3 border-b border-dashed border-[#e4e7ec] px-4 py-3.5 sm:-mx-7 sm:-mt-7 sm:mb-5 sm:gap-4 sm:px-7 sm:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ecd46e] bg-[#fff3bd] text-base font-black text-[#8a6800]">
          {number}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-lg font-black leading-tight text-[#101827] sm:text-xl">{title}</h2>
          <p className="mt-0.5 text-sm leading-snug text-[#68758b]">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex items-start justify-between gap-4 text-sm">
      <span className="text-[#718096]">{label}</span>
      <span className="text-right font-bold text-[#202738]">{value}</span>
    </div>
  );
}
