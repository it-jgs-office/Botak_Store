export type Role = "customer" | "admin" | "jokier";

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "expired",
  "refunded",
  "partially_refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "waiting_payment",
  "waiting_assignment",
  "waiting_confirmation",
  "assigned",
  "in_progress",
  "on_hold",
  "pending_verification",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ServiceType = "rank_target" | "per_star" | "placement" | "mission";
export type PaymentMethod = "qris" | "ewallet" | "va";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string | undefined;
  role: Role;
  createdAt: string;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  short: string;
  description: string;
  hue: number;
  status: "active" | "inactive";
  popular: boolean;
  listImage?: string | undefined;
  coverImage?: string | undefined;
}

export interface RankTier {
  name: string;
  /** price to climb from this tier to the next one */
  stepPrice: number;
}

export interface ServiceMode {
  id: string;
  label: string;
  price: number;
}

/** Editable pricing config; old orders keep their own snapshot. */
export interface ServicePrice {
  tiers?: RankTier[] | undefined;
  pricePerStar?: number | undefined;
  minStars?: number | undefined;
  maxStars?: number | undefined;
  flatPrice?: number | undefined;
  priorityPrice: number;
  modes: ServiceMode[];
}

export interface JokiService {
  id: string;
  gameId: string;
  name: string;
  slug: string;
  type: ServiceType;
  description: string;
  requirements: string[];
  estimate: string;
  rating: number;
  reviews: number;
  sold: number;
  status: "active" | "inactive";
  badge?: "Terlaris" | "Promo" | "Baru" | "Cepat";
  servers?: string[] | undefined;
  pricing: ServicePrice;
  faqs: { q: string; a: string }[];
}

export interface JokiPackage {
  id: string;
  gameSlug: "mobile-legends";
  group: string;
  name: string;
  price: number;
  estimate: string;
  image: string;
  badge?: string | undefined;
  perStar: boolean;
  status: "active" | "inactive";
  sortOrder: number;
}

export interface OrderDetail {
  gameId: string;
  gameName: string;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  fromRank?: string | undefined;
  toRank?: string | undefined;
  fromStars?: number | undefined;
  toStars?: number | undefined;
  stars?: number | undefined;
  server?: string | undefined;
  modeLabel?: string | undefined;
  priority: boolean;
  notes?: string | undefined;
  gameUserId?: string | undefined;
  gameServerId?: string | undefined;
}

export interface PriceSnapshot {
  base: number;
  addons: { label: string; amount: number }[];
  discount: number;
  couponCode?: string | undefined;
  total: number;
}

export interface Order {
  id: string;
  invoice: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  detail: OrderDetail;
  price: PriceSnapshot;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  jokierId?: string | undefined;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
}

export interface JokierProfile {
  id: string;
  userId: string;
  name: string;
  hue: number;
  gameIds: string[];
  specialty: string;
  capacity: number;
  rating: number;
  completed: number;
  status: "available" | "busy" | "offline";
}

export interface JokierAssignment {
  id: string;
  orderId: string;
  jokierId: string;
  status: "pending" | "accepted" | "rejected";
  note?: string | undefined;
  createdAt: string;
}

export interface OrderProgressLog {
  id: string;
  orderId: string;
  status: OrderStatus;
  message: string;
  by: Role | "system";
  progress?: number | undefined;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  from: Role;
  name: string;
  text: string;
  createdAt: string;
}

export type TicketStatus = "open" | "waiting_customer" | "resolved" | "closed";
export interface SupportTicket {
  id: string;
  orderId?: string | undefined;
  customerId: string;
  subject: string;
  category: "progres" | "pembayaran" | "hasil" | "lainnya";
  priority: "low" | "medium" | "high";
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
}

export type RefundStatus = "requested" | "reviewing" | "approved" | "rejected" | "processed";
export interface Refund {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  adminNote?: string | undefined;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  link?: string | undefined;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number;
  quota: number;
  used: number;
  active: boolean;
  expiresAt: string;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  display: "image" | "feature";
  active: boolean;
  sortOrder: number;
}

export interface StoreSettings {
  storeName: string;
  whatsapp: string;
  announcement: string;
  maintenance: boolean;
  topupMarkupPercent: number;
  topupMarkupFlat: number;
}

export interface Session {
  userId: string;
  role: Role;
}

export interface CheckoutDraft {
  serviceId: string;
  fromRank?: string | undefined;
  toRank?: string | undefined;
  fromStars?: number | undefined;
  toStars?: number | undefined;
  stars?: number | undefined;
  server?: string | undefined;
  modeId?: string | undefined;
  priority: boolean;
  notes?: string | undefined;
  couponCode?: string | undefined;
}

export interface DB {
  users: User[];
  games: Game[];
  services: JokiService[];
  jokiPackages: JokiPackage[];
  orders: Order[];
  payments: Payment[];
  jokiers: JokierProfile[];
  assignments: JokierAssignment[];
  logs: OrderProgressLog[];
  tickets: SupportTicket[];
  refunds: Refund[];
  notifications: Notification[];
  coupons: Coupon[];
  banners: BannerSlide[];
  settings: StoreSettings;
  session: Session | null;
  draft: CheckoutDraft | null;
}
