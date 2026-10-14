import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, TicketPercent } from "lucide-react";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { Button } from "@/components/ui/button";
import { useDB } from "@/lib/store";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/voucher")({
  head: () => ({
    meta: [
      { title: "Voucher & Promo — BotakStore" },
      { name: "description", content: "Lihat voucher dan promo BotakStore yang sedang aktif." },
      ...routeSeo("/voucher", "Voucher & Promo — BotakStore", "Lihat voucher dan promo BotakStore yang sedang aktif."),
    ],
  }),
  component: VoucherPage,
});

function VoucherPage() {
  const db = useDB();
  const activeCoupons = db.coupons.filter((coupon) => coupon.active);

  return (
    <PublicLayout footerGap="tight" serviceNavigation="voucher">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <section className="rounded-3xl border border-[#ecd46e] bg-[linear-gradient(145deg,#fffdf4,#fff8dc)] p-5 shadow-[0_18px_50px_-38px_rgba(104,76,0,.5)] sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#ffd84d] text-[#17191d] shadow-sm">
              <TicketPercent className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#8a6800]">Promo BotakStore</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#172033] sm:text-3xl">Voucher & Promo</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#697386]">Gunakan kode promo aktif untuk mendapatkan potongan pada pesananmu.</p>
            </div>
          </div>
        </section>

        {activeCoupons.length ? (
          <section className="grid grid-cols-2 gap-3 py-5 sm:gap-4 sm:py-8 lg:grid-cols-3">
            {activeCoupons.map((coupon) => (
              <article key={coupon.id} className="flex min-w-0 flex-col rounded-2xl border border-[#e7dfbd] bg-white p-3 shadow-[0_14px_35px_-28px_rgba(31,41,55,.28)] sm:p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff3bd] text-[#8a6800]">
                  <BadgePercent className="h-4 w-4" />
                </span>
                <h2 className="mt-3 truncate text-sm font-black text-[#172033] sm:text-base">{coupon.code}</h2>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#697386] sm:text-xs">Potongan khusus untuk pesanan yang memenuhi ketentuan promo.</p>
                <Button asChild size="sm" className="mt-4 w-full bg-[#ffd84d] text-[#17191d] hover:bg-[#ffca24]">
                  <Link to="/joki">Pilih layanan <ArrowRight /></Link>
                </Button>
              </article>
            ))}
          </section>
        ) : (
          <section className="py-5 sm:py-8">
            <div className="flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-[#dccb7a] bg-white px-5 py-10 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff3bd] text-[#8a6800]">
                <TicketPercent className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-xl font-black text-[#172033]">Belum ada voucher aktif</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#697386]">Promo terbaru akan ditampilkan di halaman ini.</p>
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
