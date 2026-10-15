import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — BotakStore" },
      { name: "description", content: "Pertanyaan yang sering ditanyakan seputar layanan joki Mobile Legends di BotakStore." },
      ...routeSeo("/faq", "FAQ — BotakStore", "Pertanyaan yang sering ditanyakan seputar layanan joki Mobile Legends di BotakStore."),
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  { q: "Layanan joki game apa yang tersedia?", a: "Saat ini layanan joki yang aktif hanya Mobile Legends. Valorant, PUBG Mobile, dan eFootball masih dalam tahap maintenance." },
  { q: "Apakah akun Mobile Legends saya aman?", a: "Data akun hanya digunakan untuk pengerjaan pesanan. Jangan login selama proses berlangsung dan segera ganti kata sandi setelah pesanan selesai." },
  { q: "Berapa lama pengerjaan joki?", a: "Estimasi mengikuti paket yang dipilih dan dapat dipantau menggunakan nomor pesanan pada halaman Cek Pesanan." },
  { q: "Bagaimana cara membayar?", a: "Pilih QRIS atau virtual account pada checkout. Invoice dan instruksi pembayaran langsung tampil setelah pesanan dibuat." },
  { q: "Bagaimana cara melihat status pesanan?", a: "Masukkan nomor pesanan pada halaman Cek Pesanan atau buka Riwayat Transaksi di halaman profil setelah login." },
  { q: "Pembayaran sudah berhasil tetapi status belum berubah?", a: "Tunggu pembaruan otomatis beberapa saat. Jika status tetap sama, hubungi CS dengan nomor pesanan dan bukti pembayaran." },
];

function FaqPage() {
  return (
    <PublicLayout showFaq={false}>
      <div className="mx-auto w-full max-w-3xl px-3 py-7 sm:px-4 sm:py-12">
        <h1 className="text-2xl font-bold sm:text-3xl">Pertanyaan Umum (FAQ)</h1>
        <p className="mt-2 text-sm text-muted-foreground">Jawaban atas pertanyaan yang paling sering masuk ke tim kami.</p>
        <Accordion type="single" collapsible className="mt-5 sm:mt-8">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </PublicLayout>
  );
}
