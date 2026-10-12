import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, Search, Star, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { GameTile, PageHeader } from "@/components/bs/ui";
import { TOPUP_GAMES } from "@/lib/topup-mock";

export const Route = createFileRoute("/topup/")({
  head: () => ({
    meta: [
      { title: "Top Up Game Instan — BotakStore" },
      { name: "description", content: "Top up diamond, UC, Points, dan voucher game favoritmu. Proses instan, aman, 24 jam." },
    ],
  }),
  component: TopupCatalog,
});

const CATS = ["Semua", "MOBA", "Battle Royale", "FPS", "RPG"];

function TopupCatalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");

  const list = useMemo(() => {
    return TOPUP_GAMES.filter((g) => {
      if (cat !== "Semua" && g.category !== cat) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return g.name.toLowerCase().includes(s) || g.publisher.toLowerCase().includes(s);
    });
  }, [q, cat]);

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <PageHeader
          title="Top Up Game"
          desc="Proses instan · pembayaran lengkap · buka 24 jam — mockup UI, belum terhubung ke pembayaran."
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari Mobile Legends, Free Fire, Valorant…"
              className="h-11 rounded-xl pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  cat === c
                    ? "border-[#ffd84d] bg-[#ffd84d] text-[#101419]"
                    : "border-border bg-white text-muted-foreground hover:border-[#ffd84d] hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {list.map((g) => (
            <Link
              key={g.id}
              to="/topup/$slug"
              params={{ slug: g.slug }}
              className="group overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-1 hover:border-[#e3c34d] hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,.35)]"
            >
              <div className="relative aspect-[4/3]">
                <GameTile game={g} size="lg" className="rounded-none text-4xl" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-[#ffd84d]">
                  <Zap className="h-3 w-3" /> Instan
                </span>
              </div>
              <div className="p-3">
                <p className="text-[11px] font-medium text-muted-foreground">{g.publisher}</p>
                <h3 className="truncate text-sm font-black group-hover:text-[#8a6800]">{g.name}</h3>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Star className="h-3 w-3 fill-[#f5a623] text-[#f5a623]" />
                  {g.rating} · {(g.sold / 1000).toFixed(1)}rb terjual
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-[#ecd46e] bg-[#fff8df] p-5 text-sm sm:grid-cols-3">
          {[
            ["1. Masukkan ID", "Tanpa login akun, cukup User ID + Server."],
            ["2. Pilih nominal", "Diamond, UC, Points, Crystal & voucher."],
            ["3. Bayar & instan", "QRIS, e-wallet, VA, pulsa, gerai."],
          ].map(([t, d]) => (
            <div key={t} className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6800]" />
              <div>
                <p className="font-black">{t}</p>
                <p className="mt-0.5 text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
