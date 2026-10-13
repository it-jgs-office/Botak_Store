import { getDB, updateStoredData } from "./store";
import { calcPrice } from "./pricing";
import { ORDER_STATUS_META, uid } from "./format";
import type {
  CheckoutDraft,
  Coupon,
  DB,
  Game,
  JokiService,
  JokierProfile,
  Notification,
  Order,
  OrderStatus,
  PaymentMethod,
  RefundStatus,
  Role,
  StoreSettings,
  SupportTicket,
  TicketStatus,
} from "./types";

const now = () => new Date().toISOString();
type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/* ---------------- Session ---------------- */
export function loginAs(email: string, password: string): Result<Role> {
  const u = getDB().users.find((x) => x.email.toLowerCase() === email.toLowerCase().trim());
  const expectedPassword = u?.password ?? "botak123";
  if (!u || password !== expectedPassword) return fail("Email atau kata sandi salah.");
  updateStoredData(() => ({ session: { userId: u.id, role: u.role } }));
  return { ok: true, data: u.role };
}
export function logout() {
  updateStoredData(() => ({ session: null }));
}
export function registerCustomer(
  name: string,
  email: string,
  phone: string,
  password: string,
): Result {
  const d = getDB();
  if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
    return fail("Email sudah terdaftar.");
  if (password.length < 8) return fail("Kata sandi minimal 8 karakter.");
  const id = uid("u");
  updateStoredData((x) => ({
    users: [...x.users, { id, name, email, phone, password, role: "customer", createdAt: now() }],
    session: { userId: id, role: "customer" },
  }));
  return { ok: true, data: undefined };
}
export function updateProfile(userId: string, patch: { name: string; phone: string }) {
  updateStoredData((d) => ({
    users: d.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
  }));
}
export function deleteAccount(userId: string) {
  updateStoredData((d) => ({
    users: d.users.filter((u) => u.id !== userId),
    session: d.session?.userId === userId ? null : d.session,
    notifications: d.notifications.filter((n) => n.userId !== userId),
  }));
}
export function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Result {
  const u = getDB().users.find((x) => x.id === userId);
  if (!u) return fail("Akun tidak ditemukan.");
  const expected = u.password ?? "botak123";
  if (currentPassword !== expected) return fail("Kata sandi saat ini salah.");
  if (newPassword.length < 8) return fail("Kata sandi baru minimal 8 karakter.");
  updateStoredData((d) => ({
    users: d.users.map((x) => (x.id === userId ? { ...x, password: newPassword } : x)),
  }));
  return { ok: true, data: undefined };
}

/* ---------------- Notifications ---------------- */
function notif(userId: string, title: string, body: string, link?: string): Notification {
  return { id: uid("n"), userId, title, body, link, read: false, createdAt: now() };
}
export function markNotificationRead(id: string) {
  updateStoredData((d) => ({
    notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
  }));
}
export function markAllRead(userId: string) {
  updateStoredData((d) => ({
    notifications: d.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
  }));
}

/* ---------------- Order state machine ---------------- */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  waiting_payment: ["waiting_assignment", "cancelled"],
  waiting_assignment: ["waiting_confirmation", "cancelled"],
  waiting_confirmation: ["assigned", "waiting_assignment", "cancelled"],
  assigned: ["in_progress", "waiting_assignment", "cancelled"],
  in_progress: ["on_hold", "pending_verification", "cancelled"],
  on_hold: ["in_progress", "cancelled"],
  pending_verification: ["completed", "in_progress"],
  completed: [],
  cancelled: [],
};
export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

function jokierUserId(d: DB, jokierId?: string) {
  return d.jokiers.find((j) => j.id === jokierId)?.userId;
}

