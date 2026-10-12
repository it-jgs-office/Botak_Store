import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Headphones,
  MessageCircleQuestion,
  MoveRight,
  Pause,
  Play,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Field, NativeSelect, OrderStatusBadge } from "@/components/bs/ui";
import { calcPrice, mlbbRankStarRange } from "@/lib/pricing";
import { saveDraft } from "@/lib/actions";
import { useDB } from "@/lib/store";
import { fmtDateTime, rupiah } from "@/lib/format";
import { MLBB_GAME_ID } from "@/lib/seed";
import type { CheckoutDraft, Coupon, JokiService } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BotakStore — Joki Mobile Legends" },
      { name: "description", content: "Joki rank Mobile Legends cepat, aman, dan transparan." },
    ],
  }),
  component: Home,
});

export const FAQS = [
  {
    q: "Apakah akun saya aman?",
    a: "Penjoki bermain manual tanpa cheat atau tools pihak ketiga. Data pesanan dipakai untuk proses layanan.",
  },
  {
    q: "Berapa lama proses joki?",
    a: "Estimasi tampil di setiap paket. Pesanan kecil biasanya mulai dikerjakan dalam hitungan menit.",
  },
  {
    q: "Bagaimana jika target tidak tercapai?",
    a: "Hubungi CS dari halaman cek pesanan. Tim kami membantu meninjau progres dan opsi penyelesaiannya.",
  },
];

