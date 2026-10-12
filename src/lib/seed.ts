import type {
  Coupon,
  DB,
  Game,
  JokiService,
  JokierAssignment,
  JokierProfile,
  Notification,
  Order,
  OrderProgressLog,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Refund,
  RankTier,
  SupportTicket,
  User,
} from "./types";

const t = (day: number, hour = 10, min = 0) =>
  new Date(Date.UTC(2026, 9, day, hour - 7, min)).toISOString();

const tiers = (names: string[], prices: number[]): RankTier[] =>
  names.map((name, i) => ({ name, stepPrice: prices[i] ?? 0 }));

export const MLBB_GAME_ID = "g-mlbb";

const MLBB = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
];
const VALO = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Ascendant",
  "Immortal",
  "Radiant",
];
const PUBG = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Crown",
  "Ace",
  "Ace Master",
  "Conqueror",
];
const FF = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Heroic", "Grandmaster"];
const HOK = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master", "Grandmaster", "Mythic"];

export const seedGames: Game[] = [
  {
    id: MLBB_GAME_ID,
    name: "Mobile Legends",
    slug: "mobile-legends",
    short: "MLBB",
    hue: 94,
    status: "active",
    popular: true,
    description: "Layanan joki rank dan bintang Mobile Legends.",
  },
  {
    id: "g-valo",
    name: "Valorant",
    slug: "valorant",
    short: "VALO",
    hue: 20,
    status: "active",
    popular: true,
    description: "Tactical shooter 5v5 dari Riot Games.",
  },
  {
    id: "g-pubgm",
    name: "PUBG Mobile",
    slug: "pubg-mobile",
    short: "PUBG",
    hue: 75,
    status: "active",
    popular: true,
    description: "Battle royale klasik di perangkat mobile.",
  },
  {
    id: "g-ff",
    name: "Free Fire",
    slug: "free-fire",
    short: "FF",
    hue: 45,
    status: "active",
    popular: true,
    description: "Battle royale cepat 10 menit.",
  },
  {
    id: "g-hok",
    name: "Honor of Kings",
    slug: "honor-of-kings",
    short: "HOK",
    hue: 300,
    status: "active",
    popular: false,
    description: "MOBA kompetitif dari TiMi Studio.",
  },
  {
    id: "g-gi",
    name: "Genshin Impact",
    slug: "genshin-impact",
    short: "GI",
    hue: 200,
    status: "active",
    popular: false,
    description: "Open-world action RPG.",
  },
];

const modesMoba = [
  { id: "solo", label: "Solo (akun dimainkan penjoki)", price: 0 },
  { id: "duo", label: "Duo / Mabar dengan penjoki", price: 15000 },
];
const servers = ["Asia", "Indonesia", "SEA"];

