import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  Check,
  ChevronDown,
  CircleCheck,
  Gem,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "./ui";
import { rupiah } from "@/lib/format";
import {
  checkMobileLegendsAccount,
  createPakasirPayment,
  fetchMobileLegendsProducts,
  type MobileLegendsAccount,
  type PakasirPayment,
} from "@/lib/api";
import { recordPakasirOrder } from "@/lib/actions";
import { useDB } from "@/lib/store";
import { ACTIVE_PAKASIR_PAYMENT_METHODS, type PakasirMethod } from "@/lib/pakasir";
import { TOPUP_GAMES, type TopupPack } from "@/lib/topup-mock";
import { PaymentInstruction } from "./PaymentInstruction";

const NO_PACKS: TopupPack[] = [];

const GROUP_META: Record<string, { icon: string; description: string }> = {
  "Top Up Diamond": {
    icon: "💎",
    description: "Pilihan nominal diamond resmi & proses kilat",
  },
  "Pass & Membership": {
    icon: "/icon/topup/mobile%20legends/weekly-diamond-pass.webp",
    description: "Weekly Diamond Pass hemat & paket langganan",
  },
};

const packGroup = (pack: TopupPack) => {
  const label = pack.label.toLowerCase();
  return label.includes("pass") || label.includes("membership") || label.includes("weekly")
    ? "Pass & Membership"
    : "Top Up Diamond";
};