function Home() {
  const db = useDB();
  const [q, setQ] = useState("");
  const featured = useMemo(
    () =>
      db.services
        .filter((s) => s.gameId === MLBB_GAME_ID && s.status === "active")
        .sort((a, b) => b.sold - a.sold),
    [db.services],
  );
  const rankService = featured.find((service) => service.type === "rank_target");
  const perStarService = featured.find((service) => service.type === "per_star");
  const rankNames = [
    ...(rankService?.pricing.tiers ?? []).map((tier) => tier.name),
    ...((rankService?.pricing.tiers ?? []).some((tier) =>
      tier.name.toLowerCase().includes("immortal"),
    )
      ? []
      : ["Mythical Immortal"]),
  ];
  const recent = useMemo(
    () =>
      db.orders
        .filter((o) => o.detail.gameId === MLBB_GAME_ID && o.paymentStatus === "paid")
        .slice(0, 4),
    [db.orders],
  );

  return (
    <PublicLayout>
      <main className="mx-auto w-full max-w-7xl px-4">
        <section
          aria-label="Pilihan layanan Mobile Legends"
          className="relative z-30 -mt-3 grid grid-cols-1 gap-3 pb-8 md:grid-cols-2 md:gap-4"
        >
          <HeroCategory
            image="/mlbb-diamond.svg"
            imageAlt="Diamond Mobile Legends"
            title="Top Up Diamond"
            text="Proses instan, harga terbaik"
            href="/joki"
            tone="blue"
          />
          <HeroCategory
            image="/rank-calculator/mythical-glory.png"
            imageAlt="Emblem Mythical Glory"
            title="Joki Rank ML"
            text="Naik rank aman dan terpercaya"
            href="/joki"
            tone="gold"
          />
        </section>

        <section className="py-14 md:py-20">
          <SectionTitle
            title="Joki Rank Mobile Legends"
            desc="Lihat emblem rank dan tarif joki per bintang."
            action={
              <Button asChild variant="outline" className="hidden sm:inline-flex">
                <Link to="/joki">
                  Lihat semua paket <ArrowRight />
                </Link>
              </Button>
            }
          />
          <RankCarousel
            ranks={rankNames}
            pricePerStar={perStarService?.pricing.pricePerStar ?? 0}
          />
        </section>
        {rankService && <RankBoostCalculatorReference service={rankService} coupons={db.coupons} />}
        <section className="mb-14 rounded-2xl border border-[#ecd46e] bg-[#fffbed] px-6 py-5 shadow-[0_10px_28px_-24px_rgba(104,76,0,.55)] md:mb-20 md:px-7 md:py-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#172033]">Cara Order Joki Rank</h2>
            <p className="mt-0.5 text-xs text-[#697386]">Gampang, cepat, dan aman.</p>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-7">
            {[
              {
                image: "/icon/pilihpaket.png",
                title: "Pilih paket",
                text: "Pilih rank atau jumlah bintang yang kamu mau.",
              },
              {
                image: "/icon/isidataakun.png",
                title: "Isi data akun",
                text: "Masukkan ID, server, dan request hero.",
              },
              {
                image: "/icon/lakukanpembayaran.png",
                title: "Lakukan pembayaran",
                text: "Pilih metode pembayaran yang tersedia.",
              },
              {
                image: "/icon/prosesdikerjakan.png",
                title: "Proses dikerjakan",
                text: "Akun kamu dikerjakan oleh player berpengalaman.",
              },
            ].map((step) => (
              <article key={step.title} className="min-w-0">
                <img
                  src={step.image}
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-28 object-contain object-left sm:h-24 sm:w-32"
                />
                <h3 className="mt-2 text-sm font-black text-[#1f2937]">{step.title}</h3>
                <p className="mt-1 text-xs leading-5 text-[#718096]">{step.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="pb-14 md:pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#ebe4cc] bg-gradient-to-br from-white via-white to-[#fff9e8] p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,.35)] sm:p-7 md:p-9">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#ffd84d]/20 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-4 border-b border-[#ece8dc] pb-6 sm:flex-row sm:items-end">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#967200]">
                  <ShieldCheck className="h-4 w-4" /> Kenapa BotakStore
                </p>
                <h2 className="mt-2 text-2xl font-black md:text-3xl">Aman & Terpercaya</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Setiap pesanan ditangani dengan proses yang jelas, aman, dan mudah dipantau.
                </p>
              </div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-[#ecd46e] bg-[#fff6cd] px-3.5 py-2 text-xs font-bold text-[#725800]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
                Layanan aktif 24 jam
              </div>
            </div>

            <div className="relative mt-6">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Benefit
                  icon={<ShieldCheck />}
                  title="Transaksi aman"
                  text="Data pesanan digunakan hanya untuk proses layanan."
                />
                <Benefit
                  icon={<Trophy />}
                  title="Player berpengalaman"
                  text="Dikerjakan oleh joki berpengalaman push rank MLBB."
                />
                <Benefit
                  icon={<Clock3 />}
                  title="Proses cepat"
                  text="Pengerjaan mengikuti antrean dan estimasi yang diberikan."
                />
                <Benefit
                  icon={<Headphones />}
                  title="CS 24 jam"
                  text="Siap membantu kapan saja melalui WhatsApp."
                />
              </div>
              <div className="mt-5 flex flex-col rounded-2xl border border-[#e6e8eb] bg-white p-4 shadow-[0_12px_32px_rgba(20,27,36,.06)] sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-[#edf0f2] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff2b7] text-[#896800]">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-black">Pesanan terbaru</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Update joki Mobile Legends
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#f1f3f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#727b85]">
                    Live
                  </span>
                </div>
                <div className="mt-4 flex-1 overflow-hidden rounded-xl border border-[#edf0f2]">
                  <Table className="min-w-[500px] text-xs">
                    <TableHeader className="bg-[#faf8f1] [&_tr]:border-[#ece7d6]">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="h-9 px-3 text-[10px] font-black uppercase tracking-[.12em] text-[#80745a]">
                          Pelanggan
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] font-black uppercase tracking-[.12em] text-[#80745a]">
                          Paket
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] font-black uppercase tracking-[.12em] text-[#80745a]">
                          Target
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] font-black uppercase tracking-[.12em] text-[#80745a]">
                          Waktu
                        </TableHead>
                        <TableHead className="h-9 px-3 text-right text-[10px] font-black uppercase tracking-[.12em] text-[#80745a]">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recent.map((o) => (
                        <TableRow key={o.id} className="border-[#edf0f2] hover:bg-[#fffaf0]">
                          <TableCell className="px-3 py-3 font-bold text-[#252a31]">
                            {o.customerName.charAt(0).toUpperCase()}***
                          </TableCell>
                          <TableCell className="max-w-28 px-3 py-3 font-semibold text-[#3c434c]">
                            <span className="block truncate" title={o.detail.serviceName}>
                              {o.detail.serviceName}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-28 px-3 py-3 text-muted-foreground">
                            <span className="block truncate" title={orderTarget(o)}>
                              {orderTarget(o)}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-3 py-3 text-[11px] text-muted-foreground">
                            {fmtDateTime(o.createdAt)}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-right">
                            <OrderStatusBadge status={o.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Link
                  to="/cek-order"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e1e4e8] bg-[#fafbfc] px-4 py-3 text-xs font-black text-[#343a42] transition hover:border-[#e3c34d] hover:bg-[#fff7d9]"
                >
                  Cek status pesanan <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="relative mb-14 overflow-hidden rounded-3xl bg-[#101419] px-7 py-8 text-white md:mb-20 md:px-12">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-primary">Pakai kode promo</p>
              <h2 className="mt-1 text-3xl font-black">BOTAKHEMAT</h2>
              <p className="mt-1 text-white/65">
                Dapatkan diskon <span className="font-bold text-primary">10%</span> untuk paket joki
                MLBB.
              </p>
            </div>
            <Button asChild className="text-[#101419]">
              <Link to="/joki">
                Pilih paket <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
        <section className="w-full pb-16 md:pb-20">
          <div className="mb-6 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ecd46e] bg-[#fff6cd] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-[#967200]">
              <MessageCircleQuestion className="h-4 w-4" /> FAQ
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Pertanyaan Umum</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Hal yang paling sering ditanyakan seputar joki rank di BotakStore.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="divide-y divide-[#edf0f2] rounded-2xl border border-border bg-white px-5 shadow-card sm:px-6"
          >
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={f.q} className="border-b-0">
                <AccordionTrigger className="gap-4 py-5 text-left text-[15px] font-bold hover:no-underline [&[data-state=open]>svg]:rotate-180 [&>svg]:rounded-full [&>svg]:bg-[#fff3c6] [&>svg]:p-1 [&>svg]:text-[#8a6800]">
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#151a20] text-xs font-black text-[#ffd84d]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {f.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pl-11 pr-2 leading-6 text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Masih bingung?{" "}
            <Link
              to="/cek-order"
              className="font-bold text-[#8a6800] underline-offset-4 hover:underline"
            >
              Lacak pesanan
            </Link>{" "}
            atau hubungi CS kami yang siap 24 jam.
          </p>
        </section>
      </main>
    </PublicLayout>
  );
}

function RankCarousel({ ranks, pricePerStar }: { ranks: string[]; pricePerStar: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastStart = Math.max(0, ranks.length - visibleCount);

  useEffect(() => {
    const small = window.matchMedia("(min-width: 640px)");
    const large = window.matchMedia("(min-width: 1024px)");
    const updateVisibleCount = () => setVisibleCount(large.matches ? 5 : small.matches ? 3 : 2);
    updateVisibleCount();
    small.addEventListener("change", updateVisibleCount);
    large.addEventListener("change", updateVisibleCount);
    return () => {
      small.removeEventListener("change", updateVisibleCount);
      large.removeEventListener("change", updateVisibleCount);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (lastStart < 1 || isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current >= lastStart ? 0 : current + 1));
    }, 4000);
    return () => window.clearInterval(timer);
  }, [isPaused, lastStart, prefersReducedMotion]);

  useEffect(() => {
    const track = trackRef.current;
    const slide = track?.children.item(activeIndex) as HTMLElement | null;
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [activeIndex, prefersReducedMotion, visibleCount]);

  const goTo = (index: number) => {
    setActiveIndex(Math.min(lastStart, Math.max(0, index)));
  };

  if (!ranks.length) return null;

  return (
    <div
      className="w-full overflow-x-clip"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      aria-roledescription="carousel"
      aria-label="Daftar harga joki per rank"
    >
      <div className="relative">
        <div
          ref={trackRef}
          onDragStart={(event) => event.preventDefault()}
          style={{ touchAction: "pan-y" }}
          className="flex gap-3 overflow-hidden px-1 pt-7 pb-2 select-none sm:gap-4"
        >
          {ranks.map((rank, index) => (
            <div
              key={rank}
              className="w-[calc((100%-0.75rem)/2)] flex-none sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${ranks.length}: ${rank}`}
            >
              <RankPriceCard rank={rank} index={index} pricePerStar={pricePerStar} />
            </div>
          ))}
        </div>

        {lastStart > 0 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex === 0 ? lastStart : activeIndex - 1)}
              aria-label="Rank sebelumnya"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 text-[#17191d] shadow-md transition hover:bg-[#ffd84d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7aa00]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex >= lastStart ? 0 : activeIndex + 1)}
              aria-label="Rank berikutnya"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/95 text-[#17191d] shadow-md transition hover:bg-[#ffd84d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7aa00]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {lastStart > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex items-center gap-1.5" aria-label="Pilih posisi slide">
            {Array.from({ length: lastStart + 1 }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Tampilkan posisi ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-7 bg-[#d7aa00]" : "w-2.5 bg-[#cbd0d6] hover:bg-[#aeb4bc]"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIsPaused((paused) => !paused)}
            aria-label={isPaused ? "Lanjutkan slide otomatis" : "Jeda slide otomatis"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#59616b] transition hover:bg-[#fff3c6] hover:text-[#17191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7aa00]"
          >
            {isPaused || prefersReducedMotion ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        Menampilkan rank {activeIndex + 1} sampai{" "}
        {Math.min(activeIndex + visibleCount, ranks.length)} dari {ranks.length}
      </p>
    </div>
  );
}

function RankPriceCard({
  rank,
  index,
  pricePerStar,
}: {
  rank: string;
  index: number;
  pricePerStar: number;
}) {
  const theme = rankTheme(rank);
  const cardStyle = {
    "--rank-color": theme.color,
    "--rank-light": theme.light,
    "--rank-deep": theme.deep,
    "--rank-delay": `${index * -0.64}s`,
  } as React.CSSProperties;

  return (
    <article
      style={cardStyle}
      className="group relative aspect-[406/632] w-full select-none transition duration-300 hover:-translate-y-1.5"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: "polygon(19% 4%, 96% 4%, 81% 97.2%, 2% 97.2%)" }}
      >
        <div className="rank-card-surface absolute inset-0" />
        <span className="rank-card-orb rank-card-orb-one" />
        <span className="rank-card-orb rank-card-orb-two" />
        <span className="rank-card-particle rank-card-particle-one" />
        <span className="rank-card-particle rank-card-particle-two" />
        <span className="rank-card-particle rank-card-particle-three" />
        <span className="rank-card-sweep" />
      </div>
      <img
        src={rankBorderAsset(rank)}
        alt=""
        aria-hidden="true"
        loading="lazy"
        draggable={false}
        className="pointer-events-none absolute -left-[41.9%] -top-[5.4%] h-[113.9%] w-[177.3%] max-w-none select-none object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,.16)] transition duration-200 group-hover:drop-shadow-[0_14px_28px_rgba(15,23,42,.3)]"
      />
      <span
        style={{ color: theme.ink }}
        className="absolute left-1/2 top-[6%] -translate-x-1/2 text-[10px] font-black tracking-widest sm:text-xs"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-[17%] text-center">
        <span className="rank-emblem-halo absolute top-[22%] h-[29%] w-[40%] rounded-full" />
        <img
          src={rankAsset(rank)}
          alt={`Emblem ${rank}`}
          loading="lazy"
          draggable={false}
          className="pointer-events-none relative z-10 w-[58%] shrink-0 select-none object-contain drop-shadow-[0_7px_12px_rgba(15,23,42,.24)] transition duration-300 group-hover:scale-110"
        />
        <div className="mt-[9%] w-full">
          <h3
            style={{ color: theme.ink }}
            className="truncate text-[13px] font-black uppercase tracking-wide sm:text-base"
          >
            {rank}
          </h3>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-[#44515f]/75 sm:text-[11px]">
            Harga per bintang
          </p>
          <p className="mt-1 text-sm font-black text-[#101419] sm:text-lg">
            {pricePerStar > 0 ? rupiah(pricePerStar) : "Hubungi CS"}
          </p>
        </div>
      </div>
    </article>
  );
}

function rankTheme(rank: string) {
  const normalized = rank.toLowerCase();
  if (normalized.includes("warrior"))
    return { color: "#bb7a38", light: "#f5d694", deep: "#6f421e", ink: "#70420e" };
  if (normalized.includes("elite"))
    return { color: "#8192a5", light: "#d8e2ea", deep: "#4e6072", ink: "#4b5e71" };
  if (normalized.includes("grandmaster"))
    return { color: "#477db9", light: "#b5ddf7", deep: "#234f89", ink: "#24578e" };
  if (normalized.includes("master"))
    return { color: "#c99731", light: "#f8de8a", deep: "#775116", ink: "#7a580f" };
  if (normalized.includes("epic"))
    return { color: "#248e86", light: "#9cdbcc", deep: "#075a62", ink: "#096a67" };
  if (normalized.includes("immortal"))
    return { color: "#6057aa", light: "#c6b9f4", deep: "#262752", ink: "#38346f" };
  if (normalized.includes("glory"))
    return { color: "#bd861f", light: "#f6dc7b", deep: "#664066", ink: "#75500b" };
  if (normalized.includes("honor"))
    return { color: "#467fc0", light: "#a8d8f7", deep: "#214a85", ink: "#285b96" };
  if (normalized.includes("mythic"))
    return { color: "#8e4fc1", light: "#d8a8ef", deep: "#482377", ink: "#63328f" };
  if (normalized.includes("legend"))
    return { color: "#c98a2e", light: "#f5cf76", deep: "#72441b", ink: "#79500d" };
  return { color: "#c99731", light: "#f8de8a", deep: "#775116", ink: "#7a580f" };
}

function rankBorderAsset(rank: string) {
  const normalized = rank.toLowerCase();
  if (normalized.includes("warrior")) return "/border-rank/Border Warrior.png";
  if (normalized.includes("elite")) return "/border-rank/Border Elite.png";
  if (normalized.includes("grandmaster")) return "/border-rank/Border Grandmaster.png";
  if (normalized.includes("master")) return "/border-rank/Border Master.png";
  if (normalized.includes("epic")) return "/border-rank/Border Epic.png";
  if (normalized.includes("immortal")) return "/border-rank/Border Mythic Immortal.png";
  if (normalized.includes("glory")) return "/border-rank/Border Mythic Glory.png";
  if (normalized.includes("honor")) return "/border-rank/Border Mythic Honor.png";
  if (normalized.includes("mythic")) return "/border-rank/Border Mythic.png";
  if (normalized.includes("legend")) return "/border-rank/Border Legends.png";
  return "/border-rank/Border Master.png";
}

function HeroCategory({
  image,
  imageAlt,
  title,
  text,
  href,
  tone,
}: {
  image: string;
  imageAlt: string;
  title: string;
  text: string;
  href: "/joki" | "/cek-order";
  tone: "blue" | "gold";
}) {
  return (
    <Link
      to={href}
      className={`group relative isolate grid min-h-[132px] grid-cols-[5.6rem_minmax(0,1fr)_2.9rem] items-center gap-2.5 overflow-hidden rounded-[1.65rem] border-2 px-3.5 py-3 text-[#111722] shadow-[0_15px_36px_rgba(23,54,91,.09)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(23,54,91,.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7aa00] focus-visible:ring-offset-2 sm:min-h-[154px] sm:grid-cols-[7rem_minmax(0,1fr)_3.8rem] sm:gap-3 sm:px-5 sm:py-4 ${tone === "blue" ? "border-[#c9e7ff] bg-[linear-gradient(105deg,#dff2ff_0%,#f6fbff_30%,#fff_66%,#f7fbff_100%)] hover:border-[#8fcaff]" : "border-[#ffe49a] bg-[linear-gradient(105deg,#ffd633_0%,#ffed9a_25%,#fffdf6_64%,#fffaf0_100%)] hover:border-[#ffd23a]"}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 -z-10 w-[46%] opacity-90 ${tone === "blue" ? "bg-[linear-gradient(140deg,transparent_12%,rgba(50,161,255,.16)_13%,rgba(50,161,255,.16)_30%,transparent_31%),linear-gradient(35deg,transparent_50%,rgba(0,130,255,.12)_51%,rgba(0,130,255,.12)_64%,transparent_65%)]" : "bg-[linear-gradient(140deg,transparent_12%,rgba(255,184,0,.34)_13%,rgba(255,184,0,.34)_30%,transparent_31%),linear-gradient(35deg,transparent_48%,rgba(255,183,0,.25)_49%,rgba(255,183,0,.25)_65%,transparent_66%)]"}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 right-10 -z-10 w-36 opacity-50 ${tone === "blue" ? "bg-[linear-gradient(145deg,transparent_32%,rgba(50,161,255,.13)_33%,rgba(50,161,255,.13)_43%,transparent_44%)]" : "bg-[linear-gradient(145deg,transparent_32%,rgba(255,188,0,.16)_33%,rgba(255,188,0,.16)_43%,transparent_44%)]"}`}
      />
      <span className="relative flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center sm:h-28 sm:w-28">
        <span
          className={`absolute inset-2 rounded-full blur-xl ${tone === "blue" ? "bg-[#58bdff]/35" : "bg-[#ffc400]/35"}`}
        />
        <img
          src={image}
          alt={imageAlt}
          className="relative z-10 h-full w-full object-contain drop-shadow-[0_10px_9px_rgba(27,53,85,.2)] transition duration-300 group-hover:scale-105"
        />
      </span>
      <span className="min-w-0 self-center">
        <strong className="block text-lg font-black leading-[1.05] tracking-[-0.035em] sm:text-[1.7rem]">
          {title}
        </strong>
        <span className="mt-2 block text-xs font-medium leading-snug text-[#657082] sm:text-[1.05rem]">
          {text}
        </span>
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ffd129] text-[#10141b] shadow-[0_0_0_10px_rgba(255,216,77,.13),0_6px_15px_rgba(222,165,0,.28)] transition group-hover:translate-x-1 group-hover:bg-[#ffc916] sm:h-14 sm:w-14">
        <ArrowRight className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.7} />
      </span>
    </Link>
  );
}
function RankBoostCalculator({ service, coupons }: { service: JokiService; coupons: Coupon[] }) {
  const nav = useNavigate();
  const tiers = service.pricing.tiers ?? [];
  const [ranks, setRanks] = useState(() => {
    const fromIndex = Math.min(4, Math.max(0, tiers.length - 2));
    const toIndex = Math.min(fromIndex + 2, tiers.length - 1);
    return {
      from: tiers[fromIndex]?.name ?? "",
      to: tiers[toIndex]?.name ?? "",
    };
  });
  const [modeId, setModeId] = useState(service.pricing.modes[0]?.id ?? "");
  const fromIndex = tiers.findIndex((tier) => tier.name === ranks.from);
  const availableTargets = tiers.slice(Math.max(0, fromIndex + 1));
  const draft: CheckoutDraft = {
    serviceId: service.id,
    fromRank: ranks.from,
    toRank: ranks.to,
    server: service.servers?.[0],
    modeId,
    priority: false,
  };
  const quote = calcPrice(service, draft, coupons);

  const selectFromRank = (from: string) => {
    const nextFromIndex = tiers.findIndex((tier) => tier.name === from);
    const currentTargetIndex = tiers.findIndex((tier) => tier.name === ranks.to);
    const to =
      currentTargetIndex > nextFromIndex ? ranks.to : (tiers[nextFromIndex + 1]?.name ?? "");
    setRanks({ from, to });
  };

  return (
    <section className="pb-14 md:pb-20">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7500]">
          Mobile Legends · Rank Boost
        </p>
        <h2 className="mt-2 text-2xl font-black md:text-3xl">Rank Boost Calculator</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih rank awal dan target untuk melihat estimasi harga joki.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-3xl border border-[#e8e4d8] bg-white shadow-[0_16px_50px_rgba(25,30,38,.07)] md:grid-cols-[1.35fr_.85fr]">
        <div className="p-5 sm:p-7 md:p-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
            <Field label="Rank saat ini">
              <NativeSelect
                value={ranks.from}
                onChange={(event) => selectFromRank(event.target.value)}
                className="h-12 rounded-xl border-[#dfe3e7] bg-[#fafbfc] font-semibold"
              >
                {tiers.slice(0, -1).map((tier) => (
                  <option key={tier.name} value={tier.name}>
                    {tier.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <div className="hidden h-12 items-center justify-center text-[#a37d00] sm:flex">
              <MoveRight className="h-5 w-5" />
            </div>
            <Field label="Target rank">
              <NativeSelect
                value={ranks.to}
                onChange={(event) =>
                  setRanks((current) => ({ ...current, to: event.target.value }))
                }
                className="h-12 rounded-xl border-[#dfe3e7] bg-[#fafbfc] font-semibold"
              >
                {availableTargets.map((tier) => (
                  <option key={tier.name} value={tier.name}>
                    {tier.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {service.pricing.modes.length > 1 && (
            <div className="mt-5 max-w-sm">
              <Field label="Mode pengerjaan">
                <NativeSelect
                  value={modeId}
                  onChange={(event) => setModeId(event.target.value)}
                  className="h-11 rounded-xl border-[#dfe3e7] bg-[#fafbfc]"
                >
                  {service.pricing.modes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.label}
                      {mode.price ? ` (+${rupiah(mode.price)})` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#edf0f2] pt-5 text-sm text-muted-foreground">
            <span>
              {Math.max(0, tiers.findIndex((tier) => tier.name === ranks.to) - fromIndex)} rank tier
            </span>
            <span>Estimasi pengerjaan: {service.estimate}</span>
          </div>
        </div>

        <aside className="flex flex-col justify-between gap-5 bg-[#fff8df] p-5 sm:p-7 md:p-8">
          <div>
            <p className="text-sm font-semibold text-[#56504a]">Estimasi total</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-[#17191d] sm:text-4xl">
              {rupiah(quote.snapshot.total)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#716b61]">
              Harga dihitung dari selisih rank dan mode pengerjaan yang dipilih.
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="w-full bg-[#ffd84d] text-[#17191d] hover:bg-[#ffca24]"
            disabled={!ranks.from || !ranks.to || Object.keys(quote.errors).length > 0}
            onClick={() => {
              saveDraft(draft);
              nav({ to: "/checkout" });
            }}
          >
            Lanjutkan Pesanan <ArrowRight />
          </Button>
        </aside>
      </div>
    </section>
  );
}
function RankBoostCalculatorReference({
  service,
  coupons,
}: {
  service: JokiService;
  coupons: Coupon[];
}) {
  const nav = useNavigate();
  const tiers = service.pricing.tiers ?? [];
  const [calculated, setCalculated] = useState(false);
  const [stars, setStars] = useState({ from: 1, to: 0 });
  const [ranks, setRanks] = useState(() => {
    const fromIndex = Math.min(4, Math.max(0, tiers.length - 2));
    const toIndex = Math.min(fromIndex + 2, tiers.length - 1);
    return { from: tiers[fromIndex]?.name ?? "", to: tiers[toIndex]?.name ?? "" };
  });
  const fromIndex = tiers.findIndex((tier) => tier.name === ranks.from);
  const availableTargets = tiers.slice(Math.max(0, fromIndex + 1));
  const draft: CheckoutDraft = {
    serviceId: service.id,
    fromRank: ranks.from,
    toRank: ranks.to,
    fromStars: stars.from,
    toStars: stars.to,
    server: service.servers?.[0],
    modeId: service.pricing.modes[0]?.id,
    priority: false,
  };
  const quote = calcPrice(service, draft, coupons);

  const selectFromRank = (from: string) => {
    const nextFromIndex = tiers.findIndex((tier) => tier.name === from);
    const currentTargetIndex = tiers.findIndex((tier) => tier.name === ranks.to);
    const to =
      currentTargetIndex > nextFromIndex ? ranks.to : (tiers[nextFromIndex + 1]?.name ?? "");
    setRanks({ from, to });
    setStars({
      from: mlbbRankStarRange(from).min,
      to: to === ranks.to ? stars.to : mlbbRankStarRange(to).min,
    });
    setCalculated(false);
  };

  return (
    <section id="kalkulator-joki" className="scroll-mt-28 pb-14 md:pb-20">
      <div className="relative overflow-hidden rounded-3xl border border-[#ffd84d]/50 bg-white shadow-[0_24px_60px_-42px_rgba(15,23,42,.55)]">
        <img
          src="/rank-calculator/background.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#ffd84d]/15 mix-blend-color" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#17191d]/5 via-[#17191d]/10 to-[#17191d]/45" />

        <div className="relative z-10 bg-white px-5 py-5 text-center sm:px-8">
          <p className="text-[9px] font-black uppercase tracking-[.22em] text-[#a07800]">
            BotakStore Boost
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">Rank Boost Calculator</h2>
        </div>

        <div className="relative z-10 p-4 sm:p-7">
          <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-4">
              <RankSelectCard
                number="01"
                title="Rank saat ini"
                value={ranks.from}
                options={tiers.slice(0, -1).map((tier) => tier.name)}
                onChange={selectFromRank}
                stars={stars.from}
                starRange={mlbbRankStarRange(ranks.from)}
                onStarsChange={(from) => {
                  setStars((current) => ({ ...current, from }));
                  setCalculated(false);
                }}
              />
              <MoveRight className="mx-auto h-4 w-4 text-white drop-shadow-md sm:h-6 sm:w-6" />
              <RankSelectCard
                number="02"
                title="Target rank"
                value={ranks.to}
                options={availableTargets.map((tier) => tier.name)}
                onChange={(to) => {
                  setRanks((current) => ({ ...current, to }));
                  setStars((current) => ({
                    ...current,
                    to: mlbbRankStarRange(to).min,
                  }));
                  setCalculated(false);
                }}
                stars={stars.to}
                starRange={mlbbRankStarRange(ranks.to)}
                onStarsChange={(to) => {
                  setStars((current) => ({ ...current, to }));
                  setCalculated(false);
                }}
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-5 sm:gap-14">
              <RankPreview rank={ranks.from} stars={stars.from} side="left" />
              <MoveRight className="calc-rank-arrow h-7 w-7 shrink-0 text-white drop-shadow-md sm:h-9 sm:w-9" />
              <RankPreview rank={ranks.to} stars={stars.to} side="right" />
            </div>

            <div className="mt-5 min-h-16 text-center">
              {calculated ? (
                <div className="animate-calc-reveal text-white drop-shadow-md">
                  <p className="text-xs font-bold">Estimasi harga</p>
                  <p className="mt-1 text-2xl font-black text-white">
                    {rupiah(quote.snapshot.total)}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-white">
                    {ranks.from} {stars.from}★ → {ranks.to} {stars.to}★ · Estimasi{" "}
                    {service.estimate}
                  </p>
                </div>
              ) : (
                <p className="calc-prompt-pulse rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                  Pilih rank dan bintang lalu tekan Hitung untuk melihat estimasi.
                </p>
              )}
            </div>

            <div
              className={`mx-auto mt-3 grid max-w-md gap-2 ${calculated ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <button
                type="button"
                disabled={!ranks.from || !ranks.to || Object.keys(quote.errors).length > 0}
                onClick={() => setCalculated(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#ffd84d] px-5 py-3.5 text-sm font-black uppercase text-[#17191d] shadow-md transition hover:bg-[#ffca24] disabled:opacity-45"
              >
                Hitung
              </button>
              {calculated && (
                <button
                  type="button"
                  onClick={() => {
                    saveDraft(draft);
                    nav({ to: "/checkout" });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white bg-white px-3 py-3 text-xs font-black text-[#8a6800] shadow-md transition hover:bg-[#fff8df] sm:px-5 sm:text-sm"
                >
                  Lanjut Bayar <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RankSelectCard({
  number,
  title,
  value,
  options,
  onChange,
  stars,
  starRange,
  onStarsChange,
}: {
  number: string;
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  stars: number;
  starRange: { min: number; max: number };
  onStarsChange: (value: number) => void;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-[2px] sm:rounded-2xl sm:p-5">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-[8px] font-black text-[#17191d] sm:h-7 sm:w-7 sm:text-[10px]">
          {number}
        </span>
        <h3 className="text-[8px] font-black uppercase leading-3 tracking-wide sm:text-xs">
          {title}
        </h3>
      </div>
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2.5 h-auto w-full min-w-0 rounded-lg border-slate-200 bg-white px-1.5 py-2 text-[8px] font-semibold outline-none focus:border-[#d8a900] sm:mt-4 sm:rounded-xl sm:px-3 sm:py-3 sm:text-xs sm:font-bold"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </NativeSelect>
      <label className="mt-2.5 block sm:mt-3">
        <span className="mb-1 block text-[7px] font-black uppercase tracking-wide text-slate-500 sm:text-[9px]">
          Bintang ({starRange.min}–{starRange.max})
        </span>
        <span className="relative block">
          <Input
            type="number"
            inputMode="numeric"
            min={starRange.min}
            max={starRange.max}
            value={stars}
            onChange={(event) => {
              const value = Math.min(
                starRange.max,
                Math.max(starRange.min, Number(event.target.value) || starRange.min),
              );
              onStarsChange(value);
            }}
            className="h-9 rounded-lg border-slate-200 bg-white pr-8 text-xs font-black text-slate-800 focus-visible:ring-[#ffd84d] sm:h-11 sm:rounded-xl sm:text-sm"
            aria-label={`${title} jumlah bintang`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#b18700]">
            ★
          </span>
        </span>
      </label>
      <p className="mt-2 text-[7px] font-black uppercase tracking-wide text-muted-foreground sm:mt-3 sm:text-[9px]">
        Mobile Legends
      </p>
    </div>
  );
}

function RankPreview({
  rank,
  stars,
  side,
}: {
  rank: string;
  stars: number;
  side: "left" | "right";
}) {
  return (
    <div className="flex w-28 flex-col items-center sm:w-36">
      <div className="calc-rank-preview relative grid h-24 w-24 place-items-center rounded-2xl border border-white bg-white p-3 shadow-lg sm:h-32 sm:w-32 sm:p-4">
        <img
          key={`${rank}-${side}`}
          src={rankAsset(rank)}
          alt={`Emblem ${rank}`}
          className={`h-full w-full object-contain drop-shadow-xl ${side === "left" ? "animate-slide-in-left" : "animate-slide-in-right"}`}
        />
        <span className="calc-star-pop absolute -bottom-2 left-1/2 min-w-10 -translate-x-1/2 rounded-full border border-[#ffd84d]/60 bg-white px-2 py-1 text-center text-xs font-black text-[#8a6800] shadow-md">
          {stars}★
        </span>
      </div>
      <p className="mt-4 max-w-full truncate rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700 shadow-sm">
        {rank}
      </p>
    </div>
  );
}

function rankAsset(rank: string) {
  const normalized = rank.toLowerCase();
  if (normalized.includes("warrior")) return "/rank-calculator/warrior.png";
  if (normalized.includes("elite")) return "/rank-calculator/elite.png";
  if (normalized.includes("immortal")) return "/rank-calculator/mythical-immortal.png";
  if (normalized.includes("glory")) return "/rank-calculator/mythical-glory.png";
  if (normalized.includes("honor")) return "/rank-calculator/mythical-honor.png";
  if (normalized.includes("mythic")) return "/rank-calculator/mythical-romawi.png";
  if (normalized.includes("legend")) return "/rank-calculator/legend.png";
  if (normalized.includes("epic")) return "/rank-calculator/epic.png";
  if (normalized.includes("grandmaster")) return "/rank-calculator/grandmaster.png";
  return "/rank-calculator/master.png";
}

function Benefit({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-[#e7eaed] bg-[#fbfcfd] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#e6c74d] hover:bg-white hover:shadow-[0_12px_28px_rgba(20,27,36,.07)] sm:p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#151a20] text-[#ffd84d] transition group-hover:bg-[#ffd84d] group-hover:text-[#151a20] [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0">
        <h3 className="font-black">{title}</h3>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:text-sm">{text}</p>
      </div>
    </article>
  );
}

function orderTarget(order: { detail: { fromRank?: string; toRank?: string; stars?: number } }) {
  if (order.detail.fromRank && order.detail.toRank) {
    return `${order.detail.fromRank} → ${order.detail.toRank}`;
  }

  return order.detail.stars ? `${order.detail.stars} bintang` : "Paket joki";
}
function SectionTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}
