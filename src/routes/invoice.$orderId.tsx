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
  ExternalLink,
  FileText,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { forgetPakasirOrder } from "@/lib/actions";
import { ApiRequestError, cancelJokiInvoice, fetchPakasirInvoice, simulatePakasirPayment, uploadJokiPaymentProof, type PakasirInvoice } from "@/lib/api";
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

async function compressProofToWebp(file: File): Promise<File> {
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let release: () => void = () => {};

  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    release = () => bitmap.close();
  } else {
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Foto bukti pembayaran tidak dapat dibaca."));
        image.src = imageUrl;
      });
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
      release = () => URL.revokeObjectURL(imageUrl);
    } catch (error) {
      URL.revokeObjectURL(imageUrl);
      throw error;
    }
  }

  try {
    if (!width || !height) throw new Error("Foto bukti pembayaran tidak dapat dibaca.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Browser tidak dapat memproses foto bukti pembayaran.");

    for (const [maxEdge, quality] of [[2400, 0.86], [2000, 0.76], [1600, 0.7]] as const) {
      const scale = Math.min(1, maxEdge / Math.max(width, height));
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result?.type === "image/webp") resolve(result);
          else reject(new Error("Browser tidak mendukung kompresi WebP. Perbarui browser lalu coba lagi."));
        }, "image/webp", quality);
      });
      if (blob.size <= 5 * 1024 * 1024) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" });
      }
    }
    throw new Error("Foto masih terlalu besar setelah dikompres. Pilih foto lain.");
  } finally {
    release();
  }
}

