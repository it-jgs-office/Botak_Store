import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  CircleHelp,
  Search,
  TicketPercent,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Field, GameTile } from "@/components/bs/ui";
import { rupiah } from "@/lib/format";
import { TOPUP_PAYMENTS, getTopupGame } from "@/lib/topup-mock";

export const Route = createFileRoute("/topup/$slug")({
  loader: ({ params }) => {
    const g = getTopupGame(params.slug);
    if (!g) throw notFound();
    return { name: g.name, desc: g.description };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `Top Up ${loaderData.name} — BotakStore` : "Top Up — BotakStore" },
      { name: "description", content: loaderData?.desc ?? "Top up game instan." },
    ],
  }),
  notFoundComponent: () => (
    <PublicLayout>
      <div className="py-24 text-center">
        <h1 className="text-2xl font-black">Game tidak ditemukan</h1>
        <Link to="/topup" className="mt-4 inline-block font-bold text-[#8a6800] underline">
          Kembali ke katalog topup
        </Link>
      </div>
    </PublicLayout>
  ),
  component: TopupDetail,
});

function TopupDetail() {
  const { slug } = Route.useParams();
  const game = getTopupGame(slug);
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [packId, setPackId] = useState<string | undefined>();
  const [payId, setPayId] = useState("");
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [wa, setWa] = useState("");
  const [email, setEmail] = useState("");
  const [productQuery, setProductQuery] = useState("");

  const pack = game?.packs.find((p) => p.id === packId);
  const pay = TOPUP_PAYMENTS.find((p) => p.id === payId);

  const discount = useMemo(() => {
    if (!promoApplied || !pack) return 0;
    return Math.min(15000, Math.round(pack.price * 0.1));
  }, [promoApplied, pack]);

  const total = (pack?.price ?? 0) - discount + (pay?.fee ?? 0);

  if (!game) return null;
  const paymentMethods = TOPUP_PAYMENTS.filter((p) => p.group === "QRIS" || p.group === "Virtual Account");
  const groups = [...new Set(paymentMethods.map((p) => p.group))];
  const visiblePacks = game.packs.filter((item) => item.label.toLowerCase().includes(productQuery.toLowerCase()));
  const productGroups = [
    {
      name: "Top Up Diamond",
      desc: "Pilihan nominal diamond resmi & proses kilat",
      packs: visiblePacks.filter((item) => !item.label.toLowerCase().includes("pass")),
    },
    {
      name: "Pass & Membership",
      desc: "Weekly Diamond Pass hemat & paket langganan",
      packs: visiblePacks.filter((item) => item.label.toLowerCase().includes("pass")),
    },
  ];
  const valid = userId.trim().length >= 3 && (!game.needServer || serverId.trim().length > 0) && !!pack && !!pay && wa.trim().length >= 8;

  const bayar = () => {
    if (!valid) {
      toast.error("Lengkapi User ID, Zone ID, nominal, pembayaran, dan nomor WhatsApp dulu.");
      return;
    }
    toast.success("Ini mockup UI — checkout belum dihubungkan.", {
      description: `${game.name} · ${pack?.label} · ${pay?.name} · ${rupiah(total)}`,
    });
  };

  return (
    <PublicLayout banner="none">
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <nav className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Beranda</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/topup" className="hover:text-foreground">Top Up</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-foreground">{game.name}</span>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Kiri: info game */}
          <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
            <div className="overflow-hidden rounded-2xl border border-border bg-white">
              <div className="relative aspect-[16/9]">
                <GameTile game={game} size="lg" className="rounded-none text-5xl" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-[#ffd84d]">
                  <Zap className="h-3.5 w-3.5" /> Proses Instan
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-muted-foreground">Top Up Game oleh {game.publisher}</p>
                <h1 className="mt-1 text-2xl font-black">{game.name}</h1>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-[#4d5968]">
                  <span>⚡ Proses instan</span>
                  <span>🛡️ Aman & legal</span>
                  <span>💬 CS via WhatsApp</span>
                  <span>🕐 Buka 24 jam</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{game.description}</p>
                <p className="mt-3 text-xs font-bold text-muted-foreground">{game.publisher}</p>
                <div className="mt-4 rounded-xl bg-[#fff8df] p-3 text-xs leading-5 text-[#6b5b00]">
                  <p className="font-black">Cara cek {game.idLabel}:</p>
                  <p className="mt-1">{game.howTo[0]}</p>
                </div>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-border bg-white p-5 lg:block">
              <h2 className="font-black">Deskripsi</h2>
              <ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {game.howTo.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ffd84d] text-[11px] font-black text-[#101419]">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="faq">
                  <AccordionTrigger className="text-sm font-bold">
                    <span className="inline-flex items-center gap-2"><CircleHelp className="h-4 w-4" /> Berapa lama prosesnya?</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    Instan 24 jam. Jika ID benar, item masuk dalam hitungan detik–menit. Jika tertunda, hubungi CS via halaman Cek Pesanan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          {/* Kanan: alur 1-2-3 */}
          <div className="space-y-4 pb-28 lg:pb-0">
            {/* STEP 1 */}
            <section className="rounded-2xl border border-border bg-white p-5">
              <StepHead n="1" title="Masukkan Data Akun" desc="Isi User ID & Zone ID dengan benar biar Diamonds nggak nyasar." />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="User ID" hint="ID Akun game">
                  <Input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Contoh: 12345678"
                    className="h-11 rounded-xl"
                  />
                </Field>
                <Field label="Zone ID" hint="Server / Zone ID">
                  <Input value={serverId} onChange={(e) => setServerId(e.target.value)} placeholder="Contoh: 2041" className="h-11 rounded-xl" />
                </Field>
              </div>
              <details className="mt-3 rounded-xl border border-[#eee5c5] bg-[#fffaf0] px-4 py-3 text-sm">
                <summary className="cursor-pointer font-bold text-[#735900]">Cara menemukan User ID</summary>
                <p className="mt-2 leading-6 text-muted-foreground">Buka profil Mobile Legends. User ID dan Zone ID tertera di bawah nama akun, contoh: 12345678 (2041).</p>
              </details>
            </section>

            {/* STEP 2 */}
            <section className="rounded-2xl border border-border bg-white p-5">
              <StepHead n="2" title="Pilih Nominal" desc="Mau top up berapa Diamonds?" />
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Pilih nominal" className="h-11 rounded-xl pl-9" />
              </div>
              <div className="mt-4 space-y-4">
                {productGroups.map((group) => group.packs.length > 0 && (
                  <div key={group.name} className="rounded-xl border border-border p-3">
                    <div className="mb-3">
                      <h3 className="font-black">{group.name} <span className="text-xs text-muted-foreground">{group.packs.length} produk</span></h3>
                      <p className="text-xs text-muted-foreground">{group.desc}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {group.packs.map((p) => {
                        const active = p.id === packId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPackId(p.id)}
                            className={`relative rounded-xl border-2 p-3 text-left transition ${active ? "border-[#d7aa00] bg-[#fff8df] shadow-[0_8px_24px_-12px_rgba(215,170,0,.6)]" : "border-border bg-white hover:border-[#ecd46e]"}`}
                          >
                            {p.badge && <span className={`absolute -top-2 left-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${p.badge === "Hemat" ? "bg-emerald-500 text-white" : "bg-[#ffd84d] text-[#101419]"}`}>{p.badge}</span>}
                            <span className="mt-1 flex items-center gap-1.5 font-black"><span className="text-lg">{p.icon}</span><span className="text-sm">{p.label}</span></span>
                            {p.sub && <span className="text-[11px] text-muted-foreground">{p.sub}</span>}
                            <span className="mt-1.5 block text-sm font-black text-[#8a6800]">{rupiah(p.price)}</span>
                            {p.originalPrice && <span className="text-[11px] text-muted-foreground line-through">{rupiah(p.originalPrice)}</span>}
                            {active && <BadgeCheck className="absolute bottom-3 right-3 h-5 w-5 text-[#b18700]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* STEP 3 pembayaran */}
            <section className="rounded-2xl border border-border bg-white p-5">
              <StepHead n="3" title="Pilih Pembayaran" desc="Harga di tiap metode sudah termasuk biaya admin." />
              <div className="mt-4 space-y-4">
                {groups.map((g) => (
                  <div key={g}>
                    <div className="mb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{g}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{g === "QRIS" ? "Scan pakai aplikasi apa aja" : "Transfer lewat m-banking / ATM"}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {paymentMethods.filter((p) => p.group === g).map((m) => {
                        const active = m.id === payId;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            disabled={!pack}
                            onClick={() => setPayId(m.id)}
                            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${active ? "border-[#d7aa00] bg-[#fff8df]" : "border-border hover:border-[#ecd46e]"}`}
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#101419] text-sm font-black text-[#ffd84d]">{m.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{m.id === "qris" ? "QRIS All Payment (Semua E-Wallet & M-Banking)" : m.name}</span>
                              <span className="text-[11px] text-muted-foreground">{!pack ? "Pilih nominal dulu" : `${m.fee === 0 ? "Tanpa biaya" : `+${rupiah(m.fee)}`}${m.note ? ` · ${m.note}` : ""}`}</span>
                            </span>
                            <span className={`h-4 w-4 rounded-full border-2 ${active ? "border-[#b18700] bg-[#ffd84d]" : "border-muted-foreground/30"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* STEP 4 kontak dan promo */}
            <section className="rounded-2xl border border-border bg-white p-5">
              <StepHead n="4" title="Kontak & Promo" desc="Buat kirim bukti transaksi. Punya kode promo? Pakai di sini." />
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nomor WhatsApp" hint="Info & bukti pesanan dikirim ke nomor ini. Tenang, bukan buat spam 🤞">
                  <Input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="08xxxxxxxxxx" className="h-11 rounded-xl" />
                </Field>
                <Field label="Email (opsional)" hint="Buat kirim salinan bukti transaksi.">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="h-11 rounded-xl" />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Kode Promo (opsional)" hint="Potongan langsung dihitung di total. Satu pesanan satu kode ya.">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TicketPercent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input value={promo} onChange={(e) => { setPromo(e.target.value); setPromoApplied(false); }} placeholder="Kode Promo (opsional)" className="h-11 rounded-xl pl-9 uppercase" />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      disabled={!promo.trim()}
                      onClick={() => {
                        setPromoApplied(true);
                        toast.success(`Promo ${promo.toUpperCase()} dipakai (mockup).`);
                      }}
                    >
                      Pakai
                    </Button>
                  </div>
                </Field>
                {promoApplied && <p className="mt-2 text-xs font-semibold text-emerald-600">Diskon {rupiah(discount)} diterapkan (simulasi 10%, maks Rp15rb).</p>}
              </div>
            </section>

            {/* Ringkasan desktop */}
            <section className="hidden rounded-2xl border border-[#ecd46e] bg-[#fff8df] p-5 lg:block">
              <h2 className="mb-4 text-lg font-black">Ringkasan Pesanan</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{game.name}</span>
                <span className="font-bold">{pack?.label ?? "Belum pilih nominal"}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pembayaran</span>
                <span className="font-bold">{pay?.name ?? "Belum dipilih"}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{pack ? rupiah(pack.price) : rupiah(0)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Biaya admin</span>
                <span className="font-bold">{pay ? (pay.fee === 0 ? "Gratis" : rupiah(pay.fee)) : "—"}</span>
              </div>
              {discount > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-sm text-emerald-600">
                  <span>Diskon promo</span>
                  <span className="font-bold">−{rupiah(discount)}</span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-[#e3d49a] pt-3">
                <span className="font-black">Total Bayar</span>
                <span className="text-2xl font-black">{rupiah(total)}</span>
              </div>
              <Button type="button" size="lg" className="mt-4 w-full text-[#101419]" onClick={bayar}>
                <Wallet /> Beli Sekarang 🚀
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Mockup UI — tombol hanya menampilkan toast, belum memproses pembayaran.</p>
            </section>
          </div>
        </div>
      </div>

      {/* Sticky bar mobile */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{pack?.label ?? "Pilih nominal"} · {pay?.name ?? "Belum pilih pembayaran"}</p>
            <p className="text-lg font-black leading-tight">{pack ? rupiah(total) : "—"}</p>
          </div>
          <Button type="button" size="lg" className="shrink-0 text-[#101419]" onClick={bayar}>
            Beli Sekarang 🚀
          </Button>
        </div>
      </div>
    </PublicLayout>
  );
}

function StepHead({ n, title, desc, optional }: { n: string; title: string; desc: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#101419] text-sm font-black text-[#ffd84d]">{n}</span>
      <div>
        <h2 className="font-black leading-tight">
          Langkah {n}: {title}{" "}
          {optional && <span className="ml-1 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-bold text-muted-foreground">Opsional</span>}
        </h2>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
