import { useSyncExternalStore } from "react";
import { buildSeed } from "./seed";
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
  orders: "orders",
  payments: "payments",
  jokiers: "joki_profiles",
  assignments: "assignments",
  logs: "progress_logs",
  tickets: "tickets",
  refunds: "refunds",
  notifications: "notifications",
  coupons: "coupons",
  settings: "settings",
  session: "session",
  draft: "checkout_draft",
};
const INIT_KEY = PREFIX + "demo_initialized";

const SERVER_DB = buildSeed();
let db: DB = SERVER_DB;
let loaded = false;
const listeners = new Set<() => void>();

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
      (!storedAdmin ||
        storedAdmin.email !== seededAdmin.email ||
        storedAdmin.password !== seededAdmin.password)
    ) {
      next.users = storedAdmin
        ? next.users.map((user) =>
            user.id === seededAdmin.id ? { ...user, ...seededAdmin } : user,
          )
        : [...next.users, seededAdmin];
      setStoredData("users", next.users);
    }
    db = next;
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
}

export function resetDemoData() {
  const session = db.session;
  if (hasLS()) localStorage.removeItem(INIT_KEY);
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