export const seedServices: JokiService[] = [
  {
    id: "s-mlbb-rank",
    gameId: "g-mlbb",
    name: "MLBB Joki Rank",
    slug: "mobile-legends-rank",
    type: "rank_target",
    description:
      "Naik rank dari tier mana pun ke target pilihanmu oleh penjoki berpengalaman Mythic Glory.",
    requirements: [
      "Akun tidak sedang dalam penalti",
      "Emblem minimal level 30",
      "Tidak login selama proses",
    ],
    estimate: "1–4 hari",
    rating: 4.9,
    reviews: 1284,
    sold: 5420,
    status: "active",
    badge: "Terlaris",
    servers,
    pricing: {
      tiers: tiers(MLBB, [25000, 35000, 45000, 60000, 85000, 120000, 180000, 260000, 500000]),
      priorityPrice: 20000,
      modes: modesMoba,
    },
    faqs: [
      { q: "Apakah aman?", a: "Penjoki bermain manual tanpa cheat atau tools pihak ketiga." },
      { q: "Bisa request hero?", a: "Bisa, tulis di catatan pesanan." },
    ],
  },
  {
    id: "s-mlbb-star",
    gameId: "g-mlbb",
    name: "MLBB Joki Per Bintang",
    slug: "mobile-legends-per-bintang",
    type: "per_star",
    description:
      "Bayar sesuai jumlah bintang yang kamu butuhkan. Cocok untuk push tipis jelang akhir season.",
    requirements: ["Rank minimal Epic", "Tidak login selama proses"],
    estimate: "Hitungan jam",
    rating: 4.8,
    reviews: 876,
    sold: 3910,
    status: "active",
    badge: "Cepat",
    servers,
    pricing: {
      pricePerStar: 5000,
      minStars: 1,
      maxStars: 100,
      priorityPrice: 20000,
      modes: modesMoba,
    },
    faqs: [{ q: "Berapa bintang per hari?", a: "Rata-rata 15–25 bintang per hari." }],
  },
  {
    id: "s-mlbb-mythic",
    gameId: "g-mlbb",
    name: "MLBB Target Mythic",
    slug: "mobile-legends-target-mythic",
    type: "placement",
    description: "Paket langsung dari Legend V ke Mythic dengan harga flat.",
    requirements: ["Rank saat ini Legend"],
    estimate: "2–3 hari",
    rating: 4.9,
    reviews: 412,
    sold: 1530,
    status: "active",
    badge: "Promo",
    servers,
    pricing: { flatPrice: 199000, priorityPrice: 25000, modes: modesMoba },
    faqs: [],
  },
  {
    id: "s-mlbb-mh",
    gameId: "g-mlbb",
    name: "MLBB Target Mythical Honor",
    slug: "mobile-legends-target-mythical-honor",
    type: "placement",
    description: "Paket Mythic ke Mythical Honor (25 bintang).",
    requirements: ["Rank saat ini Mythic"],
    estimate: "3–5 hari",
    rating: 4.8,
    reviews: 233,
    sold: 690,
    status: "active",
    servers,
    pricing: { flatPrice: 349000, priorityPrice: 30000, modes: modesMoba },
    faqs: [],
  },
  {
    id: "s-valo-rank",
    gameId: "g-valo",
    name: "Valorant Rank Boost",
    slug: "valorant-rank-boost",
    type: "rank_target",
    description: "Boost rank kompetitif Valorant oleh player Immortal+.",
    requirements: ["Akun level 20+", "Region AP"],
    estimate: "2–6 hari",
    rating: 4.8,
    reviews: 391,
    sold: 1210,
    status: "active",
    badge: "Terlaris",
    servers: ["AP"],
    pricing: {
      tiers: tiers(VALO, [60000, 80000, 110000, 150000, 210000, 320000, 520000, 900000]),
      priorityPrice: 35000,
      modes: [
        { id: "solo", label: "Solo", price: 0 },
        { id: "duo", label: "Duo Queue", price: 50000 },
      ],
    },
    faqs: [{ q: "Apakah agent bisa dipilih?", a: "Bisa, tulis agent favoritmu di catatan." }],
  },
  {
    id: "s-valo-place",
    gameId: "g-valo",
    name: "Valorant Placement",
    slug: "valorant-placement",
    type: "mission",
    description: "5 match placement dimainkan untuk hasil rank awal terbaik.",
    requirements: ["Akun belum placement di act ini"],
    estimate: "1 hari",
    rating: 4.7,
    reviews: 144,
    sold: 402,
    status: "active",
    badge: "Baru",
    servers: ["AP"],
    pricing: { flatPrice: 150000, priorityPrice: 25000, modes: [] },
    faqs: [],
  },
  {
    id: "s-pubg-rank",
    gameId: "g-pubgm",
    name: "PUBG Mobile Rank Push",
    slug: "pubg-mobile-rank-push",
    type: "rank_target",
    description: "Push tier PUBG Mobile mode classic.",
    requirements: ["Tidak login selama proses"],
    estimate: "2–5 hari",
    rating: 4.7,
    reviews: 302,
    sold: 980,
    status: "active",
    servers: ["Asia", "SEA"],
    pricing: {
      tiers: tiers(PUBG, [20000, 30000, 45000, 70000, 110000, 170000, 260000, 400000]),
      priorityPrice: 20000,
      modes: [
        { id: "tpp", label: "TPP", price: 0 },
        { id: "fpp", label: "FPP", price: 15000 },
      ],
    },
    faqs: [],
  },
  {
    id: "s-pubg-conq",
    gameId: "g-pubgm",
    name: "PUBG Mobile Target Conqueror",
    slug: "pubg-mobile-target-conqueror",
    type: "placement",
    description: "Paket Ace Master ke Conqueror.",
    requirements: ["Rank saat ini Ace Master"],
    estimate: "5–10 hari",
    rating: 4.9,
    reviews: 77,
    sold: 120,
    status: "active",
    servers: ["Asia"],
    pricing: { flatPrice: 1250000, priorityPrice: 100000, modes: [] },
    faqs: [],
  },
  {
    id: "s-ff-rank",
    gameId: "g-ff",
    name: "Free Fire Rank Push",
    slug: "free-fire-rank-push",
    type: "rank_target",
    description: "Push rank BR Free Fire hingga Grandmaster.",
    requirements: ["Akun level 15+"],
    estimate: "1–3 hari",
    rating: 4.7,
    reviews: 520,
    sold: 2100,
    status: "active",
    badge: "Promo",
    servers: ["Indonesia"],
    pricing: {
      tiers: tiers(FF, [15000, 22000, 32000, 50000, 85000, 150000]),
      priorityPrice: 15000,
      modes: [
        { id: "br", label: "Battle Royale", price: 0 },
        { id: "cs", label: "Clash Squad", price: 10000 },
      ],
    },
    faqs: [],
  },
  {
    id: "s-hok-rank",
    gameId: "g-hok",
    name: "Honor of Kings Rank Boost",
    slug: "honor-of-kings-rank-boost",
    type: "rank_target",
    description: "Naik tier HOK dengan penjoki top lokal.",
    requirements: ["Tidak login selama proses"],
    estimate: "1–4 hari",
    rating: 4.8,
    reviews: 98,
    sold: 330,
    status: "active",
    badge: "Baru",
    servers: ["SEA"],
    pricing: {
      tiers: tiers(HOK, [20000, 30000, 45000, 70000, 110000, 180000, 280000]),
      priorityPrice: 20000,
      modes: modesMoba,
    },
    faqs: [],
  },
  {
    id: "s-hok-star",
    gameId: "g-hok",
    name: "Honor of Kings Per Bintang",
    slug: "honor-of-kings-per-bintang",
    type: "per_star",
    description: "Push bintang HOK satuan.",
    requirements: [],
    estimate: "Hitungan jam",
    rating: 4.6,
    reviews: 41,
    sold: 150,
    status: "active",
    servers: ["SEA"],
    pricing: {
      pricePerStar: 6000,
      minStars: 1,
      maxStars: 80,
      priorityPrice: 15000,
      modes: modesMoba,
    },
    faqs: [],
  },
  {
    id: "s-gi-mission",
    gameId: "g-gi",
    name: "Genshin Misi Khusus",
    slug: "genshin-misi-khusus",
    type: "mission",
    description: "Penyelesaian Archon Quest, eksplorasi region, atau Spiral Abyss.",
    requirements: ["Adventure Rank 30+"],
    estimate: "1–3 hari",
    rating: 4.9,
    reviews: 188,
    sold: 640,
    status: "active",
    servers: ["Asia", "America", "Europe"],
    pricing: {
      flatPrice: 85000,
      priorityPrice: 20000,
      modes: [
        { id: "quest", label: "Archon Quest", price: 0 },
        { id: "abyss", label: "Spiral Abyss 36★", price: 60000 },
        { id: "explore", label: "Eksplorasi 100%", price: 40000 },
      ],
    },
    faqs: [],
  },
];

