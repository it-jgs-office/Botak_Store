import type { Coupon } from "./types";

export type CouponQuote = {
  coupon?: Coupon;
  discount: number;
  error?: string;
};

export function quoteCoupon(coupons: Coupon[], code: string, subtotal: number): CouponQuote {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) return { discount: 0 };

  const coupon = coupons.find((item) => item.code.toUpperCase() === normalizedCode);
  if (!coupon || !coupon.active) return { discount: 0, error: "Kode voucher tidak ditemukan atau tidak aktif." };
  if (coupon.used >= coupon.quota) return { discount: 0, error: "Kuota voucher sudah habis." };
  if (new Date(`${coupon.expiresAt.slice(0, 10)}T23:59:59`) < new Date()) return { discount: 0, error: "Voucher sudah kedaluwarsa." };
  if (subtotal < coupon.minOrder) return { discount: 0, error: `Minimal transaksi ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(coupon.minOrder)}.` };

  const discount = Math.min(
    coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value,
    subtotal,
  );
  return { coupon, discount };
}