/** The single entry point for every order status change. */
export function changeOrderStatus(
  orderId: string,
  to: OrderStatus,
  opts: { by: Role | "system"; message?: string; progress?: number; patch?: Partial<Order> } = {
    by: "system",
  },
): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return fail("Pesanan tidak ditemukan.");
  if (!canTransition(o.status, to))
    return fail(
      `Transisi tidak valid: ${ORDER_STATUS_META[o.status].label} → ${ORDER_STATUS_META[to].label}.`,
    );
  if (
    o.status === "waiting_payment" &&
    to === "waiting_assignment" &&
    o.paymentStatus !== "paid" &&
    opts.patch?.paymentStatus !== "paid"
  )
    return fail("Pesanan belum dibayar.");
  const label = ORDER_STATUS_META[to].label;
  const message = opts.message || `Status berubah menjadi ${label}.`;
  const progress = to === "pending_verification" ? 100 : (opts.progress ?? o.progress);
  const updated: Order = { ...o, ...opts.patch, status: to, progress, updatedAt: now() };
  const recipients = new Set<string>([o.customerId, "u-admin"]);
  const ju = jokierUserId(d, updated.jokierId);
  if (ju) recipients.add(ju);
  if (opts.by === "admin") recipients.delete("u-admin");
  updateStoredData((x) => ({
    orders: x.orders.map((y) => (y.id === orderId ? updated : y)),
    logs: [
      ...x.logs,
      {
        id: uid("log"),
        orderId,
        status: to,
        message,
        by: opts.by,
        progress: opts.progress,
        createdAt: now(),
      },
    ],
    notifications: [
      ...[...recipients].map((r) => notif(r, `${orderId}: ${label}`, message, orderId)),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}

export function reportProgress(orderId: string, progress: number, message: string): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return fail("Pesanan tidak ditemukan.");
  if (o.status !== "in_progress")
    return fail("Progres hanya bisa dilaporkan saat sedang dikerjakan.");
  if (progress < o.progress || progress > 100)
    return fail("Progres harus antara progres saat ini dan 100%.");
  updateStoredData((x) => ({
    orders: x.orders.map((y) => (y.id === orderId ? { ...y, progress, updatedAt: now() } : y)),
    logs: [
      ...x.logs,
      {
        id: uid("log"),
        orderId,
        status: "in_progress",
        message: message || `Progres ${progress}%`,
        by: "jokier",
        progress,
        createdAt: now(),
      },
    ],
    notifications: [
      notif(
        o.customerId,
        `${orderId}: progres ${progress}%`,
        message || "Progres diperbarui.",
        orderId,
      ),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}

/* ---------------- Checkout ---------------- */
export function saveDraft(draft: CheckoutDraft | null) {
  updateStoredData(() => ({ draft }));
}

function nextOrderId(orders: Order[]) {
  const d = new Date();
  const ymd = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).replaceAll("-", "");
  const prefix = `BS-JK-${ymd}-`;
  let n = orders.filter((o) => o.id.startsWith(prefix)).length + 1;
  while (orders.some((o) => o.id === prefix + String(n).padStart(3, "0"))) n++;
  return {
    id: prefix + String(n).padStart(3, "0"),
    invoice: `INV/${ymd}/${Date.now().toString().slice(-6)}`,
  };
}

export function createOrder(input: {
  draft: CheckoutDraft;
  name: string;
  email: string;
  phone: string;
  gameUserId: string;
  gameServerId?: string;
  notes?: string;
  method: PaymentMethod;
}): Result<string> {
  const d = getDB();
  const svc = d.services.find((s) => s.id === input.draft.serviceId);
  if (!svc || svc.status !== "active") return fail("Layanan tidak tersedia.");
  const game = d.games.find((g) => g.id === svc.gameId)!;
  const { snapshot, errors, couponError } = calcPrice(svc, input.draft, d.coupons);
  if (Object.keys(errors).length) return fail(Object.values(errors)[0] ?? "Data tidak valid.");
  if (couponError) return fail(couponError);
  // link to session customer or create/find a guest customer
  let customerId = d.session?.role === "customer" ? d.session.userId : undefined;
  let users = d.users;
  if (!customerId) {
    const existing = d.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase() && u.role === "customer",
    );
    customerId = existing?.id ?? uid("u");
    if (!existing)
      users = [
        ...users,
        {
          id: customerId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          role: "customer",
          createdAt: now(),
        },
      ];
  }
  const { id, invoice } = nextOrderId(d.orders);
  const mode = svc.pricing.modes.find((m) => m.id === input.draft.modeId);
  const order: Order = {
    id,
    invoice,
    customerId,
    customerName: input.name,
    customerEmail: input.email,
    customerPhone: input.phone,
    detail: {
      gameId: game.id,
      gameName: game.name,
      serviceId: svc.id,
      serviceName: svc.name,
      serviceType: svc.type,
      fromRank: input.draft.fromRank,
      toRank: input.draft.toRank,
      fromStars: input.draft.fromStars,
      toStars: input.draft.toStars,
      stars: input.draft.stars,
      server: input.draft.server,
      modeLabel: mode?.label,
      priority: input.draft.priority,
      notes: [input.draft.notes, input.notes].filter(Boolean).join(" · ") || undefined,
      gameUserId: input.gameUserId,
      gameServerId: input.gameServerId,
    },
    price: snapshot,
    paymentMethod: input.method,
    paymentStatus: "pending",
    status: "waiting_payment",
    progress: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  updateStoredData((x) => ({
    users,
    orders: [order, ...x.orders],
    payments: [
      {
        id: uid("pay"),
        orderId: id,
        method: input.method,
        amount: snapshot.total,
        status: "pending",
        createdAt: now(),
      },
      ...x.payments,
    ],
    logs: [
      ...x.logs,
      {
        id: uid("log"),
        orderId: id,
        status: "waiting_payment",
        message: "Pesanan dibuat, menunggu pembayaran.",
        by: "system",
        createdAt: now(),
      },
    ],
    coupons: snapshot.couponCode
      ? x.coupons.map((c) => (c.code === snapshot.couponCode ? { ...c, used: c.used + 1 } : c))
      : x.coupons,
    session: x.session ?? { userId: customerId!, role: "customer" },
    draft: null,
  }));
  return { ok: true, data: id };
}

export function simulatePayment(orderId: string, outcome: "paid" | "failed" | "expired"): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return fail("Pesanan tidak ditemukan.");
  if (o.paymentStatus === "paid") return fail("Pesanan sudah dibayar.");
  updateStoredData((x) => ({
    payments: x.payments.map((p) => (p.orderId === orderId ? { ...p, status: outcome } : p)),
  }));
  if (outcome === "paid") {
    return changeOrderStatus(orderId, "waiting_assignment", {
      by: "system",
      message: "Pembayaran demo berhasil. Pesanan menunggu penjoki.",
      patch: { paymentStatus: "paid" },
    });
  }
  updateStoredData((x) => ({
    orders: x.orders.map((y) =>
      y.id === orderId ? { ...y, paymentStatus: outcome, updatedAt: now() } : y,
    ),
    notifications: [
      notif(
        o.customerId,
        `${orderId}: pembayaran ${outcome === "failed" ? "gagal" : "kedaluwarsa"}`,
        "Silakan coba bayar ulang.",
        orderId,
      ),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}

export function retryPayment(orderId: string) {
  updateStoredData((x) => ({
    orders: x.orders.map((y) =>
      y.id === orderId && y.status === "waiting_payment" ? { ...y, paymentStatus: "pending" } : y,
    ),
  }));
}

/* ---------------- Assignment ---------------- */
export function activeTasks(d: DB, jokierId: string) {
  return d.orders.filter(
    (o) =>
      o.jokierId === jokierId &&
      ["waiting_confirmation", "assigned", "in_progress", "on_hold"].includes(o.status),
  ).length;
}

export function assignJokier(orderId: string, jokierId: string): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  const j = d.jokiers.find((x) => x.id === jokierId);
  if (!o || !j) return fail("Data tidak ditemukan.");
  if (!j.gameIds.includes(o.detail.gameId)) return fail("Penjoki tidak menguasai game ini.");
  if (j.status === "offline") return fail("Penjoki sedang offline.");
  if (activeTasks(d, j.id) >= j.capacity) return fail("Kapasitas penjoki penuh.");
  const r = changeOrderStatus(orderId, "waiting_confirmation", {
    by: "admin",
    message: `Tugas ditawarkan ke ${j.name}.`,
    patch: { jokierId },
  });
  if (!r.ok) return r;
  updateStoredData((x) => ({
    assignments: [
      ...x.assignments,
      { id: uid("as"), orderId, jokierId, status: "pending", createdAt: now() },
    ],
    notifications: [
      notif(j.userId, "Penawaran tugas baru", `${orderId} — ${o.detail.serviceName}`, orderId),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}

export function respondAssignment(orderId: string, accept: boolean, note?: string): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o || o.status !== "waiting_confirmation") return fail("Tidak ada penawaran aktif.");
  updateStoredData((x) => ({
    assignments: x.assignments.map((a) =>
      a.orderId === orderId && a.status === "pending"
        ? { ...a, status: accept ? "accepted" : "rejected", note }
        : a,
    ),
  }));
  return accept
    ? changeOrderStatus(orderId, "assigned", { by: "jokier", message: "Penjoki menerima tugas." })
    : changeOrderStatus(orderId, "waiting_assignment", {
        by: "jokier",
        message: `Penjoki menolak tugas${note ? `: ${note}` : "."}`,
        patch: { jokierId: undefined },
      });
}

/* ---------------- Refunds ---------------- */
export function requestRefund(orderId: string, amount: number, reason: string): Result {
  const d = getDB();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return fail("Pesanan tidak ditemukan.");
  if (o.paymentStatus !== "paid") return fail("Hanya pesanan lunas yang bisa direfund.");
  if (
    d.refunds.some(
      (r) => r.orderId === orderId && ["requested", "reviewing", "approved"].includes(r.status),
    )
  )
    return fail("Refund untuk pesanan ini sedang diproses.");
  if (amount <= 0 || amount > o.price.total) return fail("Nominal refund tidak valid.");
  if (reason.trim().length < 10) return fail("Alasan minimal 10 karakter.");
  updateStoredData((x) => ({
    refunds: [
      {
        id: `RF-${200 + x.refunds.length + 1}`,
        orderId,
        customerId: o.customerId,
        amount,
        reason,
        status: "requested",
        createdAt: now(),
      },
      ...x.refunds,
    ],
    notifications: [
      notif("u-admin", "Pengajuan refund baru", `${orderId} — ${reason}`),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}

export function setRefundStatus(id: string, status: RefundStatus, adminNote?: string): Result {
  const d = getDB();
  const r = d.refunds.find((x) => x.id === id);
  if (!r) return fail("Refund tidak ditemukan.");
  const o = d.orders.find((x) => x.id === r.orderId);
  updateStoredData((x) => ({
    refunds: x.refunds.map((y) =>
      y.id === id ? { ...y, status, adminNote: adminNote ?? y.adminNote } : y,
    ),
    notifications: [
      notif(
        r.customerId,
        `Refund ${id}: ${status}`,
        adminNote || "Status refund diperbarui.",
        r.orderId,
      ),
      ...x.notifications,
    ],
  }));
  if (status === "processed" && o) {
    const full = r.amount >= o.price.total;
    if (o.status !== "completed" && o.status !== "cancelled")
      changeOrderStatus(o.id, "cancelled", {
        by: "admin",
        message: "Pesanan dibatalkan karena refund diproses.",
        patch: { paymentStatus: full ? "refunded" : "partially_refunded" },
      });
    else
      updateStoredData((x) => ({
        orders: x.orders.map((y) =>
          y.id === o.id ? { ...y, paymentStatus: full ? "refunded" : "partially_refunded" } : y,
        ),
      }));
  }
  return { ok: true, data: undefined };
}

/* ---------------- Tickets ---------------- */
export function createTicket(
  t: Pick<SupportTicket, "orderId" | "subject" | "category" | "priority"> & {
    customerId: string;
    name: string;
    text: string;
  },
): Result<string> {
  if (t.subject.trim().length < 5) return fail("Subjek minimal 5 karakter.");
  if (t.text.trim().length < 10) return fail("Pesan minimal 10 karakter.");
  const id = `TK-${1000 + getDB().tickets.length + 1}`;
  updateStoredData((x) => ({
    tickets: [
      {
        id,
        orderId: t.orderId,
        customerId: t.customerId,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: "open",
        messages: [
          { id: uid("m"), from: "customer", name: t.name, text: t.text, createdAt: now() },
        ],
        createdAt: now(),
      },
      ...x.tickets,
    ],
    notifications: [notif("u-admin", `Komplain baru ${id}`, t.subject), ...x.notifications],
  }));
  return { ok: true, data: id };
}
export function replyTicket(id: string, from: Role, name: string, text: string): Result {
  if (!text.trim()) return fail("Pesan kosong.");
  const tk = getDB().tickets.find((x) => x.id === id);
  if (!tk) return fail("Tiket tidak ditemukan.");
  updateStoredData((x) => ({
    tickets: x.tickets.map((y) =>
      y.id === id
        ? {
            ...y,
            status: from === "admin" ? "waiting_customer" : "open",
            messages: [...y.messages, { id: uid("m"), from, name, text, createdAt: now() }],
          }
        : y,
    ),
    notifications: [
      notif(from === "admin" ? tk.customerId : "u-admin", `Balasan tiket ${id}`, text.slice(0, 80)),
      ...x.notifications,
    ],
  }));
  return { ok: true, data: undefined };
}
export function setTicketStatus(id: string, status: TicketStatus) {
  updateStoredData((x) => ({
    tickets: x.tickets.map((y) => (y.id === id ? { ...y, status } : y)),
  }));
}

/* ---------------- Catalog CRUD ---------------- */
export function upsertGame(g: Game) {
  updateStoredData((x) => ({
    games: x.games.some((y) => y.id === g.id)
      ? x.games.map((y) => (y.id === g.id ? g : y))
      : [...x.games, g],
  }));
}
export function upsertService(s: JokiService) {
  updateStoredData((x) => ({
    services: x.services.some((y) => y.id === s.id)
      ? x.services.map((y) => (y.id === s.id ? s : y))
      : [...x.services, s],
  }));
}
export function upsertJokier(j: JokierProfile) {
  updateStoredData((x) => ({
    jokiers: x.jokiers.some((y) => y.id === j.id)
      ? x.jokiers.map((y) => (y.id === j.id ? j : y))
      : [...x.jokiers, j],
  }));
}
export function upsertCoupon(c: Coupon): Result {
  const d = getDB();
  if (!/^[A-Z0-9]{4,16}$/.test(c.code)) return fail("Kode 4–16 huruf kapital/angka.");
  if (d.coupons.some((y) => y.code === c.code && y.id !== c.id)) return fail("Kode sudah dipakai.");
  if (c.value <= 0 || (c.type === "percent" && c.value > 100))
    return fail("Nilai diskon tidak valid.");
  updateStoredData((x) => ({
    coupons: x.coupons.some((y) => y.id === c.id)
      ? x.coupons.map((y) => (y.id === c.id ? c : y))
      : [...x.coupons, c],
  }));
  return { ok: true, data: undefined };
}
export function deleteCoupon(id: string) {
  updateStoredData((x) => ({ coupons: x.coupons.filter((c) => c.id !== id) }));
}
export function updateSettings(s: StoreSettings) {
  updateStoredData(() => ({ settings: s }));
}
