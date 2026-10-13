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
import { fmtDateTime } from "@/lib/format";
import { MLBB_GAME_ID } from "@/lib/seed";
import { useDB } from "@/lib/store";

export function OrderCheckTab() {
  const db = useDB();
  const [query, setQuery] = useState("");
  const order = useMemo(
    () =>
      query.trim()
        ? db.orders.find(
            (item) =>
              item.id.toLowerCase() === query.trim().toLowerCase() ||
              item.invoice.toLowerCase() === query.trim().toLowerCase(),
          )
        : null,
    [db.orders, query],
  );
  const recentOrders = useMemo(
    () =>
      db.orders
        .filter(
          (item) =>
            item.detail.gameId === MLBB_GAME_ID && item.paymentStatus === "paid",
        )
        .slice(0, 5),
    [db.orders],
  );

  return (
    <section className="mb-6 rounded-2xl border border-[#e7e9ed] bg-white p-4 shadow-[0_20px_55px_-38px_rgba(31,42,61,.28)] sm:mb-8 sm:rounded-[2rem] sm:p-6">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg bg-[#ffe47d] text-[#171c25] sm:h-11 sm:w-11 sm:rounded-xl">
          <ClipboardList className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Cek Pesanan</h2>
        <p className="mt-2 text-sm text-[#6b7890]">
          Masukkan nomor pesanan atau invoice untuk melihat status joki Mobile Legends.
        </p>
        <div className="mt-5 flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BS-JK-... atau INV/..."
            className="h-11 text-left"
          />
          <Button className="h-11 px-5" onClick={() => setQuery(query.trim())}>
            <Search /> Cek
          </Button>
        </div>
        {query && !order && (
          <p className="mt-4 text-sm text-destructive">
            Pesanan tidak ditemukan. Periksa kembali nomor pesanan.
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
          </Panel>
        )}
      </div>

      <div className="mt-7 text-center sm:mt-10">
        <h3 className="font-black text-[#121827]">Pesanan Terbaru</h3>
        <p className="mt-0.5 text-xs text-[#68758b]">Riwayat pesanan joki rank kamu.</p>
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
                  <span className="flex items-center gap-2 font-semibold text-[#283246]">
                    <img
                      src="/rank-calculator/mythical-glory.png"
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                    Mobile Legends
                  </span>
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