const users: User[] = [
  {
    id: "u-cust",
    name: "Rizky Pratama",
    email: "customer@botakstore.demo",
    phone: "081234567890",
    role: "customer",
    createdAt: t(1),
  },
  {
    id: "u-c2",
    name: "Dinda Ayu",
    email: "dinda@mail.demo",
    phone: "081298765432",
    role: "customer",
    createdAt: t(1),
  },
  {
    id: "u-c3",
    name: "Fajar Nugroho",
    email: "fajar@mail.demo",
    phone: "085711112222",
    role: "customer",
    createdAt: t(2),
  },
  {
    id: "u-c4",
    name: "Sinta Maharani",
    email: "sinta@mail.demo",
    phone: "087833334444",
    role: "customer",
    createdAt: t(2),
  },
  {
    id: "u-admin",
    name: "Admin Botak",
    email: "admin@botakstore.demo",
    phone: "081100000000",
    role: "admin",
    createdAt: t(1),
  },
  {
    id: "u-j1",
    name: "Andi 'Reaper'",
    email: "jokier@botakstore.demo",
    phone: "081300000001",
    role: "jokier",
    createdAt: t(1),
  },
  {
    id: "u-j2",
    name: "Bima 'Ghost'",
    email: "bima@jokier.demo",
    phone: "081300000002",
    role: "jokier",
    createdAt: t(1),
  },
  {
    id: "u-j3",
    name: "Citra 'Nova'",
    email: "citra@jokier.demo",
    phone: "081300000003",
    role: "jokier",
    createdAt: t(1),
  },
  {
    id: "u-j4",
    name: "Doni 'Vortex'",
    email: "doni@jokier.demo",
    phone: "081300000004",
    role: "jokier",
    createdAt: t(1),
  },
  {
    id: "u-j5",
    name: "Eka 'Sniper'",
    email: "eka@jokier.demo",
    phone: "081300000005",
    role: "jokier",
    createdAt: t(1),
  },
  {
    id: "u-j6",
    name: "Gilang 'Titan'",
    email: "gilang@jokier.demo",
    phone: "081300000006",
    role: "jokier",
    createdAt: t(1),
  },
];

