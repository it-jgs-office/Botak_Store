export type PakasirMethod =
  | "payment_link"
  | "qris"
  | "bri_va"
  | "bni_va"
  | "cimb_niaga_va"
  | "danamon_va"
  | "maybank_va"
  | "bnc_va"
  | "bsi_va"
  | "muamalat_va"
  | "ocbc_va";

export const PAKASIR_PAYMENT_METHODS: Array<{
  id: PakasirMethod;
  name: string;
  description: string;
  icon: string;
}> = [
  { id: "qris", name: "QRIS", description: "Scan dengan semua e-wallet & mobile banking", icon: "/payment/qris.png" },
  { id: "bri_va", name: "BRI Virtual Account", description: "Transfer melalui Bank BRI", icon: "/payment/bri.webp" },
  { id: "bni_va", name: "BNI Virtual Account", description: "Transfer melalui Bank BNI", icon: "/payment/bni.webp" },
  { id: "cimb_niaga_va", name: "CIMB Niaga Virtual Account", description: "Transfer melalui CIMB Niaga", icon: "/payment/cimb.jpg" },
  { id: "danamon_va", name: "Danamon Virtual Account", description: "Transfer melalui Bank Danamon", icon: "D" },
  { id: "maybank_va", name: "Maybank Virtual Account", description: "Transfer melalui Maybank", icon: "/payment/maybank.png" },
  { id: "bnc_va", name: "Bank Neo Commerce", description: "Transfer melalui BNC", icon: "BNC" },
  { id: "bsi_va", name: "BSI Virtual Account", description: "Transfer melalui Bank Syariah Indonesia", icon: "BSI" },
  { id: "muamalat_va", name: "Muamalat Virtual Account", description: "Transfer melalui Bank Muamalat", icon: "MUA" },
  { id: "ocbc_va", name: "OCBC Virtual Account", description: "Transfer melalui OCBC", icon: "OCBC" },
  { id: "payment_link", name: "Payment Link", description: "Pilih metode pembayaran di halaman Pakasir", icon: "LINK" },
];

export function pakasirMethod(method: string) {
  return PAKASIR_PAYMENT_METHODS.find((item) => item.id === method) ?? PAKASIR_PAYMENT_METHODS[0];
}

// Metode yang aktif ditampilkan di halaman pembayaran.
export const ACTIVE_PAKASIR_METHOD_IDS: PakasirMethod[] = [
  "qris",
  "bni_va",
  "bri_va",
  "cimb_niaga_va",
  "maybank_va",
];

export const ACTIVE_PAKASIR_PAYMENT_METHODS = PAKASIR_PAYMENT_METHODS.filter((item) =>
  ACTIVE_PAKASIR_METHOD_IDS.includes(item.id),
);
