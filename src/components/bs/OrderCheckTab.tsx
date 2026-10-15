import { useEffect, useMemo, useState } from "react";
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
import { fetchPublicOrder, fetchRecentOrders, type PublicOrder } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
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
  const [recentOrders, setRecentOrders] = useState<PublicOrder[]>([]);

  useEffect(() => {
    void fetchRecentOrders()
      .then((response) => setRecentOrders(response.data))
      .catch(() => setRecentOrders([]));
  }, []);

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
    <section className="mb-6 rounded-2xl border border-[#e7e9ed] bg-white p-3 shadow-[0_20px_55px_-38px_rgba(31,42,61,.28)] sm:mb-8 sm:rounded-[2rem] sm:p-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-[#ffe47d] text-[#171c25] sm:h-11 sm:w-11 sm:rounded-xl">
          <ClipboardList className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-xl font-black tracking-tight text-[#111827] sm:text-3xl">Cek Pesanan</h2>
        <p className="mt-2 px-1 text-xs leading-5 text-[#6b7890] sm:text-sm">
          Masukkan nomor pesanan atau invoice untuk melihat status pembayaran dan pesanan.
        </p>
        <div className="mt-5 flex min-w-0 gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BS-JK-... atau INV/..."
            className="h-10 min-w-0 text-left text-xs sm:h-11 sm:text-sm"
          />
          <Button className="h-10 shrink-0 px-4 text-xs sm:h-11 sm:px-5 sm:text-sm" onClick={checkOrder} disabled={loading}>
            <Search className="h-4 w-4" /> {loading ? "Memuat..." : "Cek"}
          </Button>
        </div>
        {searchedQuery && !loading && !order && (
          <p className="mt-4 text-sm text-destructive">
            {searchError || "Pesanan tidak ditemukan. Periksa kembali nomor pesanan."}
          </p>
        )}
        {order && (
          <Panel className="mt-5 min-w-0 p-3 text-left sm:p-5">
            <h3 className="break-words text-sm font-black leading-5 text-[#202738] sm:text-base">
              {order.detail.serviceName}
            </h3>
            <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-all font-mono text-xs font-bold text-[#374151] sm:text-sm">{order.id}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{orderTarget(order)}</p>
              </div>
              <span className="self-start"><OrderStatusBadge status={order.status} /></span>
            </div>
            {(order.id.startsWith("BS-TOPUP-") || order.id.startsWith("BS-JOKI-")) && (
              <a
                href={`/invoice/${encodeURIComponent(order.id)}`}
                className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#ffd84d] px-3 text-center text-xs font-black text-[#17191d] transition hover:bg-[#f2c425] sm:min-h-11 sm:w-auto sm:px-4 sm:text-sm"
              >
                Lihat invoice & pembayaran
              </a>
            )}
          </Panel>
        )}
      </div>

      <div className="mt-7 text-center sm:mt-10">
        <h3 className="font-black text-[#121827]">Pesanan Terbaru</h3>
        <p className="mt-0.5 text-xs text-[#68758b]">Status transaksi terbaru BotakStore.</p>
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
            {recentOrders.map((item) => (
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
            {recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-[#7b8492]">
                  Belum ada pesanan terbaru.
                </TableCell>
              </TableRow>
            )}
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