const jokiers: JokierProfile[] = [
  {
    id: "j-1",
    userId: "u-j1",
    name: "Andi 'Reaper'",
    hue: 290,
    gameIds: ["g-mlbb", "g-hok"],
    specialty: "Mythical Glory 1200★",
    capacity: 4,
    rating: 4.9,
    completed: 412,
    status: "available",
  },
  {
    id: "j-2",
    userId: "u-j2",
    name: "Bima 'Ghost'",
    hue: 230,
    gameIds: ["g-mlbb"],
    specialty: "Mythical Glory, Top Global Ling",
    capacity: 3,
    rating: 4.8,
    completed: 287,
    status: "available",
  },
  {
    id: "j-3",
    userId: "u-j3",
    name: "Citra 'Nova'",
    hue: 20,
    gameIds: ["g-valo"],
    specialty: "Immortal 3",
    capacity: 3,
    rating: 4.9,
    completed: 156,
    status: "busy",
  },
  {
    id: "j-4",
    userId: "u-j4",
    name: "Doni 'Vortex'",
    hue: 75,
    gameIds: ["g-pubgm", "g-ff"],
    specialty: "Conqueror 5 season",
    capacity: 4,
    rating: 4.7,
    completed: 201,
    status: "available",
  },
  {
    id: "j-5",
    userId: "u-j5",
    name: "Eka 'Sniper'",
    hue: 45,
    gameIds: ["g-ff", "g-pubgm"],
    specialty: "Grandmaster FF",
    capacity: 3,
    rating: 4.6,
    completed: 98,
    status: "offline",
  },
  {
    id: "j-6",
    userId: "u-j6",
    name: "Gilang 'Titan'",
    hue: 200,
    gameIds: ["g-gi", "g-hok"],
    specialty: "Spiral Abyss 36★",
    capacity: 5,
    rating: 4.8,
    completed: 133,
    status: "available",
  },
];

