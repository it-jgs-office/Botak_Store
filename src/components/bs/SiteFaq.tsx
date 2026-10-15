import { CircleQuestionMark, Headphones } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useDB } from "@/lib/store";

const FAQS = [
  {
    q: "Layanan joki game apa yang tersedia?",
    a: "Saat ini layanan joki yang aktif hanya Mobile Legends. Valorant, PUBG Mobile, dan eFootball masih maintenance.",
  },
  {
    q: "Berapa lama proses joki?",
    a: "Estimasi tampil pada setiap paket Mobile Legends dan progres dapat dipantau menggunakan nomor pesanan.",
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Pembayaran tersedia melalui QRIS dan virtual account Pakasir yang tampil langsung pada halaman invoice.",
  },
  {
    q: "Apakah bisa request hero atau role tertentu?",
    a: "Bisa. Tulis hero, role, atau kebutuhan lain pada catatan pesanan sebelum melakukan pembayaran.",
  },
  {
    q: "Bagaimana cara memantau progres pesanan?",
    a: "Gunakan halaman Cek Pesanan dengan nomor order kamu atau buka Riwayat Transaksi pada halaman profil.",
  },
  {
    q: "Apakah boleh login ke akun saat pengerjaan berlangsung?",
    a: "Jangan login selama pengerjaan agar progres tidak terganggu. Pantau perubahan status melalui halaman profil atau Cek Pesanan.",
  },
  {
    q: "Bisakah pesanan dibatalkan?",
    a: "Hubungi CS dengan nomor pesanan. Pembatalan akan ditinjau berdasarkan status pembayaran dan progres pengerjaan.",
  },
  {
    q: "Bagaimana jika target tidak tercapai?",
    a: "Hubungi CS melalui WhatsApp dengan nomor pesanan agar progres dan opsi penyelesaiannya dapat diperiksa.",
  },
];

export function SiteFaq() {
  const db = useDB();

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-5 pt-7 sm:px-4 sm:pb-6 sm:pt-10 md:pb-8 md:pt-14">
      <div className="mb-4 grid gap-3 sm:mb-5 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-4">
        <span className="hidden sm:block" />
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#ecd46e] bg-[#fff6cd] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-[#806200]">
            <CircleQuestionMark className="h-3.5 w-3.5" /> FAQ
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-[#111827] sm:mt-3 sm:text-2xl md:text-3xl">
            Pertanyaan Umum
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-[#6b7890] sm:mt-2 sm:text-sm sm:leading-6">
            Beberapa pertanyaan yang sering ditanyakan oleh pelanggan kami.
          </p>
        </div>
        <a
          href={`https://wa.me/${db.settings.whatsapp}`}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#dfe3ea] bg-white px-4 py-2.5 text-xs font-black text-[#263044] shadow-sm transition hover:border-[#e8c338] hover:bg-[#fffaf0] sm:mx-0 sm:justify-self-end"
        >
          <Headphones className="h-4 w-4" /> Hubungi CS
        </a>
      </div>
      <Accordion
        type="single"
        collapsible
        className="divide-y divide-[#e8ebef] overflow-hidden rounded-xl border border-[#e1e5eb] bg-white px-3 shadow-[0_18px_45px_-34px_rgba(31,42,61,.3)] sm:rounded-2xl sm:px-6"
      >
        {FAQS.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q} className="border-b-0">
            <AccordionTrigger className="gap-2 py-3 text-left text-xs font-black text-[#222a38] hover:no-underline sm:gap-4 sm:py-4 sm:text-sm [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-[#e7b500]">
              <span className="flex items-center gap-2 sm:gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1b1b20] text-xs font-black text-[#ffd22f] sm:h-7 sm:w-7 sm:text-sm">
                  ?
                </span>
                {faq.q}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pl-8 pr-6 text-xs leading-5 text-[#66728a] sm:pb-4 sm:pl-10 sm:pr-8 sm:text-sm sm:leading-6">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
