import type { CheckoutDraft, Coupon, JokiService, PriceSnapshot } from "./types";

export interface RankStarRange {
  min: number;
  max: number;
}

export function mlbbRankStarRange(rank?: string): RankStarRange {
  const normalized = (rank ?? "").toLowerCase();
  if (normalized.includes("immortal")) return { min: 100, max: 999 };
  if (normalized.includes("glory")) return { min: 50, max: 99 };
  if (normalized.includes("honor")) return { min: 25, max: 49 };
  if (normalized.includes("mythic")) return { min: 0, max: 24 };
  return { min: 1, max: 5 };
}

export function startingPrice(s: JokiService): number {
  const p = s.pricing;
  if (s.type === "rank_target")
    return Math.min(...(p.tiers ?? []).slice(0, -1).map((t) => t.stepPrice));
  if (s.type === "per_star") return (p.pricePerStar ?? 0) * (p.minStars ?? 1);
  return p.flatPrice ?? 0;
}

export interface PriceResult {
  snapshot: PriceSnapshot;
  errors: Record<string, string>;
  couponError?: string | undefined;
}

export function calcPrice(s: JokiService, d: CheckoutDraft, coupons: Coupon[]): PriceResult {
  const errors: Record<string, string> = {};
  const p = s.pricing;
  let base = 0;

  if (s.type === "rank_target") {
    const tiers = p.tiers ?? [];
    const from = tiers.findIndex((t) => t.name === d.fromRank);
    const to = tiers.findIndex((t) => t.name === d.toRank);
    if (from < 0) errors["fromRank"] = "Pilih rank awal.";
    if (to < 0) errors["toRank"] = "Pilih rank target.";
    if (from >= 0 && to >= 0) {
      if (to <= from) errors["toRank"] = "Rank target harus lebih tinggi dari rank awal.";
      else {
        for (let i = from; i < to; i++) base += tiers[i]!.stepPrice;

        const fromStars = d.fromStars;
        const toStars = d.toStars;
        const fromRange = mlbbRankStarRange(d.fromRank);
        const toRange = mlbbRankStarRange(d.toRank);
        if (
          fromStars !== undefined &&
          (!Number.isInteger(fromStars) || fromStars < fromRange.min || fromStars > fromRange.max)
        ) {
          errors["fromStars"] = `Bintang ${d.fromRank} harus ${fromRange.min}–${fromRange.max}.`;
        }
        if (
          toStars !== undefined &&
          (!Number.isInteger(toStars) || toStars < toRange.min || toStars > toRange.max)
        ) {
          errors["toStars"] = `Bintang ${d.toRank} harus ${toRange.min}–${toRange.max}.`;
        }
        if (
          fromStars !== undefined &&
          toStars !== undefined &&
          !errors["fromStars"] &&
          !errors["toStars"]
        ) {
          const pricePerStar = p.pricePerStar ?? 5000;
          const fromProgress = fromStars - fromRange.min;
          const toProgress = toStars - toRange.min;
          base = Math.max(0, base + (toProgress - fromProgress) * pricePerStar);
        }
      }
    }
  } else if (s.type === "per_star") {
    const n = d.stars ?? 0;
    const min = p.minStars ?? 1;
    const max = p.maxStars ?? 100;
    if (!Number.isInteger(n) || n < min || n > max)
      errors["stars"] = `Jumlah bintang harus ${min}–${max}.`;
    else base = n * (p.pricePerStar ?? 0);
  } else {
    base = p.flatPrice ?? 0;
  }

  if (s.servers?.length && !d.server) errors["server"] = "Pilih server / region.";

  const addons: PriceSnapshot["addons"] = [];
  const mode = p.modes.find((m) => m.id === d.modeId);
  if (d.modeId && !mode) errors["modeId"] = "Mode tidak tersedia untuk layanan ini.";
  if (mode && mode.price > 0) addons.push({ label: `Mode: ${mode.label}`, amount: mode.price });
  if (d.priority) addons.push({ label: "Prioritas pengerjaan", amount: p.priorityPrice });

  const subtotal = base + addons.reduce((a, b) => a + b.amount, 0);
  let discount = 0;
  let couponError: string | undefined;
  let couponCode: string | undefined;
  if (d.couponCode) {
    const c = coupons.find((x) => x.code.toUpperCase() === d.couponCode!.toUpperCase());
    if (!c || !c.active) couponError = "Kupon tidak ditemukan atau tidak aktif.";
    else if (c.used >= c.quota) couponError = "Kuota kupon sudah habis.";
    else if (new Date(c.expiresAt) < new Date()) couponError = "Kupon sudah kedaluwarsa.";
    else if (subtotal < c.minOrder) couponError = "Belum memenuhi minimal order kupon.";
    else {
      discount = c.type === "percent" ? Math.round((subtotal * c.value) / 100) : c.value;
      discount = Math.min(discount, subtotal);
      couponCode = c.code;
    }
  }

  return {
    snapshot: { base, addons, discount, couponCode, total: Math.max(0, subtotal - discount) },
    errors,
    couponError,
  };
}