type Spec = {
  day: number;
  cust: string;
  svc: string;
  status: OrderStatus;
  pay: PaymentStatus;
  j?: string;
  progress: number;
  from?: string;
  to?: string;
  stars?: number;
  method: PaymentMethod;
  priority?: boolean;
};
const specs: Spec[] = [
  {
    day: 1,
    cust: "u-cust",
    svc: "s-mlbb-rank",
    status: "completed",
    pay: "paid",
    j: "j-1",
    progress: 100,
    from: "Epic",
    to: "Legend",
    method: "qris",
  },
  {
    day: 2,
    cust: "u-c2",
    svc: "s-valo-rank",
    status: "completed",
    pay: "paid",
    j: "j-3",
    progress: 100,
    from: "Gold",
    to: "Platinum",
    method: "ewallet",
  },
  {
    day: 3,
    cust: "u-c3",
    svc: "s-ff-rank",
    status: "cancelled",
    pay: "refunded",
    j: "j-4",
    progress: 20,
    from: "Gold",
    to: "Diamond",
    method: "va",
  },
  {
    day: 4,
    cust: "u-cust",
    svc: "s-mlbb-star",
    status: "pending_verification",
    pay: "paid",
    j: "j-2",
    progress: 100,
    stars: 20,
    method: "qris",
  },
  {
    day: 5,
    cust: "u-c4",
    svc: "s-pubg-rank",
    status: "in_progress",
    pay: "paid",
    j: "j-4",
    progress: 55,
    from: "Platinum",
    to: "Crown",
    method: "ewallet",
    priority: true,
  },
  {
    day: 5,
    cust: "u-c2",
    svc: "s-hok-rank",
    status: "on_hold",
    pay: "paid",
    j: "j-1",
    progress: 30,
    from: "Gold",
    to: "Diamond",
    method: "qris",
  },
  {
    day: 6,
    cust: "u-cust",
    svc: "s-mlbb-rank",
    status: "in_progress",
    pay: "paid",
    j: "j-1",
    progress: 40,
    from: "Legend",
    to: "Mythic Honor".replace("Mythic Honor", "Mythical Honor"),
    method: "qris",
    priority: true,
  },
  {
    day: 6,
    cust: "u-c3",
    svc: "s-gi-mission",
    status: "completed",
    pay: "paid",
    j: "j-6",
    progress: 100,
    method: "va",
  },
  {
    day: 7,
    cust: "u-c4",
    svc: "s-valo-place",
    status: "assigned",
    pay: "paid",
    j: "j-3",
    progress: 0,
    method: "ewallet",
  },
  {
    day: 7,
    cust: "u-c2",
    svc: "s-mlbb-mythic",
    status: "waiting_confirmation",
    pay: "paid",
    j: "j-2",
    progress: 0,
    method: "qris",
  },
  {
    day: 8,
    cust: "u-c3",
    svc: "s-mlbb-star",
    status: "waiting_assignment",
    pay: "paid",
    progress: 0,
    stars: 15,
    method: "qris",
  },
  {
    day: 8,
    cust: "u-cust",
    svc: "s-valo-rank",
    status: "cancelled",
    pay: "paid",
    progress: 0,
    from: "Silver",
    to: "Gold",
    method: "va",
  },
  {
    day: 9,
    cust: "u-c4",
    svc: "s-ff-rank",
    status: "waiting_assignment",
    pay: "paid",
    progress: 0,
    from: "Platinum",
    to: "Heroic",
    method: "ewallet",
  },
  {
    day: 9,
    cust: "u-c2",
    svc: "s-pubg-conq",
    status: "waiting_payment",
    pay: "pending",
    progress: 0,
    method: "va",
  },
  {
    day: 10,
    cust: "u-cust",
    svc: "s-hok-star",
    status: "waiting_payment",
    pay: "pending",
    progress: 0,
    stars: 10,
    method: "qris",
  },
  {
    day: 3,
    cust: "u-c3",
    svc: "s-mlbb-rank",
    status: "completed",
    pay: "paid",
    j: "j-2",
    progress: 100,
    from: "Grandmaster",
    to: "Epic",
    method: "qris",
  },
];