export function TopupTab({ gameSlug }: { gameSlug?: string }) {
  const db = useDB();
  const availableGames = TOPUP_GAMES
    .filter((item) => item.slug === "mobile-legends")
    .map((item) => {
      const catalogGame = db.games.find((game) => game.slug === item.slug);
      return {
        ...item,
        name: catalogGame?.name ?? item.name,
        listImage: catalogGame?.listImage ?? "/joki-default/mobile-legends.png",
        coverImage: catalogGame?.coverImage ?? catalogGame?.listImage ?? "/joki-default/mobile-legends.png",
        status: catalogGame?.status ?? "active",
      };
    })
    .filter((item) => item.status === "active");
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [packId, setPackId] = useState("");
  const [paymentId, setPaymentId] = useState<PakasirMethod>("qris");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState<MobileLegendsAccount | null>(null);
  const [accountError, setAccountError] = useState("");
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [digiflazzPacks, setDigiflazzPacks] = useState<TopupPack[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [accountAttention, setAccountAttention] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentInstruction, setPaymentInstruction] = useState<PakasirPayment | null>(null);
  const markupPercent = Math.max(0, Number(db.settings.topupMarkupPercent ?? 0));
  const markupFlat = Math.max(0, Number(db.settings.topupMarkupFlat ?? 0));

  const game = availableGames.find((item) => item.slug === gameSlug);
  const catalogGame = db.games.find((item) => item.slug === game?.slug);
  const packs = game ? digiflazzPacks : NO_PACKS;
  const selectedPack = packs.find((item) => item.id === packId);
  const groups = [...new Set(packs.map(packGroup))];
  const [activeGroup, setActiveGroup] = useState("Top Up Diamond");
  const currentGroup = groups.includes(activeGroup) ? activeGroup : (groups[0] ?? "");
  const activeProducts = packs.filter((item) => packGroup(item) === currentGroup);
  useEffect(() => {
    if (selectedPack) {
      setActiveGroup(packGroup(selectedPack));
    }
  }, [selectedPack]);

  useEffect(() => {
    if (game?.slug !== "mobile-legends") {
      setDigiflazzPacks([]);
      return;
    }

    let cancelled = false;
    setProductsLoading(true);
    setProductsError("");

    void fetchMobileLegendsProducts()
      .then((products) => {
        if (cancelled) return;
        setDigiflazzPacks(products.map((product) => {
          const group = packGroup({
            id: product.id,
            label: product.label,
            price: Math.round(product.price + (product.price * markupPercent / 100) + markupFlat),
            icon: "",
          });
          return {
            id: product.id,
            label: product.label,
            sub: product.description,
            price: Math.round(product.price + (product.price * markupPercent / 100) + markupFlat),
            icon: group === "Pass & Membership"
              ? "/icon/topup/mobile%20legends/weekly-diamond-pass.webp"
              : "/icon/topup/mobile%20legends/diamond-ml.webp",
          };
        }));
      })
      .catch((error) => {
        if (!cancelled) {
          setDigiflazzPacks([]);
          setProductsError(error instanceof Error ? error.message : "Produk gagal dimuat.");
        }
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [game?.slug, markupFlat, markupPercent]);

  useEffect(() => {
    const normalizedUserId = userId.trim();
    const normalizedServerId = serverId.trim();
    let cancelled = false;

    setAccount(null);
    setAccountError("");

    if (!/^\d{5,20}$/.test(normalizedUserId) || !/^\d{1,10}$/.test(normalizedServerId)) {
      setCheckingAccount(false);
      return;
    }

    setCheckingAccount(true);
    const timeout = window.setTimeout(async () => {
      try {
        const result = await checkMobileLegendsAccount(normalizedUserId, normalizedServerId);
        if (!cancelled) setAccount(result);
      } catch (error) {
        if (!cancelled) {
          setAccountError(error instanceof Error ? error.message : "Akun tidak dapat diperiksa.");
        }
      } finally {
        if (!cancelled) setCheckingAccount(false);
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [userId, serverId]);

  const paymentMethods = ACTIVE_PAKASIR_PAYMENT_METHODS;
  const selectedPayment = paymentMethods.find((item) => item.id === paymentId);
  const subtotal = selectedPack?.price ?? 0;
  const paymentFee = 0;
  const total = subtotal + paymentFee;
  const normalizedUserId = userId.trim();
  const normalizedServerId = serverId.trim();
  const accountComplete = !!account
    && account.user_id === normalizedUserId
    && account.server_id === normalizedServerId;
  const valid = accountComplete && !!selectedPack && !!paymentId && whatsapp.trim().length >= 8;

  const submit = async () => {
    if (!accountComplete) {
      setAccountAttention(false);
      window.requestAnimationFrame(() => setAccountAttention(true));
      document.getElementById("topup-account")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.setTimeout(() => {
        document.getElementById("topup-user-id")?.focus({ preventScroll: true });
      }, 450);
      window.setTimeout(() => setAccountAttention(false), 1800);
      toast.error("Cek User ID dan Zone ID terlebih dahulu.");
      return;
    }
    if (!valid) {
      toast.error("Lengkapi data akun, nominal, pembayaran, dan nomor WhatsApp.");
      return;
    }

    if (!selectedPack || !account) return;

    setCreatingPayment(true);
    try {
      const payment = await createPakasirPayment({
        order_type: "topup",
        item_id: selectedPack.id,
        description: `Top Up Mobile Legends - ${selectedPack.label}`,
        amount: total,
        payment_method: paymentId,
        customer: {
          whatsapp: whatsapp.trim(),
          email: email.trim() || undefined,
          user_id: normalizedUserId,
          server_id: normalizedServerId,
          username: account.username,
          country: account.country,
          customer_id: db.session?.role === "customer" ? db.session.userId : undefined,
          customer_name: account.username,
          game_id: catalogGame?.id ?? "g-mlbb",
          game_name: game?.name ?? "Mobile Legends",
        },
      });
      recordPakasirOrder({
        orderId: payment.order_id,
        transactionId: payment.txn_id,
        amount: payment.total_payment ?? total,
        method: payment.payment_method,
        game: { id: catalogGame?.id ?? "g-mlbb", name: game?.name ?? "Mobile Legends" },
        service: { id: selectedPack.id, name: `Top Up ${selectedPack.label}` },
        customer: { name: account.username, email: email.trim() || undefined, phone: whatsapp.trim() },
        gameUserId: normalizedUserId,
        gameServerId: normalizedServerId,
      });
      if (payment.payment_url) {
        window.location.assign(payment.payment_url);
        return;
      }
      setPaymentInstruction(payment);
      setCreatingPayment(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pembayaran gagal dibuat.");
      setCreatingPayment(false);
    }
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
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-4">
          {availableGames.map((item) => (
            <Link
              key={item.slug}
              to="/topup/$slug"
              params={{ slug: item.slug }}
              aria-label={`Pilih ${item.name}`}
              className="joki-game-card group relative aspect-[416/600] bg-transparent"
            >
              <img
                src={item.listImage}
                alt={item.name}
                className="joki-game-card-visual h-full w-full object-cover"
              />
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#68758b] sm:text-sm">
        <Link to="/" className="transition hover:text-[#8a6800]">Beranda</Link>
        <span aria-hidden="true">›</span>
        <Link to="/topup" className="transition hover:text-[#8a6800]">Top Up</Link>
        <span aria-hidden="true">›</span>
        <span className="max-w-full truncate font-bold text-[#202738]">Top Up {game.name}</span>
      </nav>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#ecd46e] bg-[#101827] p-4 shadow-[0_18px_45px_-32px_rgba(104,76,0,.45)] sm:mt-4 sm:rounded-[2rem] sm:p-7">
        <img src={game.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-black/45" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <img
            src={game.listImage}
            alt={game.name}
            className="aspect-[3/4] w-14 shrink-0 rounded-lg bg-transparent object-contain sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <p className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#ffd84d] px-2 py-0.5 text-[10px] font-black text-[#17191d] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
              <Gem className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> <span className="truncate">Top Up Game oleh {game.publisher}</span>
            </p>
            <h1 className="mt-1 truncate text-lg font-black tracking-tight text-white drop-shadow sm:mt-2 sm:text-3xl">
              Top Up {game.name}
            </h1>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/70 sm:hidden">
              {game.description}
            </p>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
          <Badge icon={<img src="/icon/lightning.gif" alt="" className="h-4 w-4 object-contain" />} label="Proses instan" />
          <Badge icon={<img src="/icon/secure.gif" alt="" className="h-4 w-4 object-contain" />} label="Aman & legal" />
          <Badge icon={<img src="/icon/clock.gif" alt="" className="h-4 w-4 object-contain" />} label="Buka 24 jam" />
        </div>
      </div>

      <details className="group mt-4 rounded-2xl border border-[#ecd46e] bg-white shadow-[0_14px_38px_-32px_rgba(104,76,0,.45)] sm:mt-6 sm:rounded-3xl">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-7 sm:py-4">
          <span className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#9a7500] sm:text-xs">Wajib Dibaca</span>
            <strong className="mt-0.5 block truncate text-[15px] text-[#172033] sm:text-lg">Cara Top Up {game.name}</strong>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ffd84d] px-3 py-2 text-[11px] font-black text-[#17191d] transition hover:bg-[#ffca24] sm:gap-2 sm:px-4 sm:text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Panduan</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-[#efe4b0] px-4 py-4 sm:px-7 sm:py-5">
          <p className="text-xs text-[#68758b] sm:text-sm">
            Ikuti {game.howTo.length} langkah berikut sampai diamond masuk ke akun.
          </p>
          <ol className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-2.5 md:gap-3">
            {game.howTo.map((step, index) => (
              <li key={step} className="flex flex-row items-start gap-2.5 rounded-xl bg-[#fffbed] p-3 text-xs leading-5 text-[#4f5968] sm:gap-3 sm:rounded-2xl sm:text-sm sm:leading-6">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-[11px] font-black text-[#17191d] sm:h-7 sm:w-7 sm:text-xs">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>

      <div className="mt-4 grid grid-cols-1 gap-4 pb-28 sm:space-y-0 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:gap-8 lg:pb-0">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <div
            id="topup-account"
            className={`scroll-mt-24 rounded-2xl sm:scroll-mt-32 sm:rounded-3xl ${accountAttention ? "animate-topup-account-shake [&>section]:border-red-400 [&>section]:ring-4 [&>section]:ring-red-100" : ""}`}
          >
            <Step
              number="1"
              title="Data Akun Game"
              description="Isi User ID & Zone ID dengan benar biar Diamonds nggak nyasar."
            >
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <Field label="User ID *" hint="ID Akun game">
                <Input
                  id="topup-user-id"
                  value={userId}
                  inputMode="numeric"
                  onChange={(event) => {
                    setUserId(event.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="Contoh: 12345678"
                  aria-invalid={accountAttention && !normalizedUserId}
                  className={`h-11 text-base rounded-2xl bg-[#f8fafc] sm:h-12 sm:text-sm ${accountAttention && !normalizedUserId ? "border-red-500 ring-2 ring-red-100" : "border-[#dce3ec]"}`}
                />
              </Field>
              <Field label="Zone ID *" hint="Server / Zone ID">
                <Input
                  value={serverId}
                  inputMode="numeric"
                  onChange={(event) => {
                    setServerId(event.target.value.replace(/\D/g, ""));
                  }}
                  placeholder="Contoh: 1234"
                  aria-invalid={accountAttention && !normalizedServerId}
                  className={`h-11 text-base rounded-2xl bg-[#f8fafc] sm:h-12 sm:text-sm ${accountAttention && !normalizedServerId ? "border-red-500 ring-2 ring-red-100" : "border-[#dce3ec]"}`}
                />
              </Field>
            </div>

            {accountAttention && (
              <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">
                Isi User ID dan Zone ID terlebih dahulu, lalu tunggu sampai akun berhasil ditemukan.
              </p>
            )}

            {checkingAccount && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#eef2f1] px-3 py-1.5 text-[11px] font-semibold italic text-[#52605b]">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Mengecek akun...
              </p>
            )}

            {accountError && (
              <p className="mt-3 inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold italic text-red-700">
                {accountError}
              </p>
            )}

            {accountComplete && account && (
              <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-emerald-600/70 bg-[#173d2b] px-3 py-2 text-[11px] font-medium italic leading-relaxed text-white shadow-sm sm:rounded-full sm:py-1.5">
                <span>Your account is</span>
                <strong className="max-w-40 truncate text-[#73e8a8]">{account.username}</strong>
                <CircleCheck className="h-3.5 w-3.5 shrink-0 fill-[#27c873] text-[#173d2b]" />
                <span>from</span>
                <strong>{account.country}</strong>
                <span aria-hidden="true">{account.country === "Indonesia" ? "🇮🇩" : "🌐"}</span>
              </p>
            )}
            </Step>
          </div>

          <Step number="2" title="Pilih Nominal" description="Mau top up berapa Diamonds?">
            <p className="text-xs text-[#8490a3]">
              {productsLoading ? "Memuat..." : `${packs.length} produk tersedia`}
            </p>
            {productsError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {productsError}
              </p>
            )}
            <div className="mt-3 sm:mt-4">
              <div className="flex gap-2">
                {groups.map((group) => {
                  const meta = GROUP_META[group];
                  const count = packs.filter((item) => packGroup(item) === group).length;
                  const active = currentGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setActiveGroup(group)}
                      aria-pressed={active}
                      className={`inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border px-2 text-[11px] font-black transition sm:h-10 sm:gap-2 sm:px-3 sm:text-xs ${active ? "border-[#d7aa00] bg-[#ffd84d] text-[#17191d] shadow-sm" : "border-[#dce3ec] bg-white text-[#596579] hover:border-[#e4bd22]"}`}
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center text-sm sm:text-base">
                        {meta?.icon?.startsWith("/") ? (
                          <img src={meta.icon} alt="" className="h-full w-full object-contain" />
                        ) : meta?.icon}
                      </span>
                      <span className="truncate whitespace-nowrap">{group}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-white/70" : "bg-[#f1f5f9]"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className={`${activeProducts.length ? "" : "hidden"} mt-3 rounded-2xl border border-[#dce3ec] bg-[#fffdf5] p-2 sm:p-4`}>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-3">
                  {activeProducts.map((item) => {
                    const active = item.id === packId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setPackId(item.id);
                          window.setTimeout(() => {
                            document.getElementById("topup-payment")?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 120);
                        }}
                        aria-pressed={active}
                        title={item.label}
                        className={`relative flex min-h-14 flex-col rounded-lg border p-0 text-left transition sm:min-h-16 ${active ? "border-[#d7aa00] bg-[#fff8df] shadow-[0_8px_20px_-12px_rgba(215,170,0,.6)]" : "border-[#dce3ec] bg-white hover:border-[#e4bd22]"}`}
                      >
                        {active && (
                          <span className="absolute -right-1.5 -top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d]">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                        <span className="flex w-full flex-1 flex-row items-center gap-2 px-2 py-1.5 sm:gap-2.5 sm:px-2.5 sm:py-2">
                          <span className="grid h-7 w-7 shrink-0 place-items-center sm:h-8 sm:w-8">
                            {item.icon.startsWith("/") ? (
                              <img src={item.icon} alt="" loading="lazy" className="h-full w-full object-contain" />
                            ) : (
                              <span className="text-xl sm:text-2xl">{item.icon}</span>
                            )}
                          </span>
                          <span className="line-clamp-1 min-w-0 flex-1 text-[11px] font-black leading-tight text-[#202738] sm:text-xs">
                            {/* Strip game name prefix for brevity */}
                            {item.label
                              .replace(/^Mobile Legends\s*/i, "")
                              .replace(/\s*\(Indonesia\)/i, "")}
                          </span>
                        </span>
                        {/* Price footer */}
                        <span className="flex w-full items-center justify-between gap-1 rounded-b-lg border-t border-[#d9ad00] bg-[#ffd84d] px-2 py-1 sm:py-1.5">
                          <span className="truncate text-[11px] font-black leading-none tabular-nums text-[#17191d] sm:text-xs">{rupiah(item.price)}</span>
                          {game.instant && (
                            <span className="grid h-4 w-6 shrink-0 place-items-center rounded bg-white px-0.5 shadow-sm sm:h-5 sm:w-7">
                              <img src="/icon/pengiriman-cepat.png" alt="Cepat" loading="lazy" className="h-full w-full object-contain" />
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {!productsLoading && activeProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dce3ec] bg-[#f8fafc] p-4 text-center sm:p-6">
                  <p className="font-black text-[#202738]">Produk Tidak Ditemukan</p>
                  <p className="mt-1 text-xs text-[#68758b]">Belum ada produk pada kategori ini.</p>
                </div>
              )}
            </div>
          </Step>

          <div id="topup-payment" className="scroll-mt-24 sm:scroll-mt-32">
            <Step
              number="3"
              title="Pembayaran"
              description="Harga di tiap metode sudah termasuk biaya admin."
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                {paymentMethods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!selectedPack}
                    onClick={() => setPaymentId(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-3 sm:rounded-2xl sm:p-3 ${paymentId === item.id ? "border-[#d7aa00] bg-[#fff8df]" : "border-[#dce3ec] bg-white hover:border-[#e4bd22]"}`}
                  >
                    <span className="grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e5eaf0] bg-white sm:h-10 sm:w-16 sm:rounded-xl">
                      {item.icon.startsWith("/") ? (
                        <img src={item.icon} alt={item.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center rounded-lg bg-[#17191d] text-[10px] font-black leading-tight text-[#ffd84d] sm:rounded-xl sm:text-[11px]">{item.icon}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs font-black leading-tight text-[#202738] sm:text-sm">{item.name}</strong>
                      <span className="hidden text-[11px] leading-snug text-[#718096] sm:block">
                        {!selectedPack ? "Pilih nominal dulu" : item.description}
                      </span>
                    </span>
                    {paymentId === item.id && (
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d]">
                        <Check className="h-3 w-3 text-[#17191d]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </Step>
          </div>

          <Step
            number="4"
            title="Kontak"
            description="Nomor WhatsApp untuk info & bukti pesanan."
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Field
              label="WhatsApp *"
              hint="Bukti pesanan dikirim ke sini."
            >
              <Input
                value={whatsapp}
                onChange={(event) => setWhatsapp(event.target.value)}
                placeholder="081234567890"
                inputMode="tel"
                className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm"
              />
            </Field>
              <Field label="Email" hint="Salinan bukti (opsional).">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="kamu@email.com"
                  className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm"
                />
              </Field>
            </div>
          </Step>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_18px_45px_-30px_rgba(104,76,0,.35)] lg:block lg:sticky lg:top-36">
          <div className="flex items-center gap-2 border-b border-[#ecd46e] bg-[#fff5c7] px-5 py-4">
            <Wallet className="h-5 w-5 text-[#8a6800]" />
            <h2 className="font-black text-[#202738]">Ringkasan Pesanan</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ece5c7] bg-[#fffdf5] p-3">
              <img
                src={game.listImage}
                alt={game.name}
                className="aspect-[3/4] w-10 shrink-0 bg-transparent object-contain"
              />
              <div>
                <p className="text-sm font-black">Top Up {game.name}</p>
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
              disabled={creatingPayment}
              className="mt-5 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]"
            >
              {creatingPayment ? <LoaderCircle className="animate-spin" /> : <Banknote />}
              {creatingPayment ? "Membuka pembayaran..." : "Beli Sekarang"}
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

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-[58px] z-40 border-t border-[#ecd46e] bg-white/95 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_28px_-12px_rgba(104,76,0,.25)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] leading-tight text-[#718096]">{selectedPack?.label ?? "Belum pilih nominal"}</p>
            <p className="truncate text-base font-black tabular-nums text-[#101827]">{rupiah(total)}</p>
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={creatingPayment || !valid}
            className="h-10 shrink-0 bg-[#ffd84d] px-4 text-sm font-black text-[#17191d] hover:bg-[#f2c425] disabled:opacity-50"
          >
            {creatingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
            {creatingPayment ? "Memproses..." : "Beli Sekarang"}
          </Button>
        </div>
      </div>
      {paymentInstruction && <PaymentInstruction payment={paymentInstruction} onClose={() => setPaymentInstruction(null)} />}
    </section>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[9px] font-black text-white shadow-sm backdrop-blur-md sm:text-[10px]">
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
    <section className="overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white shadow-[0_18px_45px_-36px_rgba(31,42,61,.35)] sm:rounded-3xl">
      <header className="flex items-center gap-2.5 border-b border-dashed border-[#e4e7ec] bg-[#fafbfc] px-4 py-3 sm:gap-4 sm:px-7 sm:py-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-sm font-black text-[#17191d] shadow-[0_4px_10px_-8px_rgba(138,104,0,.7)] sm:h-10 sm:w-10 sm:text-base">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-black leading-tight text-[#101827] sm:text-xl">{title}</h2>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#68758b] sm:text-sm">{description}</p>
        </div>
      </header>
      <div className="p-3.5 sm:p-7">{children}</div>
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
