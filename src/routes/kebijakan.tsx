import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";

export const Route = createFileRoute("/kebijakan")({
  head: () => ({
    meta: [
      { title: "Kebijakan Layanan — BotakStore" },
      { name: "description", content: "Kebijakan layanan, privasi, dan pengembalian dana BotakStore." },
      { property: "og:title", content: "Kebijakan Layanan — BotakStore" },
      { property: "og:description", content: "Kebijakan layanan, privasi, dan pengembalian dana BotakStore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KebijakanPage,
});

const SECTIONS = [
  {
    title: "Keamanan Akun",
    body: "Kami tidak pernah meminta password melalui situs. Koordinasi login dilakukan admin via WhatsApp dengan format yang aman. Data akun hanya digunakan selama pengerjaan dan tidak disimpan setelah pesanan selesai.",
  },
  {
    title: "Pengerjaan & Progres",
    body: "Pengerjaan dimulai setelah pembayaran terverifikasi. Progres dapat dipantau kapan saja melalui halaman Cek Pesanan. Estimasi waktu tertera di setiap layanan dan dapat berubah sesuai kondisi antrian.",
  },
  {
    title: "Pembayaran",
    body: "Pembayaran tersedia via QRIS, e-wallet, dan virtual account. Pesanan yang tidak dibayar dalam batas waktu akan kedaluwarsa secara otomatis.",
  },
  {
    title: "Pengembalian Dana (Refund)",
    body: "Refund dapat diajukan jika pengerjaan belum dimulai atau hasil tidak sesuai kesepakatan. Pengajuan ditinjau admin maksimal 2x24 jam. Dana dikembalikan ke metode pembayaran awal.",
  },
  {
    title: "Privasi",
    body: "Data kontak dan identitas game kamu hanya digunakan untuk keperluan pesanan dan tidak dibagikan ke pihak ketiga.",
  },
];

function KebijakanPage() {
  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-3xl px-3 py-7 sm:px-4 sm:py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">Kebijakan Layanan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Syarat, keamanan, dan privasi penggunaan BotakStore.</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-8 sm:gap-4">
          {SECTIONS.map((s) => (
            <section key={s.title} className="rounded-xl border border-border bg-card p-3 sm:p-5">
              <h2 className="text-sm font-semibold sm:text-lg">{s.title}</h2>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground sm:text-sm sm:leading-5">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
