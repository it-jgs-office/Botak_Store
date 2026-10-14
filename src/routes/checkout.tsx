import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Field, NativeSelect, Panel } from "@/components/bs/ui";
import { PriceSummary } from "@/components/bs/PriceSummary";
import { calcPrice } from "@/lib/pricing";
import { recordPakasirOrder } from "@/lib/actions";
import { createPakasirPayment } from "@/lib/api";
import { ACTIVE_PAKASIR_PAYMENT_METHODS, type PakasirMethod } from "@/lib/pakasir";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Checkout() {
  const db = useDB();
  const draft = db.draft;
  const service = draft && db.services.find((s) => s.id === draft.serviceId);
  const game = service && db.games.find((g) => g.id === service.gameId);
  const [form, setForm] = useState({ name: "", email: "", phone: "", gameUserId: "", gameServerId: "", method: "qris" as PakasirMethod });
  const [creatingPayment, setCreatingPayment] = useState(false);
  const result = useMemo(() => service && draft ? calcPrice(service, draft, db.coupons) : null, [service, draft, db.coupons]);

  if (!draft || !service || !game || !result) {
    return <PublicLayout><div className="mx-auto w-full max-w-7xl px-4 py-24"><div className="mx-auto w-full max-w-xl text-center"><h1 className="text-2xl font-bold">Belum ada pesanan</h1><p className="mt-2 text-muted-foreground">Pilih paket joki Mobile Legends terlebih dahulu.</p><Button asChild className="mt-6"><Link to="/joki">Lihat paket MLBB</Link></Button></div></div></PublicLayout>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = [form.name, form.email, form.phone, form.gameUserId];
    if (required.some((v) => !v.trim())) {
      toast.error("Lengkapi data kontak dan ID Mobile Legends.");
      return;
    }
    setCreatingPayment(true);
    try {
      const payment = await createPakasirPayment({
        order_type: "joki",
        item_id: service.id,
        description: `Joki ${game.name} - ${service.name}`,
        amount: result.snapshot.total,
        payment_method: form.method,
        customer: {
          whatsapp: form.phone.trim(),
          email: form.email.trim(),
          user_id: form.gameUserId.trim(),
          server_id: form.gameServerId.trim() || undefined,
          customer_id: db.session?.role === "customer" ? db.session.userId : undefined,
          customer_name: form.name.trim(),
          game_id: game.id,
          game_name: game.name,
          note: draft.notes,
        },
      });
      recordPakasirOrder({
        orderId: payment.order_id,
        transactionId: payment.txn_id,
        amount: payment.total_payment ?? result.snapshot.total,
        method: payment.payment_method,
        game: { id: game.id, name: game.name },
        service: { id: service.id, name: service.name },
        customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
        gameUserId: form.gameUserId.trim(),
        gameServerId: form.gameServerId.trim() || undefined,
        note: draft.notes,
      });
      window.location.assign(`/invoice/${encodeURIComponent(payment.order_id)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Pembayaran gagal dibuat.");
      setCreatingPayment(false);
    }
  };

  return <PublicLayout><div className="mx-auto w-full max-w-7xl px-4 py-8"><Link to="/joki" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Kembali ke paket</Link><div className="grid gap-6 lg:grid-cols-[1fr_360px]"><form onSubmit={submit} className="space-y-6"><Panel title="Data pemesan"><div className="grid gap-4 sm:grid-cols-2"><Field label="Nama"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama lengkap" /></Field><Field label="Nomor WhatsApp"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></Field><Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" /></Field></div></Panel><Panel title="Data akun Mobile Legends"><div className="grid gap-4 sm:grid-cols-2"><Field label="User ID / ID game"><Input value={form.gameUserId} onChange={(e) => setForm({ ...form, gameUserId: e.target.value })} placeholder="Contoh: 12345678" /></Field><Field label="Server ID (opsional)"><Input value={form.gameServerId} onChange={(e) => setForm({ ...form, gameServerId: e.target.value })} placeholder="Contoh: 2041" /></Field></div><p className="mt-3 text-xs text-muted-foreground">Jangan kirim password di halaman ini. Admin akan menghubungi WhatsApp untuk format login yang aman.</p></Panel><Panel title="Metode pembayaran"><Field label="Pilih metode"><NativeSelect value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as PakasirMethod })}>{ACTIVE_PAKASIR_PAYMENT_METHODS.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</NativeSelect></Field></Panel><Button type="submit" size="lg" disabled={creatingPayment} className="w-full shadow-glow">{creatingPayment ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}{creatingPayment ? "Membuat invoice..." : "Lanjutkan pembayaran"}</Button></form><div className="lg:sticky lg:top-20 lg:h-fit"><PriceSummary gameName={game.name} serviceName={service.name} draft={draft} service={service} snapshot={result.snapshot} /></div></div></div></PublicLayout>;
}
