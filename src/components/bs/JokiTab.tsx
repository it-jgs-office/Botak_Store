import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  Trophy,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupiah } from "@/lib/format";
import { createPakasirPayment } from "@/lib/api";
import { recordPakasirOrder } from "@/lib/actions";
import { quoteCoupon } from "@/lib/coupon";
import { ACTIVE_PAKASIR_PAYMENT_METHODS, type PakasirMethod } from "@/lib/pakasir";
import { useDB } from "@/lib/store";
import { Field } from "./ui";

type JokiProduct = {
  id: string;
  group: string;
  name: string;
  price: number;
  estimate: string;
  image: string;
  badge?: string;
  perStar?: boolean;
};

const DEFAULT_GAME_IMAGES: Record<string, string> = {
  "mobile-legends": "/joki-default/mobile-legends.png",
  valorant: "/joki-default/valorant.png",
  pubg: "/joki-default/pubg.png",
  efootball: "/joki-default/efootball.png",
};

const GAME_PUBLISHER: Record<string, string> = {
  "mobile-legends": "Moonton",
};

/* Non-Mobile Legends packages are intentionally unavailable until their dynamic catalog is added.
const OTHER_GAME_PRODUCTS: Record<string, JokiProduct[]> = {
  valorant: [],
  pubg: [
    { id: "pubg-100-bronze", group: "Per 100 Point", name: "Bronze", price: 5000, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-silver", group: "Per 100 Point", name: "Silver", price: 10000, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-gold", group: "Per 100 Point", name: "Gold", price: 20000, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-platinum", group: "Per 100 Point", name: "Platinum", price: 31500, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-diamond", group: "Per 100 Point", name: "Diamond", price: 42000, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-crown", group: "Per 100 Point", name: "Crown", price: 82400, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-ace", group: "Per 100 Point", name: "Ace", price: 104000, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-ace-master", group: "Per 100 Point", name: "Ace Master", price: 113300, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-100-ace-dominator", group: "Per 100 Point", name: "Ace Dominator", price: 123600, estimate: "6–24 jam", image: "/joki-default/pubg.png" },
    { id: "pubg-crown-ace", group: "Joki Rank Ace", name: "Crown → Ace", price: 105000, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-diamond-ace", group: "Joki Rank Ace", name: "Diamond → Ace", price: 175100, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-ace-master", group: "Joki Rank Ace", name: "Ace → Ace Master", price: 175100, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-platinum-ace", group: "Joki Rank Ace", name: "Platinum → Ace", price: 216300, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-master-dominator", group: "Joki Rank Ace", name: "Ace Master → Ace Dominator", price: 226600, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-gold-ace", group: "Joki Rank Ace", name: "Gold → Ace", price: 247200, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-silver-ace", group: "Joki Rank Ace", name: "Silver → Ace", price: 267800, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
    { id: "pubg-bronze-ace", group: "Joki Rank Ace", name: "Bronze → Ace", price: 283250, estimate: "1–5 hari", image: "/joki-default/pubg.png" },
  ],
  efootball: [
    { id: "ef-div10-9", group: "Push Per Divisi", name: "Division 10 → 9", price: 10000, estimate: "6–12 jam", image: "/joki-default/efootball.png" },
    { id: "ef-div9-8", group: "Push Per Divisi", name: "Division 9 → 8", price: 10000, estimate: "6–12 jam", image: "/joki-default/efootball.png" },
    { id: "ef-div8-7", group: "Push Per Divisi", name: "Division 8 → 7", price: 10000, estimate: "6–12 jam", image: "/joki-default/efootball.png" },
    { id: "ef-div7-6", group: "Push Per Divisi", name: "Division 7 → 6", price: 10000, estimate: "6–12 jam", image: "/joki-default/efootball.png" },
    { id: "ef-div6-5", group: "Push Per Divisi", name: "Division 6 → 5", price: 10000, estimate: "6–12 jam", image: "/joki-default/efootball.png" },
    { id: "ef-div5-4", group: "Push Per Divisi", name: "Division 5 → 4", price: 25000, estimate: "1 hari", image: "/joki-default/efootball.png" },
    { id: "ef-div4-3", group: "Push Per Divisi", name: "Division 4 → 3", price: 30000, estimate: "1 hari", image: "/joki-default/efootball.png" },
    { id: "ef-div3-2", group: "Push Per Divisi", name: "Division 3 → 2", price: 45000, estimate: "1–2 hari", image: "/joki-default/efootball.png" },
    { id: "ef-div2-1", group: "Push Per Divisi", name: "Division 2 → 1", price: 70000, estimate: "1–2 hari", image: "/joki-default/efootball.png" },
  ],
};
*/

