import type { OrderStatus, PaymentStatus, Role } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");
const TOKEN_KEY = "botakstore_jwt";
const AUTH_USER_KEY = "botakstore_auth_user";

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  created_at: string;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer";
  createdAt: string | null;
}

export interface MobileLegendsAccount {
  username: string;
  country: string;
  user_id: string;
  server_id: string;
}

export interface DigiflazzProduct {
  id: string;
  label: string;
  price: number;
  type: string;
  description: string;
  stock: number | null;
}

export interface PakasirPayment {
  order_id: string;
  txn_id: string;
  amount: number;
  payment_method: string;
  fee?: number;
  total_payment?: number;
  expired_at?: string | null;
  qr_string?: string | null;
  va_number?: string | null;
  payment_url?: string;
  is_sandbox: boolean;
}

export interface PublicOrder {
  id: string;
  invoice: string;
  detail: {
    gameName: string;
    serviceName: string;
    fromRank?: string;
    toRank?: string;
    stars?: number;
  };
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  progress: number;
  createdAt: string;
}

export interface CreatePakasirPaymentInput {
  order_type: "topup" | "joki";
  item_id: string;
  description: string;
  amount: number;
  payment_method: string;
  customer: Record<string, string | number | undefined>;
}

interface AuthResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: ApiUser;
}

export class ApiRequestError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.retryAfter = retryAfter;
  }
}

function storage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}

export function getJwtToken() {
  return storage()?.getItem(TOKEN_KEY) ?? null;
}

export function getStoredAuthUser(): ApiUser | null {
  const raw = storage()?.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiUser;
  } catch {
    return null;
  }
}

export function clearApiSession() {
  storage()?.removeItem(TOKEN_KEY);
  storage()?.removeItem(AUTH_USER_KEY);
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getJwtToken();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Tidak dapat terhubung ke API BotakStore.");
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    errors?: Record<string, string[]>;
    retry_after?: number;
  } & T;

  if (!response.ok) {
    const firstValidationError = payload.errors
      ? Object.values(payload.errors).flat().find(Boolean)
      : undefined;
    throw new ApiRequestError(
      firstValidationError ?? payload.message ?? "Permintaan ke server gagal.",
      Number(payload.retry_after ?? 0),
    );
  }

  return payload;
}

function persistAuth(response: AuthResponse) {
  storage()?.setItem(TOKEN_KEY, response.access_token);
  storage()?.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  return response;
}

export async function apiLogin(email: string, password: string, recaptchaToken: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken }),
  });
  return persistAuth(response);
}

export async function apiRegister(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  recaptchaToken: string;
}) {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      password_confirmation: input.password,
      recaptcha_token: input.recaptchaToken,
    }),
  });
  return persistAuth(response);
}

export async function apiMe() {
  return apiRequest<{ user: ApiUser }>("/auth/me");
}

export async function apiLogout() {
  if (getJwtToken()) {
    await apiRequest<{ message: string }>("/auth/logout", { method: "POST" }).catch(() => null);
  }
  clearApiSession();
}

export async function apiUpdateProfile(input: { name: string; phone: string }) {
  const response = await apiRequest<{ user: ApiUser }>("/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  storage()?.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
  return response.user;
}

export async function apiChangePassword(currentPassword: string, password: string) {
  return apiRequest<{ message: string }>("/auth/password", {
    method: "PUT",
    body: JSON.stringify({
      current_password: currentPassword,
      password,
      password_confirmation: password,
    }),
  });
}

export async function apiDeleteAccount() {
  const response = await apiRequest<{ message: string }>("/auth/account", { method: "DELETE" });
  clearApiSession();
  return response;
}

export async function fetchAdminState<T>() {
  return apiRequest<{ data: T | null; updated_at: string | null }>("/admin/state");
}

export async function fetchAdminCustomers() {
  return apiRequest<{ data: AdminCustomer[] }>("/admin/customers");
}

export async function fetchStoreState<T>() {
  return apiRequest<{ data: T }>("/store/state");
}

export async function fetchPublicOrder(orderId: string) {
  return apiRequest<{ data: PublicOrder }>(`/orders/${encodeURIComponent(orderId)}`);
}

export async function saveAdminState<T>(data: T) {
  return apiRequest<{ message: string; updated_at: string }>("/admin/state", {
    method: "PUT",
    body: JSON.stringify({ data }),
  });
}

export async function uploadAdminImage(file: File) {
  const body = new FormData();
  body.append("image", file);
  return apiRequest<{ url: string; path: string }>("/admin/uploads", {
    method: "POST",
    body,
  });
}

export async function checkMobileLegendsAccount(userId: string, serverId: string) {
  const response = await apiRequest<{ data: MobileLegendsAccount }>(
    "/game/mobile-legends/check",
    {
      method: "POST",
      body: JSON.stringify({ user_id: userId, server_id: serverId }),
    },
  );
  return response.data;
}

export async function fetchMobileLegendsProducts() {
  const response = await apiRequest<{ data: DigiflazzProduct[] }>(
    "/products/mobile-legends",
  );
  return response.data;
}

export async function syncDigiflazzProducts() {
  const response = await apiRequest<{ data: DigiflazzProduct[] }>(
    "/admin/digiflazz/sync",
    { method: "POST" },
  );
  return response.data;
}

export async function createPakasirPayment(input: CreatePakasirPaymentInput) {
  const response = await apiRequest<{ data: PakasirPayment }>(
    "/payments/pakasir/create",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
