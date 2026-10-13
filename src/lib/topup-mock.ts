export interface TopupPack {
  id: string;
  label: string;
  sub?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  icon: string;
}

export interface TopupPayment {
  id: string;
  group: string;
  name: string;
  fee: number;
  icon: string;
  note?: string;
}

export interface TopupGame {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  short: string;
  hue: number;
  category: string;
  rating: number;
  sold: number;
  instant: boolean;
  needServer: boolean;
  idLabel: string;
  serverLabel?: string;
  howTo: string[];
  description: string;
  packs: TopupPack[];
}

const DIAMOND = "💎";
const COIN = "🪙";
const TICKET = "🎟️";

export const TOPUP_PAYMENTS: TopupPayment[] = [
  { id: "qris", group: "QRIS", name: "QRIS All Payment (Semua E-Wallet & M-Banking)", fee: 0, icon: "◧", note: "Instan" },
  { id: "nobu-va", group: "Virtual Account", name: "VA Bank Nobu (Virtual Account / Transfer)", fee: 4000, icon: "N" },
  { id: "gopay", group: "E-Wallet", name: "GoPay", fee: 1000, icon: "G" },
  { id: "ovo", group: "E-Wallet", name: "OVO", fee: 1000, icon: "O" },
  { id: "dana", group: "E-Wallet", name: "DANA", fee: 1000, icon: "D" },
  { id: "shopeepay", group: "E-Wallet", name: "ShopeePay", fee: 1000, icon: "S" },
  { id: "bca-va", group: "Virtual Account", name: "BCA Virtual Account", fee: 4000, icon: "B" },
  { id: "bri-va", group: "Virtual Account", name: "BRI Virtual Account", fee: 4000, icon: "B" },
  { id: "mandiri-va", group: "Virtual Account", name: "Mandiri Virtual Account", fee: 4000, icon: "M" },
  { id: "pulsa-telkomsel", group: "Pulsa", name: "Telkomsel", fee: 2000, icon: "T" },
  { id: "alfamart", group: "Gerai", name: "Alfamart", fee: 2500, icon: "A" },
];

const mlbbDiamondPrices = [
  [5, 1723], [10, 3441], [12, 3848], [11, 3848], [15, 4759], [14, 4959],
  [19, 5972], [20, 6277], [24, 7574], [28, 8552], [30, 9313], [34, 10660],
  [36, 11133], [42, 12806], [44, 12806], [45, 14010], [46, 14324], [54, 15800],
  [59, 16904], [64, 18422], [65, 19485], [70, 20547], [80, 23583], [85, 24340],
  [89, 26120], [92, 26920], [98, 28453], [110, 33745], [129, 38751], [140, 42394],
  [145, 43911], [148, 44367], [167, 48527], [172, 50347], [176, 52409], [182, 53625],
  [200, 59088], [222, 65461], [240, 70621], [258, 77324], [261, 78539], [277, 82940],
  [282, 84458], [284, 85217], [296, 87794], [300, 87312], [323, 94295], [406, 115774],
  [408, 119208], [429, 124038], [500, 147738], [514, 150015], [570, 163610], [642, 188340],
  [706, 206854], [716, 209434], [770, 224610], [841, 244489], [875, 250861], [966, 277571],
  [1050, 310030], [1084, 310959], [1136, 334159], [1163, 332356], [1358, 397595],
  [1446, 409446], [1669, 482124], [1750, 501697], [2010, 543732], [2232, 607168],
  [2398, 674211], [2578, 700799], [3073, 837988], [3638, 1014296], [4020, 1107439],
  [4830, 1306860], [4958, 1348851], [5532, 1492043], [6030, 1621146],
  [9288, 2528867], [10050, 2831818], [18510, 4571709], [20100, 5427305],
] as const;