function priceFor(svc: JokiService, s: Spec) {
  const p = svc.pricing;
  let base = 0;
  if (svc.type === "rank_target" && p.tiers) {
    const a = p.tiers.findIndex((x) => x.name === s.from);
    const b = p.tiers.findIndex((x) => x.name === s.to);
    for (let i = a; i < b; i++) base += p.tiers[i]!.stepPrice;
  } else if (svc.type === "per_star") base = (s.stars ?? 1) * (p.pricePerStar ?? 0);
  else base = p.flatPrice ?? 0;
  const addons = s.priority ? [{ label: "Prioritas pengerjaan", amount: p.priorityPrice }] : [];
  return { base, addons, discount: 0, total: base + addons.reduce((x, y) => x + y.amount, 0) };
}

const PATH: OrderStatus[] = [
  "waiting_payment",
  "waiting_assignment",
  "waiting_confirmation",
  "assigned",
  "in_progress",
  "pending_verification",
  "completed",
];
const LOG_MSG: Record<OrderStatus, string> = {
  waiting_payment: "Pesanan dibuat, menunggu pembayaran.",
  waiting_assignment: "Pembayaran diterima. Mencari penjoki terbaik.",
  waiting_confirmation: "Penjoki ditawarkan, menunggu konfirmasi.",
  assigned: "Penjoki menerima tugas.",
  in_progress: "Penjoki mulai mengerjakan pesanan.",
  on_hold: "Pengerjaan ditunda: menunggu konfirmasi kode verifikasi dari pelanggan.",
  pending_verification: "Penjoki mengirim hasil, menunggu verifikasi admin.",
  completed: "Pesanan selesai dan diverifikasi.",
  cancelled: "Pesanan dibatalkan.",
};

