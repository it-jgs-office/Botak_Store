import type { ReactNode } from "react";
import { rupiah } from "@/lib/format";
import type { CheckoutDraft, JokiService, PriceSnapshot } from "@/lib/types";

export function PriceSummary({
  gameName,
  serviceName,
  draft,
  service,
  snapshot,
  children,
}: {
  gameName: string;
  serviceName: string;
  draft: CheckoutDraft;
  service: JokiService;
  snapshot: PriceSnapshot;
  children?: ReactNode;
}) {
  const mode = service.pricing.modes.find((m) => m.id === draft.modeId);
  const rows: [string, string | undefined][] = [
    ["Game", gameName],
    ["Layanan", serviceName],
    ["Rank awal", service.type === "rank_target" ? draft.fromRank : undefined],
    ["Bintang awal", service.type === "rank_target" ? `${draft.fromStars ?? 0}★` : undefined],
    ["Target", service.type === "rank_target" ? draft.toRank : undefined],
    ["Target bintang", service.type === "rank_target" ? `${draft.toStars ?? 0}★` : undefined],
    ["Jumlah bintang", service.type === "per_star" ? String(draft.stars ?? "-") : undefined],
    ["Server", draft.server],
    ["Mode", mode?.label],
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Ringkasan Pesanan</h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
      </dl>
      <div className="my-4 border-t border-dashed border-border" />
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Harga dasar</dt>
          <dd>{rupiah(snapshot.base)}</dd>
        </div>
        {snapshot.addons.map((a) => (
          <div key={a.label} className="flex justify-between">
            <dt className="text-muted-foreground">{a.label}</dt>
            <dd>+{rupiah(a.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Diskon{snapshot.couponCode ? ` (${snapshot.couponCode})` : ""}
          </dt>
          <dd className="text-success">-{rupiah(snapshot.discount)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-display text-2xl font-bold">{rupiah(snapshot.total)}</span>
      </div>
      {children && <div className="mt-5 space-y-2">{children}</div>}
    </div>
  );
}
