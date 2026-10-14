import { useSyncExternalStore } from "react";
import { buildSeed } from "./seed";
import { fetchAdminCustomers, fetchAdminState, fetchStoreState, getStoredAuthUser, saveAdminState } from "./api";
import type { DB } from "./types";

/**
 * Central localStorage persistence. Each entity lives in its own namespace so
 * it can be swapped for a Laravel API repository later.
 */
const PREFIX = "botakstore_";
const KEYS: Record<keyof DB, string> = {
  users: "users",
  games: "games",
  services: "joki_services",
  jokiPackages: "joki_packages",
  orders: "orders",
  payments: "payments",
  jokiers: "joki_profiles",
  assignments: "assignments",
  logs: "progress_logs",
  tickets: "tickets",
  refunds: "refunds",
  notifications: "notifications",
  coupons: "coupons",
  banners: "banners",
  settings: "settings",
  session: "session",
  draft: "checkout_draft",
};
const INIT_KEY = PREFIX + "demo_initialized";
const MLBB_ONLY_KEY = PREFIX + "joki_games_v3";
const SYNC_KEYS = [
  "users",
  "games",
  "services",
  "jokiPackages",
  "orders",
  "payments",
  "jokiers",
  "assignments",
  "logs",
  "tickets",
  "refunds",
  "notifications",
  "coupons",
  "banners",
  "settings",
] as const satisfies readonly (keyof DB)[];
type ApiStoreState = Pick<DB, (typeof SYNC_KEYS)[number]>;
type PublicStoreState = Pick<DB, "games" | "services" | "jokiPackages" | "coupons" | "banners" | "settings">;

const SERVER_DB = buildSeed();
let db: DB = SERVER_DB;
let loaded = false;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function normalizeMlbbData(source: DB): DB {
  const allowedGameIds = new Set(["g-mlbb", "g-valo", "g-pubgm", "g-efootball"]);
  const games = source.games
    .filter((game) => allowedGameIds.has(game.id))
    .map((game) => ({
      ...SERVER_DB.games.find((seedGame) => seedGame.id === game.id),
      ...game,
    }));
  const services = source.services.filter((service) => allowedGameIds.has(service.gameId));
  SERVER_DB.games.forEach((game) => {
    if (!games.some((item) => item.id === game.id)) games.push(game);
  });
  SERVER_DB.services.forEach((service) => {
    if (!services.some((item) => item.id === service.id)) services.push(service);
  });
  const orders = source.orders.filter((order) => allowedGameIds.has(order.detail.gameId));
  const orderIds = new Set(orders.map((order) => order.id));

  return {
    ...source,
    settings: { ...SERVER_DB.settings, ...source.settings },
    games: games.length ? games : SERVER_DB.games,
    services: services.length ? services : SERVER_DB.services,
    orders,
    payments: source.payments.filter((payment) => orderIds.has(payment.orderId)),
    assignments: source.assignments.filter((assignment) => orderIds.has(assignment.orderId)),
    logs: source.logs.filter((log) => orderIds.has(log.orderId)),
    tickets: source.tickets.filter((ticket) => !ticket.orderId || orderIds.has(ticket.orderId)),
    refunds: source.refunds.filter((refund) => orderIds.has(refund.orderId)),
    notifications: source.notifications.filter(
      (notification) => !notification.link || !notification.link.startsWith("BS-") || orderIds.has(notification.link),
    ),
    jokiers: source.jokiers.map((jokier) => ({
      ...jokier,
      gameIds: jokier.gameIds.filter((gameId) => allowedGameIds.has(gameId)),
    })),
  };
}

function apiState(source: DB): ApiStoreState {
  return {
    users: source.users.map(({ password: _password, ...user }) => user),
    games: source.games,
    services: source.services,
    jokiPackages: source.jokiPackages,
    orders: source.orders,
    payments: source.payments,
    jokiers: source.jokiers,
    assignments: source.assignments,
    logs: source.logs,
    tickets: source.tickets,
    refunds: source.refunds,
    notifications: source.notifications,
    coupons: source.coupons,
    banners: source.banners,
    settings: source.settings,
  };
}

function queueApiSync() {
  if (getStoredAuthUser()?.role !== "admin") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void saveAdminState(apiState(db)).catch(() => undefined);
  }, 400);
}

function hasLS() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getStoredData<K extends keyof DB>(key: K, fallback: DB[K]): DB[K] {
  if (!hasLS()) return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + KEYS[key]);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as DB[K];
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function setStoredData<K extends keyof DB>(key: K, value: DB[K]) {
  if (!hasLS()) return;
  try {
    localStorage.setItem(PREFIX + KEYS[key], JSON.stringify(value));
  } catch {
    /* quota */
  }
}