export function buildSeed(): DB {
  const orders: Order[] = [];
  const payments: Payment[] = [];
  const logs: OrderProgressLog[] = [];
  const assignments: JokierAssignment[] = [];
  const perDay: Record<number, number> = {};

  specs.forEach((s, idx) => {
    const svc = seedServices.find((x) => x.id === s.svc)!;
    const game = seedGames.find((g) => g.id === svc.gameId)!;
    const cust = users.find((u) => u.id === s.cust)!;
    perDay[s.day] = (perDay[s.day] ?? 0) + 1;
    const ymd = `202610${String(s.day).padStart(2, "0")}`;
    const id = `BS-JK-${ymd}-${String(perDay[s.day]).padStart(3, "0")}`;
    const created = t(s.day, 9 + (idx % 8), (idx * 7) % 60);
    orders.push({
      id,
      invoice: `INV/${ymd}/${String(1000 + idx)}`,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      detail: {
        gameId: game.id,
        gameName: game.name,
        serviceId: svc.id,
        serviceName: svc.name,
        serviceType: svc.type,
        fromRank: s.from,
        toRank: s.to,
        stars: s.stars,
        server: svc.servers?.[0],
        priority: !!s.priority,
        modeLabel: svc.pricing.modes[0]?.label,
        gameUserId: String(10000000 + idx * 7331),
        gameServerId: game.id === "g-mlbb" ? "2041" : undefined,
      },
      price: priceFor(svc, s),
      paymentMethod: s.method,
      paymentStatus: s.pay,
      status: s.status,
      jokierId: s.j,
      progress: s.progress,
      createdAt: created,
      updatedAt: t(Math.min(s.day + 1, 10), 15),
    });
    payments.push({
      id: `pay-${idx + 1}`,
      orderId: id,
      method: s.method,
      amount: priceFor(svc, s).total,
      status: s.pay,
      createdAt: created,
    });

    // logs along the happy path until current status
    const target =
      s.status === "on_hold"
        ? "in_progress"
        : s.status === "cancelled"
          ? s.j
            ? "in_progress"
            : "waiting_assignment"
          : s.status;
    const end = PATH.indexOf(target);
    for (let i = 0; i <= end; i++) {
      const st = PATH[i]!;
      logs.push({
        id: `log-${idx}-${i}`,
        orderId: id,
        status: st,
        message: LOG_MSG[st],
        by:
          i === 0 || i === 1
            ? "system"
            : st === "completed" || st === "waiting_confirmation"
              ? "admin"
              : "jokier",
        progress:
          st === "in_progress"
            ? Math.min(s.progress, 10)
            : st === "pending_verification"
              ? 100
              : undefined,
        createdAt: t(s.day, 9 + (idx % 8) + i, 30),
      });
    }
    if (s.status === "in_progress" && s.progress > 10)
      logs.push({
        id: `log-${idx}-p`,
        orderId: id,
        status: "in_progress",
        message: `Progres ${s.progress}% — sesi push berjalan lancar.`,
        by: "jokier",
        progress: s.progress,
        createdAt: t(s.day + 1, 20),
      });
    if (s.status === "on_hold" || s.status === "cancelled")
      logs.push({
        id: `log-${idx}-x`,
        orderId: id,
        status: s.status,
        message: LOG_MSG[s.status],
        by: s.status === "on_hold" ? "jokier" : "admin",
        createdAt: t(s.day + 1, 12),
      });
    if (s.j)
      assignments.push({
        id: `as-${idx}`,
        orderId: id,
        jokierId: s.j,
        status: s.status === "waiting_confirmation" ? "pending" : "accepted",
        createdAt: t(s.day, 14),
      });
  });

  const tickets: SupportTicket[] = [
    {
      id: "TK-1001",
      orderId: orders[6]!.id,
      customerId: "u-cust",
      subject: "Kapan progres update?",
      category: "progres",
      priority: "medium",
      status: "open",
      createdAt: t(8, 11),
      messages: [
        {
          id: "m1",
          from: "customer",
          name: "Rizky Pratama",
          text: "Halo, progres belum naik sejak kemarin malam. Mohon infonya.",
          createdAt: t(8, 11),
        },
      ],
    },
    {
      id: "TK-1002",
      orderId: orders[5]!.id,
      customerId: "u-c2",
      subject: "Kode verifikasi login",
      category: "progres",
      priority: "high",
      status: "waiting_customer",
      createdAt: t(6, 13),
      messages: [
        {
          id: "m1",
          from: "customer",
          name: "Dinda Ayu",
          text: "Penjoki minta kode verifikasi?",
          createdAt: t(6, 13),
        },
        {
          id: "m2",
          from: "admin",
          name: "Admin Botak",
          text: "Betul kak, mohon kirim kode via WhatsApp resmi kami.",
          createdAt: t(6, 14),
        },
      ],
    },
    {
      id: "TK-1003",
      orderId: orders[0]!.id,
      customerId: "u-cust",
      subject: "Terima kasih, rank sudah naik",
      category: "hasil",
      priority: "low",
      status: "resolved",
      createdAt: t(3, 9),
      messages: [
        {
          id: "m1",
          from: "customer",
          name: "Rizky Pratama",
          text: "Mantap, sudah Legend!",
          createdAt: t(3, 9),
        },
      ],
    },
    {
      id: "TK-1004",
      orderId: orders[2]!.id,
      customerId: "u-c3",
      subject: "Minta refund, order lama",
      category: "pembayaran",
      priority: "high",
      status: "closed",
      createdAt: t(4, 10),
      messages: [
        {
          id: "m1",
          from: "customer",
          name: "Fajar Nugroho",
          text: "Saya ingin batalkan dan refund.",
          createdAt: t(4, 10),
        },
      ],
    },
    {
      id: "TK-1005",
      orderId: orders[13]!.id,
      customerId: "u-c2",
      subject: "VA tidak muncul",
      category: "pembayaran",
      priority: "medium",
      status: "open",
      createdAt: t(9, 16),
      messages: [
        {
          id: "m1",
          from: "customer",
          name: "Dinda Ayu",
          text: "Nomor virtual account tidak muncul di aplikasi bank.",
          createdAt: t(9, 16),
        },
      ],
    },
  ];

  const refunds: Refund[] = [
    {
      id: "RF-201",
      orderId: orders[2]!.id,
      customerId: "u-c3",
      amount: orders[2]!.price.total,
      reason: "Penjoki tidak tersedia terlalu lama.",
      status: "processed",
      createdAt: t(4, 11),
    },
    {
      id: "RF-202",
      orderId: orders[11]!.id,
      customerId: "u-cust",
      amount: orders[11]!.price.total,
      reason: "Salah pilih rank awal.",
      status: "requested",
      createdAt: t(9, 9),
    },
    {
      id: "RF-203",
      orderId: orders[5]!.id,
      customerId: "u-c2",
      amount: Math.round(orders[5]!.price.total / 2),
      reason: "Pengerjaan tertunda lama.",
      status: "reviewing",
      createdAt: t(8, 10),
    },
    {
      id: "RF-204",
      orderId: orders[1]!.id,
      customerId: "u-c2",
      amount: 50000,
      reason: "Ingin refund sebagian.",
      status: "rejected",
      adminNote: "Pesanan sudah selesai sesuai target.",
      createdAt: t(4, 15),
    },
  ];

  const notifications: Notification[] = [
    {
      id: "n1",
      userId: "u-cust",
      title: "Progres diperbarui",
      body: `Pesanan ${orders[6]!.id} sudah 40%.`,
      read: false,
      link: orders[6]!.id,
      createdAt: t(9, 20),
    },
    {
      id: "n2",
      userId: "u-cust",
      title: "Hasil menunggu verifikasi",
      body: `Pesanan ${orders[3]!.id} sedang diverifikasi admin.`,
      read: false,
      link: orders[3]!.id,
      createdAt: t(9, 12),
    },
    {
      id: "n3",
      userId: "u-cust",
      title: "Pesanan selesai",
      body: `Pesanan ${orders[0]!.id} telah selesai.`,
      read: true,
      link: orders[0]!.id,
      createdAt: t(2, 18),
    },
    {
      id: "n4",
      userId: "u-admin",
      title: "Order baru menunggu penjoki",
      body: `${orders[10]!.id} dan ${orders[12]!.id} belum ditugaskan.`,
      read: false,
      createdAt: t(9, 10),
    },
    {
      id: "n5",
      userId: "u-admin",
      title: "Pengajuan refund baru",
      body: "RF-202 menunggu tinjauan.",
      read: false,
      createdAt: t(9, 9),
    },
    {
      id: "n6",
      userId: "u-j1",
      title: "Tugas aktif",
      body: `Lanjutkan ${orders[6]!.id} (prioritas).`,
      read: false,
      link: orders[6]!.id,
      createdAt: t(9, 8),
    },
    {
      id: "n7",
      userId: "u-j2",
      title: "Penawaran tugas baru",
      body: `${orders[9]!.id} menunggu konfirmasimu.`,
      read: false,
      link: orders[9]!.id,
      createdAt: t(7, 15),
    },
  ];

  const coupons: Coupon[] = [
    {
      id: "c1",
      code: "BOTAK10",
      type: "percent",
      value: 10,
      minOrder: 50000,
      quota: 500,
      used: 132,
      active: true,
      expiresAt: "2026-12-31T16:59:00.000Z",
    },
    {
      id: "c2",
      code: "HEMAT25K",
      type: "fixed",
      value: 25000,
      minOrder: 150000,
      quota: 200,
      used: 54,
      active: true,
      expiresAt: "2026-11-30T16:59:00.000Z",
    },
    {
      id: "c3",
      code: "MYTHIC50",
      type: "fixed",
      value: 50000,
      minOrder: 300000,
      quota: 50,
      used: 50,
      active: true,
      expiresAt: "2026-12-31T16:59:00.000Z",
    },
    {
      id: "c4",
      code: "SEASONLAMA",
      type: "percent",
      value: 15,
      minOrder: 0,
      quota: 100,
      used: 12,
      active: false,
      expiresAt: "2026-09-30T16:59:00.000Z",
    },
  ];

  return {
    users,
    games: seedGames,
    services: seedServices,
    orders,
    payments,
    jokiers,
    assignments,
    logs,
    tickets,
    refunds,
    notifications,
    coupons,
    settings: {
      storeName: "BotakStore",
      whatsapp: "6281100000000",
      announcement: "Promo season baru: diskon 10% semua joki rank dengan kode BOTAK10",
      maintenance: false,
    },
    session: null,
    draft: null,
  };
}
