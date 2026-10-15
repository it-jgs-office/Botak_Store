import { getDB, hydrateCustomerData, updateStoredData } from "./store";
import {
  apiChangePassword,
  apiDeleteAccount,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiUpdateProfile,
  clearApiSession,
  getStoredAuthUser,
  type ApiUser,
} from "./api";
import { calcPrice } from "./pricing";
import { ORDER_STATUS_META, uid } from "./format";
import type {
  BannerSlide,
  CheckoutDraft,
  Coupon,
  DB,
  Game,
  JokiService,
  JokiPackage,
  Notification,
  Order,
  OrderStatus,
  PaymentMethod,
  RefundStatus,
  Role,
  StoreSettings,
} from "./types";

const now = () => new Date().toISOString();
type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/* ---------------- Session ---------------- */
function applyApiUser(user: ApiUser) {
  const id =
    user.role === "admin"
      ? "u-admin"
      : user.email.toLowerCase() === "customer@botakstore.demo"
        ? "u-cust"
        : `api-${user.id}`;
  updateStoredData((data) => ({
    users: [
      ...data.users.filter((item) => item.id !== id && item.email.toLowerCase() !== user.email.toLowerCase()),
      {
        id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        createdAt: user.created_at,
      },
    ],
    session: { userId: id, role: user.role },
  }));
}

export async function loginAs(
  email: string,
  password: string,
  recaptchaToken?: string,
): Promise<Result<Role>> {
  try {
    if (!recaptchaToken) {
      return fail("Mohon centang verifikasi captcha terlebih dahulu.");
    }
    const response = await apiLogin(email, password, recaptchaToken);
    applyApiUser(response.user);
    return { ok: true, data: response.user.role };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Email atau kata sandi salah.");
  }
}
export function logout() {
  void apiLogout();
  clearApiSession();
  updateStoredData(() => ({ session: null }));
}

