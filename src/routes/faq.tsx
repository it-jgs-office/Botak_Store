import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — BotakStore" },
      { name: "description", content: "Pertanyaan yang sering ditanyakan seputar layanan joki Mobile Legends di BotakStore." },
      { property: "og:title", content: "FAQ — BotakStore" },
      { property: "og:description", content: "Pertanyaan yang sering ditanyakan seputar layanan joki Mobile Legends di BotakStore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  { q: "Apakah akun saya aman?", a: "Aman. Kami tidak pernah meminta password di halaman order. Admin akan menghubungi kamu via WhatsApp untuk format login yang aman, dan akun dikembalikan setelah pengerjaan selesai." },
  { q: "Berapa lama pengerjaan joki?", a: "Estimasi tertera di setiap layanan. Untuk joki rank umumnya 1–3 hari tergantung selisih rank. Kamu bisa memantau progres lewat halaman Cek Pesanan." },
  { q: "Bagaimana cara membayar?", a: "Kami mendukung QRIS, e-wallet, dan virtual account. Pembayaran dilakukan setelah pesanan dibuat, melalui halaman cek pesanan." },
  { q: "Bisakah request hero tertentu?", a: "Bisa. Tulis request hero atau role di kolom catatan saat memesan, dan jokier akan mengusahakannya." },
  { q: "Bagaimana jika hasil tidak sesuai?", a: "Ajukan tiket bantuan atau refund. Admin akan meninjau dan memproses sesuai kebijakan pengembalian dana." },
];

function FaqPage() {
  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Pertanyaan Umum (FAQ)</h1>
        <p className="mt-2 text-muted-foreground">Jawaban atas pertanyaan yang paling sering masuk ke tim kami.</p>
        <Accordion type="single" collapsible className="mt-8">
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
