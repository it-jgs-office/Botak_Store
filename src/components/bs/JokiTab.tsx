import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  Clock3,
  LockKeyhole,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rupiah } from "@/lib/format";
import { TOPUP_PAYMENTS } from "@/lib/topup-mock";
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

const JOKI_PRODUCTS: JokiProduct[] = [
  { id: "bonus-epic", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Epic + Bonus 1 Star", price: 60000, estimate: "12 jam", image: "/rank-calculator/epic.png", badge: "Bonus 1 Star" },
  { id: "bonus-legend", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Legend + Bonus 1 Star", price: 70000, estimate: "14 jam", image: "/rank-calculator/legend.png", badge: "Bonus 1 Star" },
  { id: "bonus-mythic", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Mythic + Bonus 1 Star", price: 175000, estimate: "1 hari", image: "/rank-calculator/mythical-romawi.png", badge: "Bonus 1 Star" },
  { id: "bonus-honor", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Honor + Bonus 1 Star", price: 195000, estimate: "1 hari", image: "/rank-calculator/mythical-honor.png", badge: "Bonus 1 Star" },
  { id: "bonus-glory", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Glory + Bonus 1 Star", price: 240000, estimate: "2 hari", image: "/rank-calculator/mythical-glory.png", badge: "Bonus 1 Star" },
  { id: "bonus-immortal", group: "Promo Joki Bonus Bintang", name: "Paket 10 Star Immortal + Bonus 1 Star", price: 265000, estimate: "2 hari", image: "/rank-calculator/mythical-immortal.png", badge: "Bonus 1 Star" },
  { id: "star-master", group: "Joki Per Bintang", name: "Joki Master", price: 4000, estimate: "6 jam", image: "/rank-calculator/master.png", perStar: true },
  { id: "star-grandmaster", group: "Joki Per Bintang", name: "Joki Grandmaster", price: 5000, estimate: "6 jam", image: "/rank-calculator/grandmaster.png", perStar: true },
  { id: "star-epic", group: "Joki Per Bintang", name: "Joki Epic", price: 7000, estimate: "8 jam", image: "/rank-calculator/epic.png", badge: "Best Seller", perStar: true },
  { id: "star-legend", group: "Joki Per Bintang", name: "Joki Legend", price: 8000, estimate: "8 jam", image: "/rank-calculator/legend.png", badge: "Laris", perStar: true },
  { id: "star-mythic", group: "Joki Per Bintang", name: "Joki Mythic", price: 19000, estimate: "10 jam", image: "/rank-calculator/mythical-romawi.png", perStar: true },
  { id: "star-honor", group: "Joki Per Bintang", name: "Joki Mythical Honor", price: 21000, estimate: "12 jam", image: "/rank-calculator/mythical-honor.png", perStar: true },
  { id: "star-glory", group: "Joki Per Bintang", name: "Joki Mythical Glory", price: 25000, estimate: "16 jam", image: "/rank-calculator/mythical-glory.png", perStar: true },
  { id: "star-immortal", group: "Joki Per Bintang", name: "Joki Mythical Immortal", price: 28000, estimate: "20 jam", image: "/rank-calculator/mythical-immortal.png", perStar: true },
  { id: "rank-gm-epic", group: "Paket Naik Rank", name: "Grandmaster I → Epic V", price: 45000, estimate: "8 jam", image: "/rank-calculator/grandmaster.png", badge: "Best Seller" },
  { id: "rank-gm5-epic", group: "Paket Naik Rank", name: "Paket GM V → Epic V", price: 125000, estimate: "1 hari", image: "/rank-calculator/grandmaster.png" },
  { id: "rank-epic-legend", group: "Paket Naik Rank", name: "Paket Epic V → Legend V", price: 175000, estimate: "1 hari", image: "/rank-calculator/epic.png", badge: "Best Seller" },
  { id: "rank-grading", group: "Paket Naik Rank", name: "Mythic Full Grading (15 Bintang)", price: 189000, estimate: "12 jam", image: "/rank-calculator/mythical-romawi.png" },
  { id: "rank-legend-mythic", group: "Paket Naik Rank", name: "Paket Legend V → Mythic", price: 200000, estimate: "2 hari", image: "/rank-calculator/legend.png", badge: "Laris" },
  { id: "rank-mythic-honor", group: "Paket Naik Rank", name: "Mythic → Mythical Honor", price: 300000, estimate: "2 hari", image: "/rank-calculator/mythical-romawi.png" },
  { id: "rank-honor-glory", group: "Paket Naik Rank", name: "Mythical Honor → Mythical Glory", price: 550000, estimate: "3 hari", image: "/rank-calculator/mythical-honor.png" },
];

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

const STAR_PRODUCTS = JOKI_PRODUCTS.filter((item) => item.perStar);

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
};

export function JokiTab({ gameSlug }: { gameSlug?: string }) {
  const [productId, setProductId] = useState("");
  const [query, setQuery] = useState("");
  const [starCounts, setStarCounts] = useState<Record<string, number>>({});
  const [loginMethod, setLoginMethod] = useState("Moonton");
  const [accountId, setAccountId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [heroes, setHeroes] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [note, setNote] = useState("");

  const selectedProduct = JOKI_PRODUCTS.find((item) => item.id === productId);
  const visibleProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return keyword
      ? JOKI_PRODUCTS.filter((item) => item.name.toLowerCase().includes(keyword))
      : JOKI_PRODUCTS;
  }, [query]);
  const groups = [...new Set(JOKI_PRODUCTS.map((item) => item.group))];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (group: string) =>
    setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  const isGroupOpen = (group: string) => {
    // Saat pencarian aktif, otomatis buka grup yang punya hasil cocok.
    if (query.trim()) return visibleProducts.some((item) => item.group === group);
    return !!openGroups[group];
  };
  useEffect(() => {
    if (selectedProduct) {
      setOpenGroups((prev) =>
        prev[selectedProduct.group] ? prev : { ...prev, [selectedProduct.group]: true },
      );
    }
  }, [selectedProduct]);
  useEffect(() => {
    if (selectedProduct?.perStar) {
      setStarCounts((prev) => {
        // Beri nilai awal 5 bintang pada rank yang dipilih jika semuanya masih 0.
        const hasAny = STAR_PRODUCTS.some((item) => (prev[item.id] ?? 0) > 0);
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
  const paymentMethods = TOPUP_PAYMENTS.filter((item) => item.id === "qris" || item.id === "nobu-va");
  const selectedPayment = paymentMethods.find((item) => item.id === paymentId);
  const subtotal = !selectedProduct
    ? 0
    : selectedProduct.perStar
      ? selectedProduct.price * selectedStars
      : selectedProduct.price;
  const paymentFee = !selectedPayment
    ? 0
    : selectedPayment.id === "qris"
      ? Math.round(subtotal * 0.02)
      : 5000;
  const total = subtotal + paymentFee;

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
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
          <Link
            to="/joki/$slug"
            params={{ slug: "mobile-legends" }}
            aria-label="Pilih Joki Mobile Legends"
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-[#ecd46e] bg-[#101827] shadow-[0_14px_35px_-26px_rgba(104,76,0,.65)] transition hover:-translate-y-1 hover:border-[#d7aa00] hover:shadow-[0_18px_35px_-22px_rgba(215,170,0,.65)]"
          >
            <img src="/rank-calculator/background.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101827] via-[#101827]/20 to-transparent" />
            <img src="/rank-calculator/mythical-glory.png" alt="" className="absolute left-1/2 top-[38%] h-16 w-16 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-xl sm:h-24 sm:w-24" />
            <div className="absolute inset-x-0 bottom-0 p-2.5 text-white sm:p-4">
              <p className="text-[10px] font-bold text-[#ffe785] sm:text-xs">Default</p>
              <h3 className="mt-1 text-xs font-black leading-tight sm:text-base">Mobile Legends</h3>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  const submit = () => {
    if (!selectedProduct || !paymentId || !accountId.trim() || !password.trim() || whatsapp.trim().length < 8) {
      toast.error("Lengkapi layanan, data akun, pembayaran, dan nomor WhatsApp.");
      return;
    }
    if (selectedProduct.perStar && selectedStars === 0) {
      toast.error("Atur jumlah bintang dulu dengan tombol minus/plus.");
      return;
    }
    toast.success("Pesanan joki siap diproses.", {
      description: selectedProduct.perStar
        ? `${selectedStars} bintang · ${rupiah(total)}`
        : `${selectedProduct.name} · ${rupiah(total)}`,
    });
  };

  return (
    <section className="mb-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[#68758b]">
        <a href="/" className="transition hover:text-[#8a6800]">Beranda</a>
        <span>›</span>
        <a href="/#joki" className="transition hover:text-[#8a6800]">Joki ML</a>
        <span>›</span>
        <span className="font-bold text-[#202738]">Joki Mobile Legends</span>
      </nav>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[#ecd46e] bg-white p-4 shadow-[0_18px_45px_-32px_rgba(104,76,0,.45)] sm:rounded-[2rem] sm:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_right,#fff0a8,transparent_68%)]" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-[#ecd46e] bg-[#fff9df] sm:h-24 sm:w-24 sm:rounded-2xl">
            <img src="/rank-calculator/mythical-glory.png" alt="" className="h-12 w-12 object-contain sm:h-20 sm:w-20" />
          </div>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[#ecd46e] bg-[#fff8df] px-3 py-1 text-[11px] font-black text-[#8a6800]">
              <Trophy className="h-3.5 w-3.5" /> Jasa Joki oleh Official
            </p>
            <h1 className="mt-2 text-xl font-black tracking-tight text-[#101827] sm:text-3xl">Joki Mobile Legends</h1>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <Badge icon={<Trophy />} label="Penjoki pro" />
          <Badge icon={<MessageCircle />} label="Progres via WhatsApp" />
          <Badge icon={<ShieldCheck />} label="Garansi rank" />
        </div>
        <p className="relative mt-4 text-sm text-[#526176]">Jasa Joki Mobile Legends cepat, aman, dan bergaransi.</p>
      </div>

      <details className="group mt-6 rounded-3xl border border-[#ecd46e] bg-white shadow-[0_14px_38px_-32px_rgba(104,76,0,.45)]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 sm:px-7">
          <span><span className="text-xs font-black uppercase tracking-wider text-[#9a7500]">Wajib Dibaca</span><strong className="mt-1 block text-lg text-[#172033]">Syarat Ketentuan Joki</strong></span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#ffd84d] px-4 py-2 text-xs font-black text-[#17191d] transition hover:bg-[#ffca24]">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Baca Ketentuan</span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </summary>
        <div className="border-t border-[#efe4b0] px-5 py-5 sm:px-7">
          <p className="text-sm text-[#68758b]">Pahami 11 ketentuan berikut demi kenyamanan dan keamanan akun.</p>
          <ol className="mt-4 grid grid-cols-2 gap-2.5 md:gap-3">
            {TERMS.map((term, index) => (
              <li key={term} className="flex flex-col gap-2 rounded-xl bg-[#fffbed] p-2.5 text-[11px] leading-4 text-[#4f5968] sm:flex-row sm:gap-3 sm:rounded-2xl sm:p-3 sm:text-sm sm:leading-6">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-xs font-black text-[#17191d]">{index + 1}</span>
                <span>{term}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_352px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <JokiStep number="1" title="Pilih Layanan" description="Pilih rank atau paket joki yang kamu mau.">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8490a3]" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari layanan joki... (misal: epic, mythic, bonus)" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc] pl-9 pr-9" />
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
                <span>Hasil pencarian &ldquo;<b className="text-[#202738]">{query}</b>&rdquo;: <span className="font-black text-[#8a6800]">{visibleProducts.length}</span> produk ditemukan</span>
                <button type="button" onClick={() => setQuery("")} className="shrink-0 font-black text-[#b03a2e] hover:underline">Reset</button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#8490a3]">{visibleProducts.length} layanan ditemukan</p>
            )}
            <div className="mt-5 space-y-3">
              {groups.map((group, groupIndex) => {
                const products = visibleProducts.filter((item) => item.group === group);
                if (!products.length) return null;
                const open = isGroupOpen(group);
                const selectedInGroup = selectedProduct?.group === group;
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
                        aria-controls={`joki-group-panel-${groupIndex}`}
                        className={`flex min-h-14 w-full items-center gap-3 px-3.5 py-3 text-left transition ${open ? "bg-[#fff8df]" : "hover:bg-[#fffdf5]"}`}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#ecd46e] bg-[#fff9df]">
                          <img src={meta?.icon ?? products[0]?.image} alt="" loading="lazy" className="h-6 w-6 object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2 text-[15px] font-black leading-tight text-[#202738]">
                            {group}
                            <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#68758b]">{products.length} produk</span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#68758b]">
                            {selectedInGroup && selectedProduct ? (
                              <span className="font-semibold text-[#8a6800]">Dipilih: <b>{selectedProduct.name}</b></span>
                            ) : (
                              meta?.description
                            )}
                          </span>
                        </span>
                        <ChevronDown className={`h-5 w-5 shrink-0 text-[#68758b] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                      </button>
                    </h3>
                    {open && (
                      <div id={`joki-group-panel-${groupIndex}`} className="border-t border-dashed border-[#e4e7ec] bg-[#fffdf5] p-3 sm:p-4">
                        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                          {products.map((item) => {
                            const active = item.id === productId;
                            return (
                              <button key={item.id} type="button" onClick={() => setProductId(item.id)} aria-pressed={active} className={`relative min-h-36 rounded-xl border p-2.5 text-center transition sm:min-h-44 sm:rounded-2xl sm:p-3 ${active ? "border-[#d7aa00] bg-[#fff8df] shadow-[0_12px_25px_-18px_rgba(215,170,0,.7)]" : "border-[#dce3ec] bg-white hover:-translate-y-0.5 hover:border-[#e4bd22]"}`}>
                                {active && <span className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d]"><Check className="h-4 w-4" /></span>}
                                {item.badge && <span className="absolute right-2 top-2 rounded-full bg-[#ffd84d] px-2 py-1 text-[8px] font-black uppercase text-[#17191d]">{item.badge}</span>}
                                <img src={item.image} alt="" loading="lazy" className="mx-auto h-12 w-12 object-contain sm:h-16 sm:w-16" />
                                <span className="mt-2 block text-[10px] font-black leading-3 text-[#202738] sm:text-xs sm:leading-4">{item.name}</span>
                                <span className="mt-2 block text-xs font-black text-[#8a6800] sm:text-sm">{rupiah(item.price)}{item.perStar ? " /bintang" : ""}</span>
                                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#718096]"><Clock3 className="h-3 w-3" /> {item.estimate}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleProducts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dce3ec] bg-[#f8fafc] p-4 text-center sm:p-6">
                  <p className="font-black text-[#202738]">Produk Tidak Ditemukan</p>
                  <p className="mt-1 text-xs text-[#68758b]">Tidak ada produk yang cocok dengan pencarian &ldquo;{query}&rdquo;.</p>
                  <button type="button" onClick={() => setQuery("")} className="mt-3 rounded-full bg-[#ffd84d] px-5 py-2 text-xs font-black text-[#17191d] transition hover:bg-[#f2c425]">Reset Pencarian</button>
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
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => adjustStars(item.id, -1)}
                          disabled={count === 0}
                          aria-label={`Kurangi bintang ${item.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full border border-[#dce3ec] bg-white text-[#68758b] transition hover:border-[#e4bd22] hover:text-[#8a6800] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span aria-live="polite" className="w-8 text-center text-base font-black text-[#202738]">{count}</span>
                        <button
                          type="button"
                          onClick={() => adjustStars(item.id, 1)}
                          disabled={count >= 100}
                          aria-label={`Tambah bintang ${item.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full border border-[#d7aa00] bg-[#ffd84d] text-[#17191d] transition hover:bg-[#f2c425] disabled:cursor-not-allowed disabled:opacity-40"
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

          <JokiStep number="2" title="Data Akun Game" description="Masukkan data akun Mobile Legends untuk login penjoki.">
            <Field label="Login Melalui *">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LOGIN_METHODS.map((method) => (
                  <button
                    key={method.name}
                    type="button"
                    aria-label={method.name}
                    title={method.name}
                    onClick={() => setLoginMethod(method.name)}
                    className={`flex h-14 items-center justify-start gap-3 rounded-xl border px-3 transition ${
                      loginMethod === method.name
                        ? "border-[#d7aa00] bg-[#fff8df] text-[#8a6800]"
                        : "border-[#dce3ec] bg-white text-[#526176]"
                    }`}
                  >
                    <span className="flex h-10 w-12 shrink-0 items-center justify-center">
                      <img
                        src={method.icon}
                        alt={method.name}
                        loading="lazy"
                        className="max-h-8 max-w-full rounded-md object-contain"
                      />
                    </span>
                    <span className="truncate text-sm font-black">{method.name}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Email / No HP / ID Akun *" hint="Email atau username akun yang dipakai login."><Input value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder="Contoh: user@gmail.com / ID Moonton" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]" /></Field>
              <Field label="Password Akun *" hint="Password otomatis dienkripsi."><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password akun MLBB" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]" /></Field>
              <Field label="Nickname Game (opsional)" hint="Untuk pencocokan saat penjoki login."><Input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Contoh: RRQ Lemon / BotakPro" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]" /></Field>
              <Field label="Request Hero (opsional)" hint="Minimal 3 pilihan hero."><Input value={heroes} onChange={(event) => setHeroes(event.target.value)} placeholder="Contoh: Ling, Fanny, Hayabusa" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]" /></Field>
            </div>
            <div className="mt-5 rounded-2xl border border-[#ecd46e] bg-[#fffbed] p-4">
              <p className="flex items-center gap-2 font-black text-[#715700]"><LockKeyhole className="h-4 w-4" /> Data Login Terenkripsi & Dijamin Aman</p>
              <p className="mt-1 text-xs leading-5 text-[#68758b]">Data akun dan password disimpan secara rahasia dan hanya dipakai penjoki resmi saat memproses pesanan.</p>
            </div>
          </JokiStep>

          <JokiStep number="3" title="Pembayaran" description="Harga di tiap metode sudah termasuk biaya admin.">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {paymentMethods.map((item) => <button key={item.id} type="button" disabled={!selectedProduct} onClick={() => setPaymentId(item.id)} className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${paymentId === item.id ? "border-[#d7aa00] bg-[#fff8df]" : "border-[#dce3ec] bg-white hover:border-[#e4bd22]"}`}><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#17191d] text-sm font-black text-[#ffd84d]">{item.icon}</span><span><strong className="block text-sm">{item.name}</strong><span className="text-[11px] text-[#718096]">{!selectedProduct ? "Pilih layanan dulu" : item.id === "qris" ? "Biaya 2%" : "+Rp 5.000"}</span></span></button>)}
            </div>
          </JokiStep>

          <JokiStep number="4" title="Kontak WhatsApp & Catatan" description="Nomor WhatsApp untuk update status dan catatan tambahan.">
            <Field label="Nomor WhatsApp *" hint="Nomor ini dipakai untuk mengirim update progres pengerjaan joki."><Input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="0812 3456 7890" className="h-12 rounded-2xl border-[#dce3ec] bg-[#f8fafc]" /></Field>
            <label className="mt-5 block"><span className="text-sm font-black text-[#202738]">Catatan Tambahan untuk Penjoki (opsional)</span><textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-[#dce3ec] bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:border-[#d7aa00] focus:ring-2 focus:ring-[#ffd84d]/30" /><span className="mt-1 block text-right text-xs text-[#8490a3]">{note.length}/300</span></label>
          </JokiStep>
        </div>

        <aside className="overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_18px_45px_-30px_rgba(104,76,0,.35)] lg:sticky lg:top-36">
          <div className="flex items-center gap-2 border-b border-[#ecd46e] bg-[#fff5c7] px-5 py-4"><Wallet className="h-5 w-5 text-[#8a6800]" /><h2 className="font-black text-[#202738]">Ringkasan Pesanan</h2></div>
          <div className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-[#ece5c7] bg-[#fffdf5] p-3"><img src="/rank-calculator/mythical-glory.png" alt="" className="h-12 w-12 object-contain" /><div><p className="text-sm font-black">Joki Mobile Legends</p><p className="mt-0.5 text-xs text-[#7b8798]">{selectedProduct?.name ?? "Belum pilih layanan"}</p></div></div>
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
            <SummaryRow label="Biaya admin" value={selectedPayment ? rupiah(paymentFee) : "—"} />
            <div className="mt-4 flex items-center justify-between border-t border-[#e5eaf0] pt-4"><span className="font-black">Total Bayar</span><span className="text-xl font-black text-[#8a6800]">{rupiah(total)}</span></div>
            <Button type="button" size="lg" onClick={submit} className="mt-5 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]">Pesan Joki Sekarang <Trophy /></Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#718096]"><ShieldCheck className="h-4 w-4" /> Akun 100% aman</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ecd46e] bg-[#fff8df] px-3 py-2 text-[11px] font-black text-[#715700]">{icon}<span>{label}</span></span>;
}

function JokiStep({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e4e7ec] bg-white p-4 shadow-[0_18px_45px_-36px_rgba(31,42,61,.35)] sm:rounded-3xl sm:p-7">
      <header className="-mx-4 -mt-4 mb-4 flex items-start gap-3 border-b border-dashed border-[#e4e7ec] px-4 py-3.5 sm:-mx-7 sm:-mt-7 sm:mb-5 sm:px-7 sm:py-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#ecd46e] bg-[#fff3bd] text-base font-black text-[#8a6800]">{number}</span>
        <div><h2 className="text-lg font-black leading-tight text-[#101827] sm:text-xl">{title}</h2><p className="mt-0.5 text-sm leading-snug text-[#68758b]">{description}</p></div>
      </header>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="mt-3 flex items-start justify-between gap-4 text-sm"><span className="text-[#718096]">{label}</span><span className="text-right font-bold text-[#202738]">{value}</span></div>;
}