const mlbbPacks: TopupPack[] = [
  ...mlbbDiamondPrices.map(([amount, price]) => ({
    id: `ml-${amount}`,
    label: `${amount} Diamond`,
    price,
    icon: DIAMOND,
  })),
  { id: "ml-weekly", label: "Weekly Diamond Pass", price: 30819, icon: TICKET, badge: "Best Seller" },
  { id: "ml-weekly-2", label: "Weekly Diamond Pass 2x", price: 60613, icon: TICKET, badge: "Best Seller" },
  { id: "ml-weekly-3", label: "Weekly Diamond Pass 3x", price: 91407, icon: TICKET, badge: "Best Seller" },
  { id: "ml-weekly-4", label: "Weekly Diamond Pass 4x", price: 121201, icon: TICKET, badge: "Best Seller" },
  { id: "ml-twilight", label: "Twilight Pass", price: 155500, icon: TICKET },
  { id: "ml-weekly-5", label: "Weekly Diamond Pass 5x", price: 152995, icon: TICKET, badge: "Best Seller" },
];

export const TOPUP_GAMES: TopupGame[] = [
  {
    id: "g-mlbb",
    slug: "mobile-legends",
    name: "Mobile Legends",
    publisher: "Moonton",
    short: "MLBB",
    hue: 210,
    category: "MOBA",
    rating: 4.9,
    sold: 128400,
    instant: true,
    needServer: true,
    idLabel: "User ID",
    serverLabel: "Server ID",
    howTo: [
      "Buka profil Mobile Legends, salin User ID dan Server ID. Contoh: 12345678 (2041).",
      "Masukkan User ID dan Server ID pada kolom di bawah.",
      "Pilih nominal diamond yang diinginkan.",
      "Pilih metode pembayaran dan selesaikan pembayaran.",
      "Diamond masuk otomatis dalam hitungan detik.",
    ],
    description:
      "Top up Diamond Mobile Legends proses instan 24 jam. Cukup masukkan User ID + Server ID, diamond langsung masuk ke akun tanpa perlu login.",
    packs: mlbbPacks,
  },
  {
    id: "g-ff",
    slug: "free-fire",
    name: "Free Fire",
    publisher: "Garena",
    short: "FF",
    hue: 15,
    category: "Battle Royale",
    rating: 4.8,
    sold: 96400,
    instant: true,
    needServer: false,
    idLabel: "User ID",
    howTo: [
      "Salin User ID Free Fire dari profil akunmu.",
      "Masukkan User ID pada kolom di bawah.",
      "Pilih nominal diamond dan bayar. Diamond masuk otomatis.",
    ],
    description:
      "Top up Diamond Free Fire instan hanya dengan User ID. Tanpa login akun, aman dan cepat.",
    packs: [
      { id: "ff-5", label: "5 Diamond", price: 1500, icon: DIAMOND },
      { id: "ff-12", label: "12 Diamond", price: 3500, icon: DIAMOND },
      { id: "ff-50", label: "50 Diamond", price: 9000, icon: DIAMOND },
      { id: "ff-140", label: "140 Diamond", price: 22000, icon: DIAMOND, badge: "Populer" },
      { id: "ff-355", label: "355 Diamond", price: 52000, icon: DIAMOND, badge: "Populer" },
      { id: "ff-720", label: "720 Diamond", price: 102000, icon: DIAMOND, badge: "Hemat" },
      { id: "ff-m", label: "Membership Mingguan", price: 32000, icon: TICKET },
      { id: "ff-mb", label: "Membership Bulanan", price: 95000, icon: TICKET, badge: "Hemat" },
    ],
  },
  {
    id: "g-valo",
    slug: "valorant",
    name: "Valorant",
    publisher: "Riot Games",
    short: "VALO",
    hue: 350,
    category: "FPS",
    rating: 4.8,
    sold: 31200,
    instant: true,
    needServer: false,
    idLabel: "Riot ID",
    howTo: [
      "Gunakan format Riot ID + Tagline. Contoh: BotakStore#SEA.",
      "Pilih nominal Points dan selesaikan pembayaran.",
      "Kode voucher dikirim ke WhatsApp & email.",
    ],
    description: "Valorant Points via kode voucher resmi. Redeem langsung di client Riot.",
    packs: [
      { id: "v-375", label: "375 Points", price: 55000, icon: COIN },
      { id: "v-730", label: "730 Points", price: 105000, icon: COIN, badge: "Populer" },
      { id: "v-475", label: "475 Points", price: 68000, icon: COIN },
      { id: "v-1440", label: "1440 Points", price: 205000, icon: COIN, badge: "Hemat" },
      { id: "v-2400", label: "2400 Points", price: 335000, icon: COIN },
    ],
  },
  {
    id: "g-pubgm",
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    publisher: "Level Infinite",
    short: "PUBG",
    hue: 45,
    category: "Battle Royale",
    rating: 4.7,
    sold: 45800,
    instant: true,
    needServer: false,
    idLabel: "Character ID",
    howTo: [
      "Salin Character ID dari profil PUBG Mobile.",
      "Masukkan ID, pilih nominal UC, dan bayar.",
      "UC masuk langsung ke akun dalam hitungan menit.",
    ],
    description: "Top up Unknown Cash (UC) PUBG Mobile langsung ke Character ID.",
    packs: [
      { id: "p-60", label: "60 UC", price: 15000, icon: COIN },
      { id: "p-325", label: "325 UC", price: 75000, icon: COIN, badge: "Populer" },
      { id: "p-660", label: "660 UC", price: 150000, icon: COIN },
      { id: "p-1800", label: "1800 UC", price: 375000, icon: COIN, badge: "Hemat" },
      { id: "p-prime", label: "Prime 1 Bulan", price: 135000, icon: TICKET },
    ],
  },
  {
    id: "g-gi",
    slug: "genshin-impact",
    name: "Genshin Impact",
    publisher: "HoYoverse",
    short: "GI",
    hue: 190,
    category: "RPG",
    rating: 4.9,
    sold: 22100,
    instant: true,
    needServer: true,
    idLabel: "UID",
    serverLabel: "Server",
    howTo: [
      "Salin UID dan pilih server (Asia / America / Europe).",
      "Pilih nominal Genesis Crystal dan bayar.",
      "Crystal masuk otomatis via top-up resmi HoYoverse.",
    ],
    description: "Genesis Crystal Genshin Impact resmi, langsung masuk via UID.",
    packs: [
      { id: "g-60", label: "60 Crystal", price: 15000, icon: COIN },
      { id: "g-330", label: "330 Crystal", price: 75000, icon: COIN, badge: "Populer" },
      { id: "g-1090", label: "1090 Crystal", price: 240000, icon: COIN },
      { id: "g-2240", label: "2240 Crystal", price: 480000, icon: COIN, badge: "Hemat" },
      { id: "g-blessing", label: "Blessing 30 Hari", price: 75000, icon: TICKET, badge: "Populer" },
    ],
  },
  {
    id: "g-hok",
    slug: "honor-of-kings",
    name: "Honor of Kings",
    publisher: "TiMi Studio",
    short: "HOK",
    hue: 260,
    category: "MOBA",
    rating: 4.7,
    sold: 18900,
    instant: true,
    needServer: false,
    idLabel: "User ID",
    howTo: [
      "Salin User ID Honor of Kings dari profil.",
      "Pilih nominal Token dan selesaikan pembayaran.",
      "Token masuk otomatis.",
    ],
    description: "Top up Token Honor of Kings instan via User ID.",
    packs: [
      { id: "h-80", label: "80 Token", price: 15000, icon: COIN },
      { id: "h-240", label: "240 Token", price: 45000, icon: COIN, badge: "Populer" },
      { id: "h-400", label: "400 Token", price: 75000, icon: COIN },
      { id: "h-800", label: "800 Token", price: 145000, icon: COIN, badge: "Hemat" },
    ],
  },
];

export const getTopupGame = (slug: string) => TOPUP_GAMES.find((g) => g.slug === slug);
