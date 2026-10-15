import type { OrderStatus, PaymentStatus, RefundStatus, TicketStatus } from "./types";

const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
export const rupiah = (n: number) => idr.format(Math.max(0, Math.round(n)));

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

export type Tone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  waiting_payment: { label: "Menunggu Pembayaran", tone: "warning" },
  waiting_assignment: { label: "Diproses", tone: "primary" },
  waiting_confirmation: { label: "Diproses", tone: "primary" },
  assigned: { label: "Diproses", tone: "primary" },
  in_progress: { label: "Diproses", tone: "primary" },
  on_hold: { label: "Diproses", tone: "primary" },
  pending_verification: { label: "Diproses", tone: "primary" },
  completed: { label: "Selesai", tone: "success" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "Belum Dibayar", tone: "warning" },
  paid: { label: "Lunas", tone: "success" },
  failed: { label: "Gagal", tone: "danger" },
  expired: { label: "Kedaluwarsa", tone: "danger" },
  refunded: { label: "Direfund", tone: "neutral" },
  partially_refunded: { label: "Refund Sebagian", tone: "neutral" },
};

export const REFUND_STATUS_META: Record<RefundStatus, { label: string; tone: Tone }> = {
  requested: { label: "Diajukan", tone: "warning" },
  reviewing: { label: "Ditinjau", tone: "info" },
  approved: { label: "Disetujui", tone: "primary" },
  rejected: { label: "Ditolak", tone: "danger" },
  processed: { label: "Diproses", tone: "success" },
};

export const TICKET_STATUS_META: Record<TicketStatus, { label: string; tone: Tone }> = {
  open: { label: "Terbuka", tone: "warning" },
  waiting_customer: { label: "Menunggu Pelanggan", tone: "info" },
  resolved: { label: "Selesai", tone: "success" },
  closed: { label: "Ditutup", tone: "neutral" },
};

export const PAYMENT_METHOD_LABEL = { qris: "QRIS Demo", ewallet: "E-Wallet Demo", va: "Virtual Account Demo" } as const;

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
