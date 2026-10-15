import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import * as QRCode from "qrcode";
import {
  ArrowLeft,
  Check,
  CircleCheck,
  ClipboardCopy,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { fetchPakasirInvoice, simulatePakasirPayment, type PakasirInvoice } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { pakasirMethod } from "@/lib/pakasir";

export const Route = createFileRoute("/invoice/$orderId")({
  head: () => ({
    meta: [
      { title: "Invoice & Pembayaran — BotakStore" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InvoicePage,
});

function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(date) + " WIB";
}

function InvoicePage() {
  const { orderId } = Route.useParams();
  const [invoice, setInvoice] = useState<PakasirInvoice | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(Date.now());

  const loadInvoice = useCallback(async (refresh: boolean, silent = false) => {
    if (!silent) setChecking(true);
    try {
      const data = await fetchPakasirInvoice(orderId, refresh);
      setInvoice(data);
      setError("");
    } catch (cause) {
      if (!silent) setError(cause instanceof Error ? cause.message : "Invoice gagal dimuat.");
    } finally {
      setLoading(false);
      if (!silent) setChecking(false);
    }
  }, [orderId]);

  useEffect(() => {
    setInvoice(null);
    setQrImage("");
    setQrError(false);
    setLoading(true);
    void loadInvoice(false);
  }, [loadInvoice]);

  useEffect(() => {
    if (!invoice || invoice.status !== "pending") return;
    const interval = window.setInterval(() => {
      setClock(Date.now());
      void loadInvoice(true, true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [invoice?.status, loadInvoice]);

  useEffect(() => {
    if (!invoice?.qr_string) {
      setQrImage("");
      setQrError(false);
      return;
    }
    let active = true;
    setQrError(false);
    void QRCode.toDataURL(invoice.qr_string, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#101419", light: "#ffffff" },
    }).then((image) => {
      if (active) setQrImage(image);
    }).catch(() => {
      if (active) setQrError(true);
    });
    return () => { active = false; };
  }, [invoice?.qr_string]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} disalin.`);
    } catch {
      toast.error(`${label} gagal disalin.`);
    }
  };

  const simulatePayment = async () => {
    setSimulating(true);
    try {
      const response = await simulatePakasirPayment(orderId);
      toast.success(response.message);
      await loadInvoice(false, true);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Simulasi pembayaran gagal.");
    } finally {
      setSimulating(false);
    }
  };

  const method = invoice ? pakasirMethod(invoice.payment_method) : null;
  const expired = invoice?.expired_at
    ? new Date(invoice.expired_at).getTime() <= clock
    : false;
  const completed = invoice?.status === "completed";
  const canceled = invoice?.status === "canceled" || invoice?.status === "failed";

  return (
    <PublicLayout banner="none" showFaq={false} footerGap="tight" serviceNavigation="orders">
      <div className="mx-auto w-full max-w-6xl px-3 pb-10 pt-5 sm:px-4 sm:pb-16 sm:pt-8">
        <Link to="/cek-order" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#596579] transition hover:text-[#8a6800] focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-[#d7aa00]">
          <ArrowLeft className="h-4 w-4" /> Cek Pesanan
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.14em] text-[#9a7500]">BotakStore</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#101827] sm:text-3xl">Invoice & Pembayaran</h1>
            <p className="mt-2 text-sm text-[#68758b]">Simpan nomor invoice untuk memantau pesanan kapan saja.</p>
          </div>
          {invoice && (
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${completed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : canceled || expired ? "border-red-200 bg-red-50 text-red-700" : "border-[#ecd46e] bg-[#fff8df] text-[#735500]"}`}>
              {completed ? <CircleCheck className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
              {completed ? "Pembayaran berhasil" : canceled ? "Pembayaran dibatalkan" : expired ? "Waktu pembayaran berakhir" : "Menunggu pembayaran"}
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl border border-[#e4e7ec] bg-white text-[#68758b]" role="status">
            <LoaderCircle className="mr-2 h-5 w-5 animate-spin" /> Memuat invoice...
          </div>
        ) : !invoice ? (
          <div className="mt-6 rounded-3xl border border-[#e4e7ec] bg-white px-5 py-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#b1bac8]" />
            <h2 className="mt-3 text-lg font-black text-[#101827]">Invoice belum dapat ditampilkan</h2>
            <p role="alert" className="mt-2 text-sm text-[#68758b]">{error || "Periksa kembali tautan invoice kamu."}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => void loadInvoice(false)} disabled={checking} className="bg-[#ffd84d] text-[#17191d] hover:bg-[#f2c425]"><RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> Coba lagi</Button>
              <Button asChild variant="outline"><Link to="/cek-order">Cek Pesanan</Link></Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
            <div className="space-y-4">
              <section className="overflow-hidden rounded-3xl border border-[#e4e7ec] bg-white shadow-[0_16px_45px_-38px_rgba(31,42,61,.45)]">
                <div className="flex items-center gap-3 border-b border-[#e8eaf0] bg-[#fffaf0] px-4 py-4 sm:px-6">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ffd84d] text-[#17191d]"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><h2 className="font-black text-[#101827]">Detail pesanan</h2><p className="text-xs text-[#68758b]">Invoice resmi BotakStore</p></div>
                </div>
                <div className="space-y-5 p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f7f8fa] p-3 sm:p-4">
                    <div className="min-w-0"><p className="text-xs text-[#68758b]">Nomor invoice</p><p className="mt-1 break-all font-mono text-sm font-bold text-[#101827]">{invoice.order_id}</p></div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void copy(invoice.order_id, "Nomor invoice")} className="shrink-0"><ClipboardCopy className="h-4 w-4" /> Salin</Button>
                  </div>
                  <div className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                    <Detail label="Tanggal pesanan" value={formatTime(invoice.created_at)} />
                    <Detail label="Jenis pesanan" value={invoice.order_type === "topup" ? "Top Up Game" : "Joki Game"} />
                    {invoice.game_name && <Detail label="Game" value={invoice.game_name} />}
                    {invoice.game_user_id && <Detail label="User ID" value={invoice.game_user_id} />}
                    {invoice.game_server_id && <Detail label="Server ID" value={invoice.game_server_id} />}
                    {invoice.quantity && invoice.quantity > 1 && <Detail label="Jumlah" value={String(invoice.quantity)} />}
                  </div>
                  <div className="border-t border-dashed border-[#dce3ec] pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8390a3]">Layanan</p>
                    <p className="mt-1 font-bold leading-6 text-[#101827]">{invoice.description}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-[#e4e7ec] bg-white p-4 shadow-[0_16px_45px_-38px_rgba(31,42,61,.45)] sm:p-6">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1b3] text-[#8a6800]"><CreditCard className="h-5 w-5" /></span><div><h2 className="font-black text-[#101827]">Rincian pembayaran</h2><p className="text-xs text-[#68758b]">{method?.name ?? invoice.payment_method}</p></div></div>
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#ecd46e] bg-[#fffbed] px-3 py-2.5 text-xs leading-5 text-[#715700]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span><strong className="font-black">Mode uji coba pembayaran.</strong> Pembayaran ini belum diproses secara riil.</span></div>
                <div className="mt-5 space-y-3 text-sm">
                  <MoneyRow label="Harga pesanan" value={rupiah(invoice.base_amount ?? invoice.amount)} />
                  {(invoice.discount ?? 0) > 0 && <MoneyRow label={`Diskon${invoice.coupon_code ? ` (${invoice.coupon_code})` : ""}`} value={`-${rupiah(invoice.discount ?? 0)}`} />}
                  <MoneyRow label="Biaya layanan" value={rupiah(invoice.fee ?? 0)} />
                  <div className="flex items-center justify-between gap-4 border-t border-[#e4e7ec] pt-4"><span className="font-black text-[#101827]">Total bayar</span><span className="text-xl font-black tabular-nums text-[#8a6800]">{rupiah(invoice.total_payment ?? invoice.amount)}</span></div>
                </div>
              </section>
            </div>

            <section className="order-first overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_20px_48px_-34px_rgba(104,76,0,.3)] lg:order-last lg:sticky lg:top-24">
              <div className="border-b border-[#ecd46e] bg-[#fff5ca] px-4 py-4 sm:px-5"><h2 className="flex items-center gap-2 font-black text-[#101827]"><ShieldCheck className="h-5 w-5 text-[#8a6800]" /> {completed ? "Pembayaran selesai" : "Selesaikan pembayaran"}</h2><p className="mt-1 text-xs text-[#68758b]">{method?.name ?? invoice.payment_method}{invoice.is_sandbox ? " · Sandbox" : ""}</p></div>
              <div className="p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#fff8df] px-4 py-3"><span className="text-sm font-semibold text-[#596579]">Total bayar</span><strong className="text-lg font-black tabular-nums text-[#735500]">{rupiah(invoice.total_payment ?? invoice.amount)}</strong></div>
                {completed ? (
                  <div className="py-5 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></span><p className="mt-4 font-black text-[#101827]">Pembayaran diterima</p><p className="mt-1 text-sm leading-6 text-[#68758b]">Pesanan akan diproses. Pantau progresnya melalui Cek Pesanan.</p></div>
                ) : canceled || expired ? (
                  <div className="py-5 text-center"><Clock3 className="mx-auto h-10 w-10 text-red-500" /><p className="mt-4 font-black text-[#101827]">Transaksi tidak aktif</p><p className="mt-1 text-sm leading-6 text-[#68758b]">Buat pesanan baru untuk mendapatkan kode pembayaran yang aktif.</p></div>
                ) : invoice.qr_string ? (
                  <>
                    <p className="text-center text-sm font-bold text-[#101827]">Scan QRIS untuk membayar</p>
                    <div className="mx-auto mt-3 grid aspect-square w-full max-w-[272px] place-items-center rounded-2xl border border-[#e4e7ec] bg-white p-3">
                      {qrImage ? <img src={qrImage} alt={`Kode QRIS untuk invoice ${invoice.order_id}`} width={256} height={256} className="h-full w-full object-contain" /> : qrError ? <p role="alert" className="px-4 text-center text-sm text-red-700">QRIS gagal ditampilkan. Salin kode QRIS di bawah untuk melanjutkan.</p> : <LoaderCircle className="h-6 w-6 animate-spin text-[#8a6800]" />}
                    </div>
                    <p className="mt-3 text-center text-xs leading-5 text-[#68758b]">Buka aplikasi bank atau e-wallet, pilih Scan QRIS, lalu bayar sesuai total invoice.</p>
                    {qrImage && <a href={qrImage} download={`QRIS-${invoice.order_id}.png`} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#d7aa00] bg-white px-4 text-sm font-bold text-[#735500] transition hover:bg-[#fff8df]"><Download className="h-4 w-4" /> Unduh QRIS</a>}
                    {qrError && <Button type="button" variant="outline" onClick={() => void copy(invoice.qr_string!, "Kode QRIS")} className="mt-4 min-h-11 w-full"><ClipboardCopy className="h-4 w-4" /> Salin kode QRIS</Button>}
                  </>
                ) : invoice.va_number ? (
                  <>
                    <p className="text-sm text-[#68758b]">Transfer tepat sesuai total invoice ke nomor berikut.</p>
                    <div className="mt-4 rounded-2xl border border-[#ecd46e] bg-[#fffaf0] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#8a6800]">{method?.name ?? "Virtual Account"}</p><p className="mt-2 break-all font-mono text-xl font-black tracking-wide text-[#101827]">{invoice.va_number}</p></div>
                    <Button type="button" variant="outline" onClick={() => void copy(invoice.va_number!, "Nomor Virtual Account")} className="mt-4 min-h-11 w-full"><ClipboardCopy className="h-4 w-4" /> Salin nomor VA</Button>
                  </>
                ) : invoice.payment_url ? (
                  <a href={invoice.payment_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffd84d] px-4 text-sm font-black text-[#17191d] transition hover:bg-[#f2c425]">Buka halaman pembayaran <ExternalLink className="h-4 w-4" /></a>
                ) : (
                  <p className="text-sm leading-6 text-[#68758b]">Instruksi pembayaran belum tersedia. Muat ulang status pembayaran.</p>
                )}

                {!completed && !canceled && invoice.expired_at && <p className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${expired ? "bg-red-50 text-red-700" : "bg-[#f7f8fa] text-[#596579]"}`}><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> Batas pembayaran: {formatTime(invoice.expired_at)}</p>}
                {invoice.is_sandbox && !completed && !canceled && !expired && (
                  <Button type="button" onClick={() => void simulatePayment()} disabled={simulating} className="mt-4 min-h-11 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]">
                    {simulating ? <LoaderCircle className="animate-spin" /> : <Check />} {simulating ? "Memproses simulasi..." : "Simulasikan pembayaran berhasil"}
                  </Button>
                )}
                {error && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}
                <Button type="button" variant="outline" onClick={() => void loadInvoice(true)} disabled={checking} className="mt-4 min-h-11 w-full"><RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} /> {checking ? "Memeriksa..." : "Perbarui status"}</Button>
                <p className="mt-3 text-center text-xs leading-5 text-[#7b8798]">Status diperbarui otomatis setiap 15 detik selama menunggu pembayaran.</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs text-[#718096]">{label}</p><p className="mt-1 break-words font-bold text-[#202738]">{value}</p></div>;
}

function MoneyRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-[#68758b]">{label}</span><span className="font-bold tabular-nums text-[#202738]">{value}</span></div>;
}