export async function restoreSession() {
  if (!getStoredAuthUser()) return;
  try {
    const response = await apiMe();
    applyApiUser(response.user);
    if (response.user.role === "customer") await hydrateCustomerData();
  } catch {
    clearApiSession();
    updateStoredData(() => ({ session: null }));
  }
}
export async function registerCustomer(
  name: string,
  email: string,
  phone: string,
  password: string,
  recaptchaToken?: string,
): Promise<Result> {
  try {
    if (!recaptchaToken) {
      return fail("Mohon centang verifikasi captcha terlebih dahulu.");
    }
    const response = await apiRegister({ name, email, phone, password, recaptchaToken });
    applyApiUser(response.user);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Pendaftaran gagal.");
  }
}
export async function updateProfile(
  userId: string,
  patch: { name: string; phone: string },
): Promise<Result> {
  try {
    const user = await apiUpdateProfile(patch);
    updateStoredData((data) => ({
      users: data.users.map((item) =>
        item.id === userId ? { ...item, name: user.name, phone: user.phone ?? "" } : item,
      ),
    }));
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Profil gagal diperbarui.");
  }
}
export async function deleteAccount(userId: string): Promise<Result> {
  try {
    await apiDeleteAccount();
    updateStoredData((data) => ({
      users: data.users.filter((user) => user.id !== userId),
      session: data.session?.userId === userId ? null : data.session,
      notifications: data.notifications.filter((notification) => notification.userId !== userId),
    }));
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Akun gagal dihapus.");
  }
}
export async function changePassword(
  _userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<Result> {
  try {
    await apiChangePassword(currentPassword, newPassword);
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Kata sandi gagal diubah.");
  }
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
  waiting_payment: ["in_progress", "cancelled"],
  waiting_assignment: ["in_progress", "cancelled"],
  waiting_confirmation: ["in_progress", "cancelled"],
  assigned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  on_hold: ["in_progress", "completed", "cancelled"],
  pending_verification: ["in_progress", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export const canTransition = (from: OrderStatus, to: OrderStatus) => TRANSITIONS[from].includes(to);

const isJokiOrder = (order: Order) => order.detail.serviceName.toLowerCase().startsWith("joki ");

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
  const canCompletePaidJoki = isJokiOrder(o)
    && o.paymentStatus === "paid"
    && to === "completed"
    && !["completed", "cancelled"].includes(o.status);
  if (!canTransition(o.status, to) && !canCompletePaidJoki)
    return fail(
      `Transisi tidak valid: ${ORDER_STATUS_META[o.status].label} → ${ORDER_STATUS_META[to].label}.`,
    );
  if (
    o.status === "waiting_payment" &&
    to === "in_progress" &&
    o.paymentStatus !== "paid" &&
    opts.patch?.paymentStatus !== "paid"
  )
    return fail("Pesanan belum dibayar.");
  const label = ORDER_STATUS_META[to].label;
  const message = opts.message || `Status berubah menjadi ${label}.`;
  const progress = to === "completed" ? 100 : (opts.progress ?? o.progress);
  const updated: Order = { ...o, ...opts.patch, status: to, progress, updatedAt: now() };
  const recipients = new Set<string>([o.customerId, "u-admin"]);
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

export function recordPakasirOrder(input: {
  orderId: string;
  transactionId: string;
  amount: number;
  baseAmount?: number;
  discount?: number;
  couponCode?: string;
  method: string;
  game: { id: string; name: string };
  service: { id: string; name: string };
  customer: { name: string; email?: string; phone: string };
  gameUserId?: string;
  gameServerId?: string;
  quantity?: number;
  note?: string;
}): Result<string> {
  const d = getDB();
  if (d.orders.some((order) => order.id === input.orderId)) return { ok: true, data: input.orderId };

  const paymentMethod: PaymentMethod = input.method === "qris"
    ? "qris"
    : input.method.endsWith("_va")
      ? "va"
      : "ewallet";
  const sessionCustomerId = d.session?.role === "customer" ? d.session.userId : undefined;
  const normalizedEmail = input.customer.email?.trim().toLowerCase();
  const existingCustomer = normalizedEmail
    ? d.users.find((user) => user.role === "customer" && user.email.toLowerCase() === normalizedEmail)
    : undefined;
  const customerId = sessionCustomerId ?? existingCustomer?.id ?? uid("u");
  const users = existingCustomer || sessionCustomerId
    ? d.users
    : [...d.users, {
      id: customerId,
      name: input.customer.name,
      email: input.customer.email ?? "",
      phone: input.customer.phone,
      role: "customer" as const,
      createdAt: now(),
    }];
  const createdAt = now();

  updateStoredData((state) => ({
    users,
    orders: [{
      id: input.orderId,
      invoice: input.orderId,
      customerId,
      customerName: input.customer.name,
      customerEmail: input.customer.email ?? "",
      customerPhone: input.customer.phone,
      detail: {
        gameId: input.game.id,
        gameName: input.game.name,
        serviceId: input.service.id,
        serviceName: input.service.name,
        serviceType: "per_star" as const,
        stars: input.quantity,
        gameUserId: input.gameUserId,
        gameServerId: input.gameServerId,
        priority: false,
        notes: input.note,
      },
      price: {
        base: input.baseAmount ?? input.amount,
        addons: [],
        discount: input.discount ?? 0,
        couponCode: input.couponCode,
        total: input.amount,
      },
      paymentMethod,
      paymentStatus: "pending",
      status: "waiting_payment",
      progress: 0,
      createdAt,
      updatedAt: createdAt,
    }, ...state.orders],
    payments: [{
      id: input.transactionId,
      orderId: input.orderId,
      method: paymentMethod,
      amount: input.amount,
      status: "pending",
      createdAt,
    }, ...state.payments],
    logs: [{
      id: uid("log"),
      orderId: input.orderId,
      status: "waiting_payment",
      message: "Pesanan dibuat, menunggu pembayaran.",
      by: "system",
      createdAt,
    }, ...state.logs],
  }));
  return { ok: true, data: input.orderId };
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
    return changeOrderStatus(orderId, "in_progress", {
      by: "system",
      message: "Pembayaran demo berhasil. Pesanan sedang diproses.",
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

export function upsertJokiPackage(item: JokiPackage) {
  updateStoredData((state) => ({
    jokiPackages: state.jokiPackages.some((packageItem) => packageItem.id === item.id)
      ? state.jokiPackages.map((packageItem) => packageItem.id === item.id ? item : packageItem)
      : [...state.jokiPackages, item],
  }));
}

export function deleteJokiPackage(id: string) {
  updateStoredData((state) => ({
    jokiPackages: state.jokiPackages.filter((item) => item.id !== id),
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
export function upsertBanner(banner: BannerSlide): Result {
  if (!banner.title.trim()) return fail("Judul banner wajib diisi.");
  if (!banner.imageUrl.trim()) return fail("URL gambar banner wajib diisi.");
  if (banner.href && !/^(\/|https?:\/\/)/i.test(banner.href)) {
    return fail("Tautan banner harus diawali /, http://, atau https://.");
  }
  updateStoredData((x) => ({
    banners: x.banners.some((item) => item.id === banner.id)
      ? x.banners.map((item) => (item.id === banner.id ? banner : item))
      : [...x.banners, banner],
  }));
  return { ok: true, data: undefined };
}
export function deleteBanner(id: string) {
  updateStoredData((x) => ({ banners: x.banners.filter((banner) => banner.id !== id) }));
}
export function updateSettings(s: StoreSettings) {
  updateStoredData(() => ({ settings: s }));
}
