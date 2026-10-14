import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { Gamepad2, Hammer, ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { JokiTab } from "@/components/bs/JokiTab";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/joki/$slug")({
  beforeLoad: ({ params }) => {
    if (!["mobile-legends", "valorant", "pubg", "pubg-mobile", "efootball"].includes(params.slug)) {
      throw redirect({ to: "/joki" });
    }
  },
  head: () => ({
    meta: [
      { title: "Joki Game — BotakStore" },
      { name: "description", content: "Layanan joki game cepat, aman, dan bergaransi di BotakStore." },
      ...routeSeo("/joki/mobile-legends", "Joki Game — BotakStore", "Layanan joki game cepat, aman, dan bergaransi di BotakStore."),
    ],
  }),
  component: JokiDetailPage,
});

const MAINTENANCE_GAMES = {
  valorant: { name: "Valorant", image: "/joki-default/valorant.png" },
  pubg: { name: "PUBG Mobile", image: "/joki-default/pubg.png" },
  "pubg-mobile": { name: "PUBG Mobile", image: "/joki-default/pubg.png" },
  efootball: { name: "eFootball", image: "/joki-default/efootball.png" },
} as const;

function JokiDetailPage() {
  const { slug } = Route.useParams();

  if (slug in MAINTENANCE_GAMES) {
    const info = MAINTENANCE_GAMES[slug as keyof typeof MAINTENANCE_GAMES];
    return (
      <PublicLayout banner="none" serviceNavigation="joki">
        <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:py-10">
          <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[#68758b] sm:text-sm">
            <Link to="/" className="transition hover:text-[#8a6800]">Beranda</Link>
            <span aria-hidden="true">›</span>
            <Link to="/joki" className="transition hover:text-[#8a6800]">Joki</Link>
            <span aria-hidden="true">›</span>
            <span className="max-w-full truncate font-bold text-[#202738]">Joki {info.name}</span>
          </nav>

          <section className="mx-auto mt-4 max-w-lg overflow-hidden rounded-2xl border border-[#ecd46e] bg-white text-center shadow-[0_18px_45px_-30px_rgba(104,76,0,.35)] sm:mt-6 sm:rounded-3xl">
            <div className="relative bg-[#101827] px-4 pb-5 pt-6 sm:px-8 sm:pb-7 sm:pt-8">
              <img
                src={info.image}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 to-[#101827]" />
              <div className="relative">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#ffd84d] shadow-[0_10px_25px_-10px_rgba(255,216,77,.8)] sm:h-16 sm:w-16">
                  <Hammer className="h-7 w-7 text-[#17191d] sm:h-8 sm:w-8" />
                </span>
                <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ffd84d] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#17191d] sm:text-[11px]">
                  <Gamepad2 className="h-3.5 w-3.5" /> Segera Hadir
                </p>
                <h1 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                  Joki {info.name} Maintenance
                </h1>
              </div>
            </div>
            <div className="px-4 py-5 sm:px-8 sm:py-7">
              <p className="text-sm leading-relaxed text-[#4f5968]">
                Layanan joki {info.name} sedang dalam tahap pengembangan.
                Kami lagi menyiapkan penjoki terbaik biar hasilnya maksimal —
                tunggu kabar baiknya ya!
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Link
                  to="/joki/$slug"
                  params={{ slug: "mobile-legends" }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#ffd84d] px-4 text-sm font-black text-[#17191d] transition hover:bg-[#f2c425]"
                >
                  Joki Mobile Legends
                </Link>
                <Link
                  to="/joki"
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-[#dce3ec] bg-white px-4 text-sm font-black text-[#202738] transition hover:border-[#e4bd22]"
                >
                  <ArrowLeft className="h-4 w-4" /> Daftar Joki
                </Link>
              </div>
            </div>
          </section>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout banner="none" serviceNavigation="joki" liftChat>
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:py-10">
        <JokiTab gameSlug={slug} />
      </div>
    </PublicLayout>
  );
}
