import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { ServiceCard } from "@/components/bs/ServiceCard";
import { EmptyState, NativeSelect, PageHeader } from "@/components/bs/ui";
import { useDB } from "@/lib/store";
import { startingPrice } from "@/lib/pricing";
import { MLBB_GAME_ID } from "@/lib/seed";

const searchSchema = z.object({
  q: z.string().optional(),
  game: z.string().optional(),
  type: z.string().optional(),
  sort: z.enum(["popular", "cheap", "expensive", "rating"]).optional(),
  max: z.number().optional(),
});

export const Route = createFileRoute("/joki/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Katalog Joki Game — BotakStore" },
      { name: "description", content: "Bandingkan layanan joki rank, per bintang, placement & misi untuk berbagai game." },
      { property: "og:title", content: "Katalog Joki Game — BotakStore" },
      { property: "og:description", content: "Filter berdasarkan game, jenis layanan, dan harga." },
    ],
  }),
  component: Catalog,
});

const TYPES = [
  { v: "rank_target", l: "Push Rank" }, { v: "per_star", l: "Per Bintang" }, { v: "placement", l: "Paket Target" },
];

function Catalog() {
  const db = useDB();
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/joki/" });
  const set = (p: Partial<typeof s>) => nav({ search: (prev) => ({ ...prev, ...p }), replace: true });

  const list = useMemo(() => {
    let r = db.services.filter((x) => x.status === "active" && x.gameId === MLBB_GAME_ID);
    if (s.type) r = r.filter((x) => x.type === s.type);
    if (s.max) r = r.filter((x) => startingPrice(x) <= s.max!);
    if (s.q) {
      const q = s.q.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || "mobile legends mlbb".includes(q));
    }
    const sort = s.sort ?? "popular";
    return [...r].sort((a, b) =>
      sort === "cheap" ? startingPrice(a) - startingPrice(b) : sort === "expensive" ? startingPrice(b) - startingPrice(a) : sort === "rating" ? b.rating - a.rating : b.sold - a.sold);
  }, [db, s]);

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <PageHeader title="Katalog Joki" desc={`${list.length} layanan tersedia`} />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-20">
            <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" /> Filter</div>
            <div className="space-y-2">
              <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-glow">Game tersedia</p>
                <p className="mt-1 font-semibold">Mobile Legends: Bang Bang</p>
                <p className="mt-1 text-xs text-muted-foreground">Semua paket joki saat ini khusus MLBB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Jenis layanan</p>
              <NativeSelect value={s.type ?? ""} onChange={(e) => set({ type: e.target.value || undefined })}>
                <option value="">Semua paket</option>
                {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Harga mulai maksimal</p>
              <NativeSelect value={s.max ?? ""} onChange={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">Semua harga</option>
                <option value="50000">≤ Rp50.000</option>
                <option value="150000">≤ Rp150.000</option>
                <option value="500000">≤ Rp500.000</option>
              </NativeSelect>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => nav({ search: {} })}>Reset filter</Button>
          </aside>
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={s.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Cari paket joki MLBB…" className="pl-9" />
              </div>
              <NativeSelect className="sm:w-48" value={s.sort ?? "popular"} onChange={(e) => set({ sort: e.target.value as "popular" })}>
                <option value="popular">Terpopuler</option>
                <option value="rating">Rating tertinggi</option>
                <option value="cheap">Harga termurah</option>
                <option value="expensive">Harga tertinggi</option>
              </NativeSelect>
            </div>
            {list.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((x) => <ServiceCard key={x.id} service={x} game={db.games.find((g) => g.id === x.gameId)} />)}
              </div>
            ) : (
              <EmptyState title="Layanan tidak ditemukan" desc="Coba ubah kata kunci atau reset filter." action={<Button variant="outline" onClick={() => nav({ search: {} })}>Reset filter</Button>} />
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`rounded-md px-3 py-1.5 text-left text-sm transition ${active ? "bg-primary/15 text-primary-glow" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      {children}
    </button>
  );
}