const TERMS = [
  "Data Akun: Lengkapi data dengan benar, termasuk kapitalisasi huruf.",
  "Pilihan Hero: Minimal tiga pilihan hero sebagai alternatif jika hero sedang di-pick atau di-ban.",
  "Verifikasi Akun: Nonaktifkan sementara untuk mempermudah login.",
  "Tipe Akun: Utamakan akun utama, bukan akun beli atau bekas GB untuk menghindari ban.",
  "Dilarang login tanpa izin karena dapat menyebabkan pembatalan joki dan pembayaran hangus.",
  "Tunggu sesuai estimasi dan jangan mengirim pesan berulang kepada admin.",
  "Admin akan menghubungi jika terjadi kendala saat login.",
  "Hubungi kami jika pesanan belum diproses dalam 1–3 jam.",
  "Jangan login sebelum laporan selesai dikirim agar benefit bonus tetap berlaku.",
  "Tanggung jawab atas akun berakhir setelah proses joki dinyatakan selesai.",
  "Status selesai akan dikirim oleh admin dan dapat diperiksa melalui Cek Pesanan.",
];

const LOGIN_METHODS = [
  { name: "Moonton", icon: "/icon/moonton.png" },
  { name: "VK", icon: "/icon/vk.webp" },
  { name: "TikTok", icon: "/icon/tiktok.png" },
  { name: "Facebook", icon: "/icon/facebook.webp" },
];

const GROUP_META: Record<string, { icon: string; description: string }> = {
  "Promo Joki Bonus Bintang": {
    icon: "/rank-calculator/epic.png",
    description: "Pilihan promo joki bonus bintang",
  },
  "Joki Per Bintang": {
    icon: "/rank-calculator/master.png",
    description: "Hitungan per bintang praktis & fleksibel",
  },
  "Paket Naik Rank": {
    icon: "/rank-calculator/grandmaster.png",
    description: "Paket borongan tier rank kilat & hemat",
  },
  "Per 100 Point": {
    icon: "/joki-default/pubg.png",
    description: "Harga push untuk setiap 100 rank point",
  },
  "Joki Rank Ace": {
    icon: "/joki-default/pubg.png",
    description: "Paket push rank hingga tier Ace",
  },
  "Push Per Divisi": {
    icon: "/joki-default/efootball.png",
    description: "Harga push untuk setiap kenaikan satu divisi",
  },
};

