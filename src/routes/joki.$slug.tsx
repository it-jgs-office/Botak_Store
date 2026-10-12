import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Clock, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Field, GameTile, NativeSelect, Panel } from "@/components/bs/ui";
import { PriceSummary } from "@/components/bs/PriceSummary";
import { getDB, useDB } from "@/lib/store";
import { calcPrice, startingPrice } from "@/lib/pricing";
import { rupiah } from "@/lib/format";
import { saveDraft } from "@/lib/actions";
import type { CheckoutDraft } from "@/lib/types";
import { MLBB_GAME_ID, seedServices } from "@/lib/seed";

export const Route = createFileRoute("/joki/$slug")({
  loader: ({ params }) => {
    const s = seedServices.find((x) => x.slug === params.slug && x.gameId === MLBB_GAME_ID && x.status === "active");
    if (!s) throw notFound();
    return { name: s.name, desc: s.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Layanan tidak ditemukan — BotakStore" }, { name: "robots", content: "noindex" }] };
    return {
      meta: [
        { title: `${loaderData.name} — BotakStore` },
        { name: "description", content: loaderData.desc },
        { property: "og:title", content: `${loaderData.name} — BotakStore` },
        { property: "og:description", content: loaderData.desc },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout><div className="py-24 text-center"><h1 className="text-2xl font-bold">Layanan tidak ditemukan</h1><Link to="/joki" className="mt-4 inline-block text-primary-glow underline">Kembali ke katalog</Link></div></PublicLayout>
  ),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useParams();
  const db = useDB();
  const nav = useNavigate();
  const svc = db.services.find((s) => s.slug === slug);
  const game = svc && db.games.find((g) => g.id === svc.gameId);
  const [d, setD] = useState<CheckoutDraft>({ serviceId: svc?.id ?? "", priority: false });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!svc) return;
    const draft = getDB().draft;
    if (draft?.serviceId === svc.id) setD(draft);
    else setD({
      serviceId: svc.id, priority: false, modeId: svc.pricing.modes[0]?.id, server: svc.servers?.[0],
      fromRank: svc.pricing.tiers?.[0]?.name, toRank: svc.pricing.tiers?.[1]?.name, stars: svc.type === "per_star" ? 10 : undefined,
    });
  }, [svc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => (svc ? calcPrice(svc, d, db.coupons) : null), [svc, d, db.coupons]);
  if (!svc || !game || !result) return <PublicLayout><div className="py-24 text-center text-muted-foreground">Layanan tidak tersedia.</div></PublicLayout>;
  const err = touched ? result.errors : {};
  const tiers = svc.pricing.tiers ?? [];

  const proceed = () => {
    setTouched(true);
    if (Object.keys(result.errors).length) {
      toast.error("Periksa kembali konfigurasi pesanan.");
      return;
    }
    saveDraft({ ...d, couponCode: undefined });
    nav({ to: "/checkout" });
  };

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Beranda</Link><ChevronRight className="h-4 w-4" />
          <Link to="/joki" className="hover:text-foreground">Joki</Link><ChevronRight className="h-4 w-4" />
          <Link to="/joki" search={{ game: game.slug }} className="hover:text-foreground">{game.name}</Link><ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{svc.name}</span>
        </nav>
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row">
              <div className="h-32 w-full sm:w-32"><GameTile game={game} size="lg" /></div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{game.name}</p>
                <h1 className="text-2xl font-bold md:text-3xl">{svc.name}</h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" />{svc.rating} · {svc.reviews} ulasan</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{svc.estimate}</span>
                  <span>{svc.sold.toLocaleString("id-ID")} terjual</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{svc.description}</p>
                <p className="mt-3 text-sm">Mulai dari <span className="font-display text-xl font-bold">{rupiah(startingPrice(svc))}</span></p>
              </div>
            </div>

            <Panel title="Konfigurasi Pesanan">
              <div className="grid gap-4 sm:grid-cols-2">
                {svc.type === "rank_target" && (
                  <>
                    <Field label="Rank awal" error={err["fromRank"]}>
                      <NativeSelect value={d.fromRank ?? ""} onChange={(e) => setD({ ...d, fromRank: e.target.value })}>
                        {tiers.slice(0, -1).map((t) => <option key={t.name}>{t.name}</option>)}
                      </NativeSelect>
                    </Field>
                    <Field label="Rank target" error={err["toRank"]}>
                      <NativeSelect value={d.toRank ?? ""} onChange={(e) => setD({ ...d, toRank: e.target.value })}>
                        {tiers.slice(1).map((t) => <option key={t.name}>{t.name}</option>)}
                      </NativeSelect>
                    </Field>
                  </>
                )}
                {svc.type === "per_star" && (
                  <Field label="Jumlah bintang" error={err["stars"]} hint={`${rupiah(svc.pricing.pricePerStar ?? 0)} / bintang · ${svc.pricing.minStars}–${svc.pricing.maxStars}`}>
                    <Input type="number" min={svc.pricing.minStars} max={svc.pricing.maxStars} value={d.stars ?? ""} onChange={(e) => setD({ ...d, stars: e.target.value === "" ? undefined : Number(e.target.value) })} />
                  </Field>
                )}
                {!!svc.servers?.length && (
                  <Field label="Server / Region" error={err["server"]}>
                    <NativeSelect value={d.server ?? ""} onChange={(e) => setD({ ...d, server: e.target.value })}>
                      {svc.servers.map((s) => <option key={s}>{s}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                {!!svc.pricing.modes.length && (
                  <Field label="Mode pengerjaan" error={err["modeId"]}>
                    <NativeSelect value={d.modeId ?? ""} onChange={(e) => setD({ ...d, modeId: e.target.value })}>
                      {svc.pricing.modes.map((m) => <option key={m.id} value={m.id}>{m.label}{m.price ? ` (+${rupiah(m.price)})` : ""}</option>)}
                    </NativeSelect>
                  </Field>
                )}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 sm:col-span-2">
                  <div className="flex items-center gap-3"><Zap className="h-5 w-5 text-warning" />
                    <div><p className="text-sm font-medium">Prioritas pengerjaan</p><p className="text-xs text-muted-foreground">Dikerjakan lebih dulu (+{rupiah(svc.pricing.priorityPrice)})</p></div>
                  </div>
                  <Switch checked={d.priority} onCheckedChange={(v) => setD({ ...d, priority: v })} />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Catatan (opsional)">
                    <Textarea maxLength={300} value={d.notes ?? ""} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Contoh: request hero/agent tertentu" />
                  </Field>
                </div>
              </div>
            </Panel>

            <Panel title="Persyaratan">
              <ul className="space-y-2">
                {(svc.requirements.length ? svc.requirements : ["Tidak ada persyaratan khusus"]).map((r) => (
                  <li key={r} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" />{r}</li>
                ))}
              </ul>
            </Panel>
            {!!svc.faqs.length && (
              <Panel title="FAQ Layanan">
                <Accordion type="single" collapsible>
                  {svc.faqs.map((f) => (
                    <AccordionItem key={f.q} value={f.q}><AccordionTrigger>{f.q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{f.a}</AccordionContent></AccordionItem>
                  ))}
                </Accordion>
              </Panel>
            )}
          </div>
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <PriceSummary gameName={game.name} serviceName={svc.name} draft={d} service={svc} snapshot={result.snapshot}>
              <Button size="lg" className="w-full shadow-glow" onClick={proceed}>Lanjutkan Pemesanan</Button>
            </PriceSummary>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
