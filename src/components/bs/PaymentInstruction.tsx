import { ClipboardCopy, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import type { PakasirPayment } from "@/lib/api";

export function PaymentInstruction({ payment, onClose }: { payment: PakasirPayment; onClose: () => void }) {
  const reference = payment.va_number ?? payment.qr_string ?? "";
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Kode pembayaran disalin.");
    } catch {
      toast.error("Kode pembayaran tidak dapat disalin.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label="Instruksi pembayaran">
      <section className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#9a7500]">Pembayaran dibuat</p><h2 className="mt-1 text-xl font-black text-[#172033]">Selesaikan pembayaran</h2></div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#e3e7ed]" aria-label="Tutup"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 rounded-2xl bg-[#fff8df] p-4">
          <p className="text-xs text-[#68758b]">Nomor pesanan</p><p className="mt-1 font-mono text-sm font-black text-[#202738]">{payment.order_id}</p>
          <p className="mt-4 text-xs text-[#68758b]">Total pembayaran</p><p className="mt-1 text-xl font-black text-[#8a6800]">{rupiah(payment.total_payment ?? payment.amount)}</p>
        </div>
        {reference && <div className="mt-4"><p className="text-sm font-black text-[#202738]">{payment.va_number ? "Nomor Virtual Account" : "Kode QRIS"}</p><div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 break-all rounded-xl border border-[#e3e7ed] bg-[#f8fafc] px-3 py-2 text-xs text-[#3d4858]">{reference}</code><Button type="button" variant="outline" size="icon" onClick={copyReference} aria-label="Salin kode"><ClipboardCopy className="h-4 w-4" /></Button></div></div>}
        <p className="mt-4 text-xs leading-5 text-[#68758b]">Setelah pembayaran berhasil, status pesanan akan diperbarui otomatis.</p>
      </section>
    </div>
  );
}