function InvoicePage() {
  const { orderId } = Route.useParams();
  const [invoice, setInvoice] = useState<PakasirInvoice | null>(null);
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [compressingProof, setCompressingProof] = useState(false);
  const [error, setError] = useState("");
  const [clock, setClock] = useState(Date.now());

  const loadInvoice = useCallback(async (refresh: boolean, silent = false) => {
    if (!silent) setChecking(true);
    try {
      const data = await fetchPakasirInvoice(orderId, refresh);
      setInvoice(data);
      setError("");
    } catch (cause) {
      if (!silent || (cause instanceof ApiRequestError && [404, 410].includes(cause.status))) {
        setError(cause instanceof Error ? cause.message : "Invoice gagal dimuat.");
      }
      if (cause instanceof ApiRequestError && [404, 410].includes(cause.status)) {
        setInvoice(null);
        forgetPakasirOrder(orderId);
      }
    } finally {
      setLoading(false);
      if (!silent) setChecking(false);
    }
  }, [orderId]);

  useEffect(() => {
    setInvoice(null);
    setQrImage("");
    setQrError(false);
    setProofFile(null);
    setLoading(true);
    void loadInvoice(false);
  }, [loadInvoice]);

  useEffect(() => {
    if (!invoice || invoice.status !== "pending") return;
    const interval = window.setInterval(() => {
      void loadInvoice(true, true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, [invoice?.status, loadInvoice]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!invoice?.is_dynamic_qris || invoice.status !== "pending" || !invoice.expired_at || invoice.payment_proof_status) return;
    const delay = new Date(invoice.expired_at).getTime() - Date.now();
    const timeout = window.setTimeout(() => void loadInvoice(false, true), Math.max(0, delay) + 200);
    return () => window.clearTimeout(timeout);
  }, [invoice?.expired_at, invoice?.is_dynamic_qris, invoice?.payment_proof_status, loadInvoice]);

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

  useEffect(() => () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
  }, [proofPreview]);

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

  const cancelInvoice = async () => {
    if (!window.confirm("Batalkan dan hapus invoice ini? Pesanan yang belum dibayar akan ikut dihapus.")) return;
    setCanceling(true);
    try {
      const response = await cancelJokiInvoice(orderId);
      setInvoice(null);
      forgetPakasirOrder(orderId);
      setError(response.message);
      toast.success(response.message);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Invoice gagal dibatalkan.");
      await loadInvoice(false, true);
    } finally {
      setCanceling(false);
    }
  };

  const uploadProof = async () => {
    if (!proofFile) {
      toast.error("Pilih foto bukti pembayaran terlebih dahulu.");
      return;
    }
    setUploadingProof(true);
    setCompressingProof(true);
    try {
      const compressed = await compressProofToWebp(proofFile);
      setCompressingProof(false);
      const response = await uploadJokiPaymentProof(orderId, compressed);
      toast.success(response.message);
      if (proofPreview) URL.revokeObjectURL(proofPreview);
      setProofFile(null);
      setProofPreview("");
      setProofOpen(false);
      await loadInvoice(false, true);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Bukti pembayaran gagal diunggah.");
    } finally {
      setCompressingProof(false);
      setUploadingProof(false);
    }
  };

  const selectProof = (file: File | null) => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    if (file && (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 20 * 1024 * 1024)) {
      setProofFile(null);
      setProofPreview("");
      toast.error("Gunakan foto JPG, PNG, atau WebP maksimal 20 MB.");
      return;
    }
    setProofFile(file);
    setProofPreview(file ? URL.createObjectURL(file) : "");
  };

  const changeProofModal = (open: boolean) => {
    if (uploadingProof) return;
    setProofOpen(open);
    if (!open) selectProof(null);
  };

  const method = invoice ? pakasirMethod(invoice.payment_method) : null;
  const expired = invoice?.expired_at
    ? new Date(invoice.expired_at).getTime() <= clock
    : false;
  const completed = invoice?.status === "completed";
  const canceled = invoice?.status === "canceled" || invoice?.status === "failed";
  const awaitingConfirmation = invoice?.payment_proof_status === "submitted";
  const remainingSeconds = invoice?.is_dynamic_qris && invoice.expired_at && !awaitingConfirmation
    ? Math.max(0, Math.ceil((new Date(invoice.expired_at).getTime() - clock) / 1000))
    : null;

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
              {completed ? "Pembayaran berhasil" : canceled ? "Pembayaran dibatalkan" : expired ? "Waktu pembayaran berakhir" : awaitingConfirmation ? "Menunggu konfirmasi admin" : "Menunggu pembayaran"}
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
            <h2 className="mt-3 text-lg font-black text-[#101827]">Invoice tidak tersedia</h2>
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
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#ecd46e] bg-[#fffbed] px-3 py-2.5 text-xs leading-5 text-[#715700]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{invoice.is_dynamic_qris ? <><strong className="font-black">QRIS dinamis.</strong> Nominal QRIS dibuat otomatis sesuai total invoice.</> : <><strong className="font-black">Mode uji coba pembayaran.</strong> Pembayaran ini belum diproses secara riil.</>}</span></div>
                <div className="mt-5 space-y-3 text-sm">
                  <MoneyRow label="Harga pesanan" value={rupiah(invoice.base_amount ?? invoice.amount)} />
                  {(invoice.discount ?? 0) > 0 && <MoneyRow label={`Diskon${invoice.coupon_code ? ` (${invoice.coupon_code})` : ""}`} value={`-${rupiah(invoice.discount ?? 0)}`} />}
                  <MoneyRow label="Biaya layanan" value={rupiah(invoice.fee ?? 0)} />
                  <div className="flex items-center justify-between gap-4 border-t border-[#e4e7ec] pt-4"><span className="font-black text-[#101827]">Total bayar</span><span className="text-xl font-black tabular-nums text-[#8a6800]">{rupiah(invoice.total_payment ?? invoice.amount)}</span></div>
                </div>
              </section>
            </div>

            <section className="order-first overflow-hidden rounded-3xl border border-[#ecd46e] bg-white shadow-[0_20px_48px_-34px_rgba(104,76,0,.3)] lg:order-last lg:sticky lg:top-24">
              <div className="border-b border-[#ecd46e] bg-[#fff5ca] px-4 py-4 sm:px-5"><h2 className="flex items-center gap-2 font-black text-[#101827]"><ShieldCheck className="h-5 w-5 text-[#8a6800]" /> {completed ? "Pembayaran selesai" : awaitingConfirmation ? "Menunggu konfirmasi admin" : "Selesaikan pembayaran"}</h2><p className="mt-1 text-xs text-[#68758b]">{method?.name ?? invoice.payment_method}{invoice.is_dynamic_qris ? " · Nominal otomatis" : invoice.is_sandbox ? " · Sandbox" : ""}</p></div>
              <div className="p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-[#fff8df] px-4 py-3"><span className="text-sm font-semibold text-[#596579]">Total bayar</span><strong className="text-lg font-black tabular-nums text-[#735500]">{rupiah(invoice.total_payment ?? invoice.amount)}</strong></div>
                {completed ? (
                  <div className="py-5 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check className="h-8 w-8" /></span><p className="mt-4 font-black text-[#101827]">Pembayaran diterima</p><p className="mt-1 text-sm leading-6 text-[#68758b]">Pesanan akan diproses. Pantau progresnya melalui Cek Pesanan.</p></div>
                ) : canceled || expired ? (
                  <div className="py-5 text-center"><Clock3 className="mx-auto h-10 w-10 text-red-500" /><p className="mt-4 font-black text-[#101827]">Transaksi tidak aktif</p><p className="mt-1 text-sm leading-6 text-[#68758b]">Buat pesanan baru untuk mendapatkan kode pembayaran yang aktif.</p></div>
                ) : awaitingConfirmation ? (
                  <div className="py-5 text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff1b3] text-[#8a6800]"><Clock3 className="h-8 w-8" /></span><p className="mt-4 font-black text-[#101827]">Bukti pembayaran terkirim</p><p className="mt-1 text-sm leading-6 text-[#68758b]">Admin sedang memeriksa pembayaran kamu. Invoice akan otomatis berubah saat pembayaran dikonfirmasi.</p></div>
                ) : invoice.qr_string ? (
                  <>
                    <p className="text-center text-sm font-bold text-[#101827]">Scan QRIS untuk membayar</p>
                    <div className="mx-auto mt-3 grid aspect-square w-full max-w-[272px] place-items-center rounded-2xl border border-[#e4e7ec] bg-white p-3">
                      {qrImage ? <img src={qrImage} alt={`Kode QRIS untuk invoice ${invoice.order_id}`} width={256} height={256} className="h-full w-full object-contain" /> : qrError ? <p role="alert" className="px-4 text-center text-sm text-red-700">QRIS gagal ditampilkan. Salin kode QRIS di bawah untuk melanjutkan.</p> : <LoaderCircle className="h-6 w-6 animate-spin text-[#8a6800]" />}
                    </div>
                    <p className="mt-3 text-center text-xs leading-5 text-[#68758b]">Buka aplikasi bank atau e-wallet, pilih Scan QRIS, lalu bayar sesuai total invoice.</p>
                    {qrError && <Button type="button" variant="outline" onClick={() => void copy(invoice.qr_string!, "Kode QRIS")} className="mt-4 min-h-11 w-full"><ClipboardCopy className="h-4 w-4" /> Salin kode QRIS</Button>}
                    {invoice.order_type === "joki" && !expired && (
                      <Button type="button" onClick={() => setProofOpen(true)} className="mt-3 min-h-11 w-full bg-[#ffd84d] text-sm font-black text-[#17191d] shadow-[0_10px_24px_-16px_rgba(138,104,0,.8)] hover:bg-[#f2c425]"><CircleCheck className="h-4 w-4" /> Pembayaran Sudah Selesai</Button>
                    )}
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

                {!completed && !canceled && !awaitingConfirmation && invoice.expired_at && <p className={`mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs leading-5 ${expired ? "bg-red-50 text-red-700" : "bg-[#f7f8fa] text-[#596579]"}`}><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> {remainingSeconds !== null ? `Sisa waktu transfer ${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}. Invoice otomatis dihapus jika bukti belum dikirim.` : `Batas pembayaran: ${formatTime(invoice.expired_at)}`}</p>}
                {invoice.is_dynamic_qris && !completed && !canceled && !awaitingConfirmation && !expired && (
                  <Button type="button" variant="outline" onClick={() => void cancelInvoice()} disabled={canceling || uploadingProof} className="mt-3 min-h-11 w-full border-red-200 font-bold text-red-700 hover:bg-red-50 hover:text-red-800">
                    {canceling ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Batalkan invoice
                  </Button>
                )}
                {invoice.is_sandbox && !invoice.is_dynamic_qris && !completed && !canceled && !expired && (
                  <Button type="button" onClick={() => void simulatePayment()} disabled={simulating} className="mt-4 min-h-11 w-full bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425]">
                    {simulating ? <LoaderCircle className="animate-spin" /> : <Check />} {simulating ? "Memproses simulasi..." : "Simulasikan pembayaran berhasil"}
                  </Button>
                )}
                {error && <p role="alert" className="mt-4 text-xs text-red-700">{error}</p>}
                <p className="mt-3 text-center text-xs leading-5 text-[#7b8798]">Status diperbarui otomatis setiap 15 detik selama menunggu pembayaran.</p>
              </div>
            </section>
          </div>
        )}
      </div>
      {invoice && (
        <Dialog open={proofOpen} onOpenChange={changeProofModal}>
          <DialogContent className="bottom-3 left-3 right-3 top-auto w-auto max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:bottom-auto sm:left-[50%] sm:right-auto sm:top-[50%] sm:w-full sm:max-w-md sm:translate-x-[-50%] sm:translate-y-[-50%]">
            <DialogHeader className="border-b border-[#ecd46e] bg-[#fff5ca] px-5 pb-4 pt-5 text-left sm:px-6 sm:pb-5 sm:pt-6">
              <span className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-[#ffd84d] text-[#17191d]"><Upload className="h-5 w-5" /></span>
              <DialogTitle className="pr-8 text-xl font-black text-[#101827]">Unggah bukti pembayaran</DialogTitle>
              <DialogDescription className="text-xs leading-5 text-[#68758b]">Pastikan nominal pada bukti sama dengan total invoice <strong className="text-[#202738]">{rupiah(invoice.total_payment ?? invoice.amount)}</strong>.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[65vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#f7f8fa] px-3 py-2.5">
                <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-[#8390a3]">Nomor invoice</p><p className="mt-0.5 truncate font-mono text-xs font-black text-[#202738]">{invoice.order_id}</p></div>
                <button type="button" onClick={() => void copy(invoice.order_id, "Nomor invoice")} className="shrink-0 rounded-lg border border-[#dce3ec] bg-white px-2.5 py-2 text-xs font-bold text-[#596579]">Salin</button>
              </div>
              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[#ddc04b] bg-[#fffdf5] p-3 text-center transition hover:bg-[#fff8df] focus-within:ring-2 focus-within:ring-[#ffd84d]/50">
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectProof(event.target.files?.[0] ?? null)} className="sr-only" />
                {proofPreview ? (
                  <img src={proofPreview} alt="Pratinjau bukti pembayaran" className="mx-auto max-h-52 w-full rounded-xl object-contain" />
                ) : (
                  <div className="grid min-h-36 place-items-center px-3 py-5">
                    <span><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd84d] text-[#17191d]"><ImagePlus className="h-6 w-6" /></span><strong className="mt-3 block text-sm text-[#101827]">Pilih foto bukti transfer</strong><span className="mt-1 block text-xs leading-5 text-[#7b8798]">JPG, PNG, atau WebP · maksimal 20 MB · otomatis dikompres ke WebP</span></span>
                  </div>
                )}
              </label>
              {proofFile && <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-bold text-[#596579]">{proofFile.name}</span><button type="button" onClick={() => selectProof(null)} className="shrink-0 font-black text-red-600">Hapus</button></div>}
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => changeProofModal(false)} disabled={uploadingProof} className="min-h-11 order-2 font-bold sm:order-1">Batal</Button>
                <Button type="button" onClick={() => void uploadProof()} disabled={!proofFile || uploadingProof} className="min-h-11 order-1 bg-[#ffd84d] font-black text-[#17191d] hover:bg-[#f2c425] sm:order-2">{uploadingProof ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{compressingProof ? "Mengompres..." : uploadingProof ? "Mengunggah..." : "Kirim bukti"}</Button>
              </div>
              <p className="mt-3 text-center text-[11px] leading-4 text-[#7b8798]">Setelah dikirim, status berubah menjadi menunggu konfirmasi admin.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PublicLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs text-[#718096]">{label}</p><p className="mt-1 break-words font-bold text-[#202738]">{value}</p></div>;
}

function MoneyRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-[#68758b]">{label}</span><span className="font-bold tabular-nums text-[#202738]">{value}</span></div>;
}
