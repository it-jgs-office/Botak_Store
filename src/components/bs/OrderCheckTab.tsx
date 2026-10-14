import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge, Panel } from "./ui";
import { fetchPublicOrder, type PublicOrder } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { buildSeed } from "@/lib/seed";
import { useDB } from "@/lib/store";

export function OrderCheckTab() {
  const db = useDB();
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [remoteOrder, setRemoteOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const localOrder = useMemo(() => searchedQuery
    ? db.orders.find((item) =>
      item.id.toLowerCase() === searchedQuery.toLowerCase()
      || item.invoice.toLowerCase() === searchedQuery.toLowerCase(),
    ) ?? null
    : null, [db.orders, searchedQuery]);
  const order = remoteOrder ?? localOrder;
  const demoOrders = useMemo(() => buildSeed().orders.slice(0, 5), []);

  const checkOrder = async () => {
    const value = query.trim();
    setSearchedQuery(value);
    setRemoteOrder(null);
    setSearchError("");
    if (!value) return;

    setLoading(true);
    try {
      const response = await fetchPublicOrder(value);
      setRemoteOrder(response.data);
    } catch (error) {
      const hasLocalOrder = db.orders.some((item) =>
        item.id.toLowerCase() === value.toLowerCase()
        || item.invoice.toLowerCase() === value.toLowerCase(),
      );
      if (!hasLocalOrder) setSearchError(error instanceof Error ? error.message : "Pesanan tidak ditemukan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-[#e7e9ed] bg-white p-4 shadow-[0_20px_55px_-38px_rgba(31,42,61,.28)] sm:mb-8 sm:rounded-[2rem] sm:p-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-[#ffe47d] text-[#171c25] sm:h-11 sm:w-11 sm:rounded-xl">
          <ClipboardList className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Cek Pesanan</h2>
        <p className="mt-2 text-sm text-[#6b7890]">
          Masukkan nomor pesanan atau invoice untuk melihat status pembayaran dan pesanan.
        </p>
        <div className="mt-5 flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BS-JK-... atau INV/..."
            className="h-11 text-left"
          />
          <Button className="h-11 px-5" onClick={checkOrder} disabled={loading}>
            <Search /> {loading ? "Memuat..." : "Cek"}
          </Button>
        </div>
        {searchedQuery && !loading && !order && (
          <p className="mt-4 text-sm text-destructive">
            {searchError || "Pesanan tidak ditemukan. Periksa kembali nomor pesanan."}
          </p>
        )}
        {order && (
          <Panel className="mt-5 text-left" title={order.detail.serviceName}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm">{order.id}</p>
                <p className="mt-1 text-sm text-muted-foreground">{orderTarget(order)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Progres pengerjaan:{" "}
              <span className="font-semibold text-foreground">{order.progress}%</span>
            </p>
            {(order.id.startsWith("BS-TOPUP-") || order.id.startsWith("BS-JOKI-")) && (
              <a
                href={`/invoice/${encodeURIComponent(order.id)}`}
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#ffd84d] px-4 text-sm font-black text-[#17191d] transition hover:bg-[#f2c425]"
              >
                Lihat invoice & pembayaran
              </a>
            )}
          </Panel>
        )}
      </div>

      <div className="mt-7 text-center sm:mt-10">
        <h3 className="font-black text-[#121827]">Contoh Pesanan</h3>
        <p className="mt-0.5 text-xs text-[#68758b]">Menampilkan 5 data pesanan dummy.</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[#e7e8ea]">
        <Table className="min-w-[760px] text-xs">
          <TableHeader className="bg-[#faf8f0] [&_tr]:border-[#e7e1cf]">
            <TableRow className="hover:bg-transparent">
              {["ID Pesanan", "Game", "Layanan", "Tanggal", "Status"].map(
                (label) => (
                  <TableHead
                    key={label}
                    className="h-10 px-4 text-[10px] font-black uppercase tracking-[.08em] text-[#6f6653]"
                  >
                    {label}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoOrders.map((item) => (
              <TableRow key={item.id} className="border-[#edf0f2] hover:bg-[#fffcf2]">
                <TableCell className="px-4 py-3 font-black text-[#1e2635]">
                  #{item.id.slice(-5).toUpperCase()}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <span className="font-semibold text-[#283246]">{item.detail.gameName}</span>
                </TableCell>
                <TableCell className="max-w-56 px-4 py-3 text-[#556178]">
                  <span className="block truncate">
                    {item.detail.serviceName} - {orderTarget(item)}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap px-4 py-3 text-[#556178]">
                  {fmtDateTime(item.createdAt)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <OrderStatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function orderTarget(order: {
  detail: {
    fromRank?: string | undefined;
    toRank?: string | undefined;
    stars?: number | undefined;
  };
}) {
  if (order.detail.fromRank && order.detail.toRank) {
    return `${order.detail.fromRank} → ${order.detail.toRank}`;
  }

  return order.detail.stars ? `${order.detail.stars} bintang` : "Detail pesanan";
}