export function JokiTab({ gameSlug }: { gameSlug?: string }) {
  const db = useDB();
  const fallbackGame = {
    id: "g-mlbb",
    slug: "mobile-legends",
    name: "Mobile Legends",
    description: "Layanan joki rank dan bintang Mobile Legends.",
    listImage: DEFAULT_GAME_IMAGES["mobile-legends"],
    coverImage: DEFAULT_GAME_IMAGES["mobile-legends"],
  };
  const game = db.games.find((item) => item.slug === gameSlug)
    ?? db.games.find((item) => item.slug === "mobile-legends")
    ?? fallbackGame;
  const gameImage = game.listImage || DEFAULT_GAME_IMAGES[game.slug] || DEFAULT_GAME_IMAGES["mobile-legends"];
  const gameCover = game.coverImage || gameImage;
  const jokiGames = db.games.filter((item) => item.status === "active" && item.slug === "mobile-legends");
  const products: JokiProduct[] = game.slug === "mobile-legends"
    ? db.jokiPackages
        .filter((item) => item.gameSlug === "mobile-legends" && item.status === "active")
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const loginMethods = game.slug === "mobile-legends"
    ? LOGIN_METHODS
    : [{ name: `${game.name} ID`, icon: gameImage }];
  const [productId, setProductId] = useState("");
  const [starCounts, setStarCounts] = useState<Record<string, number>>({});
  const [loginMethod, setLoginMethod] = useState(loginMethods[0]?.name ?? "Login Akun");
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [heroes, setHeroes] = useState("");
  const [paymentId, setPaymentId] = useState<PakasirMethod>("qris");
  const [whatsapp, setWhatsapp] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [note, setNote] = useState("");
  const [creatingPayment, setCreatingPayment] = useState(false);

  const selectedProduct = products.find((item) => item.id === productId);
  const groups = [...new Set(products.map((item) => item.group))];
  const starProducts = products.filter((item) => item.perStar);
  const [activeGroup, setActiveGroup] = useState("");
  const currentGroup = groups.includes(activeGroup) ? activeGroup : (groups[0] ?? "");
  const activeProducts = products.filter((item) => item.group === currentGroup);
  useEffect(() => {
    if (selectedProduct) {
      setActiveGroup(selectedProduct.group);
    }
  }, [selectedProduct]);
  useEffect(() => {
    if (selectedProduct?.perStar) {
      setStarCounts((prev) => {
        // Beri nilai awal 5 bintang pada rank yang dipilih jika semuanya masih 0.
        const hasAny = starProducts.some((item) => (prev[item.id] ?? 0) > 0);
        if (hasAny) return prev;
        return { ...prev, [selectedProduct.id]: 5 };
      });
    }
  }, [selectedProduct]);
  const adjustStars = (id: string, delta: number) =>
    setStarCounts((prev) => {
      const next = Math.min(100, Math.max(0, (prev[id] ?? 0) + delta));
      return { ...prev, [id]: next };
    });
  const selectedStars =
    selectedProduct?.perStar ? (starCounts[selectedProduct.id] ?? 0) : 0;
  const paymentMethods = ACTIVE_PAKASIR_PAYMENT_METHODS;
  const selectedPayment = paymentMethods.find((item) => item.id === paymentId);
  const subtotal = !selectedProduct
    ? 0
    : selectedProduct.perStar
      ? selectedProduct.price * selectedStars
      : selectedProduct.price;
  const couponQuote = useMemo(
    () => quoteCoupon(db.coupons, couponCode, subtotal),
    [couponCode, db.coupons, subtotal],
  );
  const discount = couponQuote.discount;
  const paymentFee = 0;
  const total = Math.max(0, subtotal - discount + paymentFee);
  const canSubmit = !!selectedProduct
    && accountId.trim().length > 0
    && password.trim().length > 0
    && whatsapp.trim().length >= 8
    && (!selectedProduct.perStar || selectedStars > 0);

  if (!gameSlug) {
    return (
      <section className="mb-8">
        <div className="mb-5">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#9a7500]">Daftar Game Joki</p>
          <div className="mt-1 flex items-center gap-2.5">
            <h2 className="text-xl font-black text-[#172033] sm:text-2xl">Joki Populer</h2>
            <img src="/icon/fire.gif" alt="" className="h-8 w-8 object-contain" />
          </div>
          <p className="mt-1 text-sm text-[#68758b]">Pilih game untuk melihat paket joki.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-4">
          {jokiGames.map((item) => {
            const cardClassName = "joki-game-card group relative aspect-[416/600] bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7aa00]";
            const cardImage = <img src={item.listImage || DEFAULT_GAME_IMAGES[item.slug]} alt={item.name} className="joki-game-card-visual h-full w-full object-cover" />;

            if (item.id === "g-pubgm" || item.slug === "pubg" || item.slug === "pubg-mobile") {
              return (
                <a key={item.id} href="/joki/pubg" aria-label="Pilih Joki PUBG Mobile" className={cardClassName}>
                  {cardImage}
                </a>
              );
            }

            return (
              <Link
                key={item.slug}
                to="/joki/$slug"
                params={{ slug: item.slug }}
                aria-label={`Pilih Joki ${item.name}`}
                className={cardClassName}
              >
                {cardImage}
              </Link>
            );
          })}
        </div>
      </section>
    );
  }

  const submit = async () => {
    if (db.settings.maintenance) {
      toast.error("Toko sedang dalam pemeliharaan. Transaksi baru sementara ditutup.");
      return;
    }
    if (!selectedProduct || !paymentId || !accountId.trim() || !password.trim() || whatsapp.trim().length < 8) {
      toast.error("Lengkapi layanan, data akun, pembayaran, dan nomor WhatsApp.");
      return;
    }
    if (selectedProduct.perStar && selectedStars === 0) {
      toast.error("Atur jumlah bintang dulu dengan tombol minus/plus.");
      return;
    }
    if (couponCode.trim() && couponQuote.error) {
      toast.error(couponQuote.error);
      return;
    }
    setCreatingPayment(true);
    try {
      const payment = await createPakasirPayment({
        order_type: "joki",
        item_id: selectedProduct.id,
        description: `Joki ${game.name} - ${selectedProduct.name}`,
        amount: subtotal,
        coupon_code: couponQuote.coupon?.code,
        payment_method: paymentId,
        customer: {
          whatsapp: whatsapp.trim(),
          account_id: accountId.trim(),
          password,
          login_method: loginMethod,
          nickname: nickname.trim() || undefined,
          heroes: heroes.trim() || undefined,
          note: note.trim() || undefined,
          quantity: selectedProduct.perStar ? selectedStars : 1,
          customer_name: nickname.trim() || undefined,
          game_id: game.id,
          game_name: game.name,
        },
      });
      recordPakasirOrder({
        orderId: payment.order_id,
        transactionId: payment.txn_id,
        amount: payment.total_payment ?? total,
        baseAmount: payment.base_amount ?? subtotal,
        discount: payment.discount ?? discount,
        couponCode: payment.coupon_code ?? undefined,
        method: payment.payment_method,
        game: { id: game.id, name: game.name },
        service: { id: selectedProduct.id, name: `Joki ${selectedProduct.name}` },
        customer: { name: nickname.trim() || "Pelanggan", phone: whatsapp.trim() },
        gameUserId: accountId.trim(),
        quantity: selectedProduct.perStar ? selectedStars : 1,
        note: note.trim() || undefined,
      });
      window.location.assign(`/invoice/${encodeURIComponent(payment.order_id)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pembayaran gagal dibuat.");
      setCreatingPayment(false);
    }
  };

  return (
    <section className="mb-4 sm:mb-8">
      <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#68758b] sm:text-sm">
        <Link to="/" className="transition hover:text-[#8a6800]">Beranda</Link>
        <span aria-hidden="true">›</span>
        <Link to="/joki" className="transition hover:text-[#8a6800]">Joki Game</Link>
        <span aria-hidden="true">›</span>
        <span className="max-w-full truncate font-bold text-[#202738]">Joki {game.name}</span>
      </nav>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#ecd46e] bg-[#101827] p-4 shadow-[0_18px_45px_-32px_rgba(104,76,0,.45)] sm:mt-4 sm:rounded-[2rem] sm:p-7">
        <img src={gameCover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-black/45" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <img
            src={gameImage}
            alt={game.name}
            className="aspect-[3/4] w-14 shrink-0 rounded-lg bg-transparent object-contain sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <p className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#ffd84d] px-2 py-0.5 text-[10px] font-black text-[#17191d] sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[11px]">
              <Trophy className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> <span className="truncate">Joki Game oleh {GAME_PUBLISHER[game.slug] ?? "BotakStore"}</span>
            </p>
            <h1 className="mt-1 truncate text-lg font-black tracking-tight text-white drop-shadow sm:mt-2 sm:text-3xl">
              Joki {game.name}
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
          <span className="min-w-0"><span className="text-[10px] font-black uppercase tracking-wider text-[#9a7500] sm:text-xs">Wajib Dibaca</span><strong className="mt-0.5 block truncate text-[15px] text-[#172033] sm:text-lg">Syarat Ketentuan Joki</strong></span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ffd84d] px-3 py-2 text-[11px] font-black text-[#17191d] transition hover:bg-[#ffca24] sm:gap-2 sm:px-4 sm:text-xs">
            <ShieldCheck className="h-4 w-4" />
            <span>Ketentuan</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-[#efe4b0] px-4 py-4 sm:px-7 sm:py-5">
          <p className="text-xs text-[#68758b] sm:text-sm">Pahami {TERMS.length} ketentuan berikut demi kenyamanan dan keamanan akun.</p>
          <ol className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-2.5 md:gap-3">
            {TERMS.map((term, index) => (
              <li key={term} className="flex flex-row items-start gap-2.5 rounded-xl bg-[#fffbed] p-3 text-xs leading-5 text-[#4f5968] sm:gap-3 sm:rounded-2xl sm:text-sm sm:leading-6">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-[11px] font-black text-[#17191d] sm:h-7 sm:w-7 sm:text-xs">{index + 1}</span>
                <span className="min-w-0 flex-1">{term}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>

      <div className="mt-4 grid grid-cols-1 gap-4 pb-28 sm:space-y-0 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:gap-8 lg:pb-0">
        <div className="min-w-0 space-y-4 sm:space-y-6">
          <JokiStep number="1" title="Pilih Layanan" description="Pilih rank atau paket joki yang kamu mau.">
            <p className="text-xs text-[#8490a3]">{products.length} layanan ditemukan</p>
            <div className="mt-4">
              <div className="relative">
                <div className="overflow-x-auto pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex min-w-max gap-2">
                  {groups.map((group) => {
                    const meta = GROUP_META[group];
                    const groupProducts = products.filter((item) => item.group === group);
                    const count = groupProducts.length;
                    const active = currentGroup === group;
                    return (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setActiveGroup(group)}
                        aria-pressed={active}
                        className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-black transition sm:h-10 sm:gap-2 sm:px-3 sm:text-xs ${active ? "border-[#d7aa00] bg-[#ffd84d] text-[#17191d] shadow-sm" : "border-[#dce3ec] bg-white text-[#596579] hover:border-[#e4bd22]"}`}
                      >
                        <img src={meta?.icon ?? groupProducts[0]?.image} alt="" loading="lazy" className="h-5 w-5 shrink-0 object-contain" />
                        <span className="whitespace-nowrap">{group}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-white/70" : "bg-[#f1f5f9]"}`}>{count}</span>
                      </button>
                    );
                  })}
                  </div>
                </div>
                {groups.length > 1 && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex w-14 items-center justify-end bg-gradient-to-l from-white via-white/95 to-transparent sm:hidden">
                    <span className="joki-scroll-cue grid h-7 w-7 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d] shadow-[0_5px_12px_-7px_rgba(138,104,0,.75)]">
                      <ChevronRight className="h-4 w-4" strokeWidth={3} />
                    </span>
                  </div>
                )}
              </div>
              <div className={`${activeProducts.length ? "" : "hidden"} mt-3 rounded-2xl border border-[#dce3ec] bg-[#fffdf5] p-2 sm:p-4`}>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-3">
                  {activeProducts.map((item) => {
                    const active = item.id === productId;
                    return (
                      <button key={item.id} type="button" onClick={() => setProductId(item.id)} aria-pressed={active} title={item.name} className={`relative rounded-xl border p-2 text-center transition sm:rounded-2xl sm:p-3 ${active ? "border-[#d7aa00] bg-[#fff8df] shadow-[0_12px_25px_-18px_rgba(215,170,0,.7)]" : "border-[#dce3ec] bg-white hover:-translate-y-0.5 hover:border-[#e4bd22]"}`}>
                        {active && <span className="absolute -left-1.5 -top-1.5 z-10 grid h-5 w-5 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d] sm:-left-2 sm:-top-2 sm:h-7 sm:w-7"><Check className="h-3 w-3 sm:h-4 sm:w-4" /></span>}
                        {item.badge && <span className="absolute right-1.5 top-1.5 max-w-[45%] truncate rounded-full bg-[#ffd84d] px-1.5 py-0.5 text-[7px] font-black uppercase text-[#17191d] sm:right-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[8px]">{item.badge}</span>}
                        <img src={item.image} alt="" loading="lazy" className="mx-auto h-10 w-10 object-contain sm:h-16 sm:w-16" />
                        <span className="mt-1.5 block min-h-6 text-[10px] font-black leading-3 text-[#202738] sm:mt-2 sm:min-h-8 sm:text-xs sm:leading-4"><span className="line-clamp-2">{item.name}</span></span>
                        <span className="mt-1 block truncate text-xs font-black tabular-nums text-[#8a6800] sm:mt-2 sm:text-sm">{rupiah(item.price)}{item.perStar ? " /bintang" : ""}</span>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-[#718096]"><Clock3 className="h-3 w-3 shrink-0" /> <span className="truncate">{item.estimate}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {activeProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dce3ec] bg-[#f8fafc] p-4 text-center sm:p-6">
                  <p className="font-black text-[#202738]">{products.length === 0 ? "Paket Belum Tersedia" : "Produk Tidak Ditemukan"}</p>
                  <p className="mt-1 text-xs text-[#68758b]">
                    {products.length === 0
                      ? `Layanan joki ${game.name} akan segera tersedia.`
                      : "Belum ada produk pada kategori ini."}
                  </p>
                </div>
              )}
            </div>
          </JokiStep>

          {selectedProduct?.perStar && (
            <JokiStep number="★" title="Jumlah Bintang per Rank" description="Khusus joki per bintang — atur dengan tombol minus/plus.">
              {(() => {
                const item = selectedProduct;
                const count = starCounts[item.id] ?? 0;
                return (
                  <>
                    <div
                      className={`flex items-center gap-3 rounded-2xl border p-3 transition ${count > 0 ? "border-[#d7aa00] bg-[#fff8df]" : "border-[#dce3ec] bg-white"}`}
                    >
                      <img src={item.image} alt="" loading="lazy" className="h-10 w-10 shrink-0 object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-[#202738]">{item.name}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#8a6800]">
                          {rupiah(item.price)} /bintang
                          {count > 0 && <span className="text-[#68758b]"> · {rupiah(item.price * count)}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustStars(item.id, -1)}
                          disabled={count === 0}
                          aria-label={`Kurangi bintang ${item.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#dce3ec] bg-white text-[#68758b] transition hover:border-[#e4bd22] hover:text-[#8a6800] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span aria-live="polite" className="w-7 text-center text-base font-black tabular-nums text-[#202738] sm:w-8">{count}</span>
                        <button
                          type="button"
                          onClick={() => adjustStars(item.id, 1)}
                          disabled={count >= 100}
                          aria-label={`Tambah bintang ${item.name}`}
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d] transition hover:bg-[#f2c425] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#ecd46e] bg-[#fffbed] px-4 py-3">
                      <span className="text-sm font-black text-[#202738]">Total Bintang</span>
                      <span className="text-right">
                        <span className="block text-lg font-black leading-tight text-[#8a6800]">{count} bintang</span>
                        <span className="block text-xs font-bold text-[#68758b]">{rupiah(item.price * count)}</span>
                      </span>
                    </div>
                  </>
                );
              })()}
            </JokiStep>
          )}

          <JokiStep number="2" title="Data Akun Game" description={`Masukkan data akun ${game.name} untuk login penjoki.`}>
            <Field label="Login Melalui *">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {loginMethods.map((method) => (
                  <button
                    key={method.name}
                    type="button"
                    aria-label={method.name}
                    title={method.name}
                    onClick={() => setLoginMethod(method.name)}
                    className={`flex h-12 items-center justify-start gap-2 rounded-xl border px-2.5 transition sm:h-14 sm:gap-3 sm:px-3 ${
                      loginMethod === method.name
                        ? "border-[#d7aa00] bg-[#fff8df] text-[#8a6800]"
                        : "border-[#dce3ec] bg-white text-[#526176]"
                    }`}
                  >
                    <span className="flex h-8 w-10 shrink-0 items-center justify-center sm:h-10 sm:w-12">
                      <img
                        src={method.icon}
                        alt={method.name}
                        loading="lazy"
                        className="max-h-8 max-w-full rounded-md object-contain"
                      />
                    </span>
                    <span className="truncate text-xs font-black sm:text-sm">{method.name}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Field label="Email / No HP / ID Akun *" hint="Email atau username akun yang dipakai login."><Input value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder={`Masukkan ID akun ${game.name}`} className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm" /></Field>
              <Field label="Password Akun *" hint="Password otomatis dienkripsi."><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`Masukkan password akun ${game.name}`} className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm" /></Field>
              <Field label="Nickname Game (opsional)" hint="Untuk pencocokan saat penjoki login."><Input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Contoh: RRQ Lemon / BotakPro" className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm" /></Field>
              <Field label="Request permainan (opsional)" hint="Tuliskan request khusus untuk penjoki."><Input value={heroes} onChange={(event) => setHeroes(event.target.value)} placeholder="Contoh: karakter, mode, atau strategi pilihan" className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm" /></Field>
            </div>
            <div className="mt-4 rounded-2xl border border-[#ecd46e] bg-[#fffbed] p-3 sm:mt-5 sm:p-4">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#ffd84d] text-[#17191d] sm:h-9 sm:w-9">
                  <LockKeyhole className="h-4 w-4" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-black leading-4 text-[#715700] sm:text-sm sm:leading-5">Data Login Terenkripsi &amp; Dijamin Aman</p>
                  <p className="mt-1 text-[11px] leading-4 text-[#68758b] sm:text-xs sm:leading-5">Data akun dan password disimpan secara rahasia dan hanya dipakai penjoki resmi saat memproses pesanan.</p>
                </div>
              </div>
            </div>
          </JokiStep>

          <JokiStep number="3" title="Pembayaran" description="Harga di tiap metode sudah termasuk biaya admin.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
              {paymentMethods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={!selectedProduct}
                  onClick={() => setPaymentId(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 sm:gap-3 sm:rounded-2xl sm:p-3 ${paymentId === item.id ? "border-[#d7aa00] bg-[#fff8df]" : "border-[#dce3ec] bg-white hover:border-[#e4bd22]"}`}
                >
                  <span className="grid h-9 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#e5eaf0] bg-white sm:h-10 sm:w-16 sm:rounded-xl">
                    {item.icon.startsWith("/") ? (
                      <img src={item.icon} alt={item.name} loading="lazy" className="h-full w-full object-contain p-1" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center rounded-lg bg-[#17191d] text-[10px] font-black leading-tight text-[#ffd84d] sm:rounded-xl sm:text-[11px]">{item.icon}</span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[13px] font-black leading-tight text-[#202738] sm:text-sm">{item.name}</strong>
                    <span className="hidden text-[11px] leading-snug text-[#718096] sm:block">{!selectedProduct ? "Pilih layanan dulu" : item.description}</span>
                  </span>
                  {paymentId === item.id && (
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d]">
                      <Check className="h-3 w-3 text-[#17191d]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#ecd46e] bg-[#fffbed] px-3 py-2.5 text-xs leading-5 text-[#715700]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span><strong className="font-black">Mode uji coba pembayaran.</strong> Pembayaran belum diproses secara riil.</span>
              </div>
          </JokiStep>

          <JokiStep number="4" title="Voucher" description="Masukkan kode promo jika kamu punya.">
            <Field label="Kode voucher">
              <Input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="Contoh: PROMO26"
                className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] font-black uppercase text-base sm:h-12 sm:text-sm"
              />
            </Field>
            {couponCode.trim() && (
              <p className={`mt-2 text-xs font-bold ${couponQuote.error ? "text-red-600" : "text-emerald-700"}`}>
                {couponQuote.error ?? `Voucher ${couponQuote.coupon?.code} digunakan: hemat ${rupiah(discount)}.`}
              </p>
            )}
          </JokiStep>

          <JokiStep number="5" title="Kontak WhatsApp & Catatan" description="Nomor WhatsApp untuk update status dan catatan tambahan.">
            <Field label="Nomor WhatsApp *" hint="Nomor ini dipakai untuk mengirim update progres pengerjaan joki."><Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="0812 3456 7890" inputMode="tel" className="h-11 rounded-2xl border-[#dce3ec] bg-[#f8fafc] text-base sm:h-12 sm:text-sm" /></Field>
            <label className="mt-4 block"><span className="text-xs font-black text-[#202738] sm:text-sm">Catatan Tambahan untuk Penjoki (opsional)</span><textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-[#dce3ec] bg-[#f8fafc] px-4 py-3 text-base outline-none focus:border-[#d7aa00] focus:ring-2 focus:ring-[#ffd84d]/30 sm:text-sm" /><span className="mt-1 block text-right text-xs text-[#8490a3]">{note.length}/300</span></label>
          </JokiStep>
        </div>

        {/* Sidebar — desktop only */}
        <aside className="hidden overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_18px_45px_-30px_rgba(104,76,0,.35)] lg:block lg:sticky lg:top-36">
          <div className="flex items-center gap-2 border-b border-[#ecd46e] bg-[#fff5c7] px-5 py-4"><Wallet className="h-5 w-5 text-[#8a6800]" /><h2 className="font-black text-[#202738]">Ringkasan Pesanan</h2></div>
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ece5c7] bg-[#fffdf5] p-3"><img src={gameImage} alt="" className="h-12 w-12 object-contain" /><div><p className="text-sm font-black">Joki {game.name}</p><p className="mt-0.5 text-xs text-[#7b8798]">{selectedProduct?.name ?? "Belum pilih layanan"}</p></div></div>
            {selectedProduct?.perStar && (
              <>
                <SummaryRow
                  label={`${selectedProduct.name} × ${selectedStars}`}
                  value={rupiah(selectedProduct.price * selectedStars)}
                />
                <SummaryRow label="Total bintang" value={`${selectedStars} bintang`} />
              </>
            )}
            <SummaryRow label="Pembayaran" value={selectedPayment?.name ?? "Belum dipilih"} />
            <SummaryRow label="Subtotal" value={rupiah(subtotal)} />
            {discount > 0 && <SummaryRow label={`Diskon (${couponQuote.coupon?.code})`} value={`-${rupiah(discount)}`} />}
            <SummaryRow label="Biaya admin" value={selectedPayment ? rupiah(paymentFee) : "—"} />
            <div className="mt-4 flex items-center justify-between border-t border-[#e5eaf0] pt-4"><span className="font-black">Total Bayar</span><span className="text-xl font-black text-[#8a6800]">{rupiah(total)}</span></div>
            <Button type="button" size="lg" onClick={submit} disabled={creatingPayment || db.settings.maintenance} className="mt-5 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]">{creatingPayment ? <LoaderCircle className="animate-spin" /> : <Trophy />}{creatingPayment ? "Membuat invoice..." : "Pesan Joki Sekarang"}</Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#718096]"><ShieldCheck className="h-4 w-4" /> Akun 100% aman</p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-[58px] z-40 border-t border-[#ecd46e] bg-white/95 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_28px_-12px_rgba(104,76,0,.25)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] leading-tight text-[#718096]">{selectedProduct?.name ?? "Belum pilih layanan"}</p>
            <p className="truncate text-base font-black tabular-nums text-[#101827]">{rupiah(total)}</p>
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={creatingPayment || !canSubmit || db.settings.maintenance}
            className="h-10 shrink-0 bg-[#ffd84d] px-4 text-sm font-black text-[#17191d] hover:bg-[#f2c425] disabled:opacity-50"
          >
            {creatingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
            {creatingPayment ? "Memproses..." : "Pesan Joki"}
          </Button>
        </div>
      </div>
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

function JokiStep({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-3.5 shadow-[0_18px_45px_-36px_rgba(31,42,61,.35)] sm:rounded-3xl sm:p-7">
      <header className="-mx-3.5 -mt-3.5 mb-3.5 flex items-center gap-2.5 border-b border-dashed border-[#e4e7ec] px-3.5 py-3 sm:-mx-7 sm:-mt-7 sm:mb-5 sm:gap-3 sm:px-7 sm:py-5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-sm font-black text-[#17191d] shadow-[0_6px_16px_-12px_rgba(138,104,0,.7)] sm:h-10 sm:w-10 sm:text-base">{number}</span>
        <div className="min-w-0 flex-1"><h2 className="text-[15px] font-black leading-tight text-[#101827] sm:text-xl">{title}</h2><p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[#68758b] sm:text-sm">{description}</p></div>
      </header>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="mt-3 flex items-start justify-between gap-4 text-sm"><span className="text-[#718096]">{label}</span><span className="text-right font-bold text-[#202738]">{value}</span></div>;
}