export function initializeDemoData() {
  if (!hasLS()) return;
  const seed = buildSeed();
  if (localStorage.getItem(INIT_KEY) !== "true") {
    (Object.keys(KEYS) as (keyof DB)[]).forEach((k) => setStoredData(k, seed[k] as never));
    localStorage.setItem(INIT_KEY, "true");
    localStorage.setItem(MLBB_ONLY_KEY, "true");
    db = seed;
  } else {
    const next = { ...seed } as DB;
    (Object.keys(KEYS) as (keyof DB)[]).forEach((k) => {
      (next as unknown as Record<string, unknown>)[k] = getStoredData(k, seed[k] as never);
    });

    const seededMlbbRank = seed.services.find((service) => service.id === "s-mlbb-rank");
    const storedMlbbRank = next.services.find((service) => service.id === "s-mlbb-rank");
    const hasImmortal = storedMlbbRank?.pricing.tiers?.some((tier) =>
      tier.name.toLowerCase().includes("immortal"),
    );
    if (seededMlbbRank && storedMlbbRank && !hasImmortal) {
      const seedTiers = seededMlbbRank.pricing.tiers ?? [];
      const gloryPrice = seedTiers.find((tier) =>
        tier.name.toLowerCase().includes("glory"),
      )?.stepPrice;
      const immortalTier = seedTiers.find((tier) => tier.name.toLowerCase().includes("immortal"));
      next.services = next.services.map((service) => {
        if (service.id !== "s-mlbb-rank") return service;
        const currentTiers = (service.pricing.tiers ?? []).map((tier) =>
          tier.name.toLowerCase().includes("glory") && tier.stepPrice === 0 && gloryPrice
            ? { ...tier, stepPrice: gloryPrice }
            : tier,
        );
        return {
          ...service,
          pricing: {
            ...service.pricing,
            tiers: immortalTier ? [...currentTiers, immortalTier] : currentTiers,
          },
        };
      });
      setStoredData("services", next.services);
    }

    const seededAdmin = seed.users.find((user) => user.id === "u-admin");
    const storedAdmin = next.users.find((user) => user.id === "u-admin");
    if (
      seededAdmin &&
      (!storedAdmin || storedAdmin.email !== seededAdmin.email || !!storedAdmin.password)
    ) {
      next.users = storedAdmin
        ? next.users.map((user) =>
            user.id === seededAdmin.id
              ? { ...user, ...seededAdmin, password: undefined }
              : user,
          )
        : [...next.users, seededAdmin];
      setStoredData("users", next.users);
    }

    if (localStorage.getItem(MLBB_ONLY_KEY) !== "true") {
      const normalized = normalizeMlbbData(next);
      (Object.keys(KEYS) as (keyof DB)[]).forEach((key) => setStoredData(key, normalized[key] as never));
      localStorage.setItem(MLBB_ONLY_KEY, "true");
      db = normalized;
    } else {
      db = next;
    }
  }
}

function ensureLoaded() {
  if (!loaded && hasLS()) {
    loaded = true;
    initializeDemoData();
  }
}

export function getDB(): DB {
  ensureLoaded();
  return db;
}

/** Apply a mutation, persist changed namespaces, and notify subscribers. */
export function updateStoredData(fn: (d: DB) => Partial<DB>) {
  ensureLoaded();
  const patch = fn(db);
  db = { ...db, ...patch };
  (Object.keys(patch) as (keyof DB)[]).forEach((k) => setStoredData(k, db[k] as never));
  listeners.forEach((l) => l());
  if (Object.keys(patch).some((key) => SYNC_KEYS.includes(key as (typeof SYNC_KEYS)[number]))) {
    queueApiSync();
  }
}

export async function hydrateAdminState() {
  ensureLoaded();
  if (getStoredAuthUser()?.role !== "admin") return;

  const [response, customersResponse] = await Promise.all([
    fetchAdminState<ApiStoreState>(),
    fetchAdminCustomers(),
  ]);
  const customers = customersResponse.data.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt ?? new Date().toISOString(),
  }));
  const users = (response.data?.users ?? db.users)
    .filter((user) => user.role !== "customer")
    .concat(customers);

  if (!response.data) {
    db = { ...db, users };
    setStoredData("users", db.users);
    listeners.forEach((listener) => listener());
    await saveAdminState(apiState(db));
    return;
  }

  db = normalizeMlbbData({
    ...db,
    ...response.data,
    users,
    session: db.session,
    draft: db.draft,
  });
  SYNC_KEYS.forEach((key) => setStoredData(key, db[key] as never));
  listeners.forEach((listener) => listener());
}

export async function hydrateStorefrontState() {
  ensureLoaded();
  const response = await fetchStoreState<PublicStoreState>();
  if (!response.data || !Object.keys(response.data).length) return;

  db = normalizeMlbbData({ ...db, ...response.data });
  (["games", "services", "jokiPackages", "coupons", "banners", "settings"] as const).forEach((key) =>
    setStoredData(key, db[key] as never),
  );
  listeners.forEach((listener) => listener());
}

export function resetDemoData() {
  const session = db.session;
  if (hasLS()) localStorage.removeItem(INIT_KEY);
  if (hasLS()) localStorage.removeItem(MLBB_ONLY_KEY);
  loaded = false;
  ensureLoaded();
  updateStoredData(() => ({ session }));
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) {
      loaded = false;
      ensureLoaded();
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns the whole DB snapshot (stable reference until a mutation). Derive with useMemo. */
export function useDB(): DB {
  return useSyncExternalStore(subscribe, getDB, () => SERVER_DB);
}
