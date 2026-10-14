import { createFileRoute } from "@tanstack/react-router";
import { OrderCheckTab } from "@/components/bs/OrderCheckTab";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/cek-order")({
  head: () => ({
    meta: [
      { title: "Cek Pesanan — BotakStore" },
      { name: "description", content: "Cek status dan progres pesanan BotakStore." },
      ...routeSeo("/cek-order", "Cek Pesanan — BotakStore", "Cek status dan progres pesanan BotakStore."),
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  return (
    <PublicLayout footerGap="tight" serviceNavigation="orders">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <OrderCheckTab />
      </div>
    </PublicLayout>
  );
}
