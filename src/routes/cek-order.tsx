import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { OrderStatusBadge, Panel } from "@/components/bs/ui";
import { useDB } from "@/lib/store";

export const Route = createFileRoute("/cek-order")({ component: CheckOrder });

function CheckOrder() {
  const db = useDB();
  const [query, setQuery] = useState("");
  const order = useMemo(() => query.trim() ? db.orders.find((o) => o.id.toLowerCase() === query.trim().toLowerCase() || o.invoice.toLowerCase() === query.trim().toLowerCase()) : null, [db.orders, query]);
  return <PublicLayout><div className="mx-auto w-full max-w-7xl px-4 py-16"><div className="mx-auto w-full max-w-2xl"><h1 className="text-3xl font-bold">Cek Pesanan</h1><p className="mt-2 text-muted-foreground">Masukkan nomor pesanan atau invoice untuk melihat status joki Mobile Legends.</p><div className="mt-6 flex gap-2"><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="BS-JK-... atau INV/..." /><Button onClick={() => setQuery(query.trim())}><Search /> Cek</Button></div>{query && !order && <p className="mt-4 text-sm text-destructive">Pesanan tidak ditemukan. Periksa kembali nomor pesanan.</p>}{order && <Panel className="mt-6" title={order.detail.serviceName}><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-sm">{order.id}</p><p className="mt-1 text-sm text-muted-foreground">{order.detail.fromRank && `${order.detail.fromRank} → ${order.detail.toRank}`}{order.detail.stars ? `${order.detail.stars} bintang` : ""}</p></div><OrderStatusBadge status={order.status} /></div><p className="mt-4 text-sm text-muted-foreground">Progres pengerjaan: <span className="font-semibold text-foreground">{order.progress}%</span></p></Panel>}<Button asChild variant="outline" className="mt-8"><Link to="/joki">Pesan paket MLBB</Link></Button></div></div></PublicLayout>;
}
