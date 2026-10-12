import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { PageHeader } from "@/components/bs/ui";
import { TOPUP_GAMES } from "@/lib/topup-mock";

export const Route = createFileRoute("/topup/")({
  head: () => ({
    meta: [
      { title: "Top Up Game Instan — BotakStore" },
      { name: "description", content: "Top up diamond, UC, Points, dan voucher game favoritmu. Proses instan, aman, 24 jam." },
    ],
  }),
  component: TopupCatalog,
});

function TopupCatalog() {
  const mobileLegends = TOPUP_GAMES.find((game) => game.slug === "mobile-legends");

  if (!mobileLegends) return null;

  return (
    <PublicLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <PageHeader
          title="Top Up Mobile Legends"
          desc="Top up Diamond Mobile Legends instan, aman, dan tersedia 24 jam."
        />

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          <Link
            to="/topup/$slug"
            params={{ slug: mobileLegends.slug }}
            className="group flex aspect-[3/4] w-full flex-col overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-1 hover:border-[#e3c34d] hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,.35)]"
          >
            <img
              src="/mlbb-diamond.svg"
              alt="Mobile Legends"
              className="h-full w-full bg-[linear-gradient(135deg,#163d82,#071630)] object-cover p-10 transition duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        <div className="mt-8 grid gap-3 rounded-2xl border border-[#ecd46e] bg-[#fff8df] p-5 text-sm sm:grid-cols-3">
          {[
            ["1. Masukkan ID", "Tanpa login akun, cukup User ID + Server."],
            ["2. Pilih nominal", "Diamond, UC, Points, Crystal & voucher."],
            ["3. Bayar & instan", "QRIS, e-wallet, VA, pulsa, gerai."],
          ].map(([t, d]) => (
            <div key={t} className="flex items-start gap-2.5">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8a6800]" />
              <div>
                <p className="font-black">{t}</p>
                <p className="mt-0.5 text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
