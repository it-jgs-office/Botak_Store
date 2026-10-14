import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { TopupTab } from "@/components/bs/TopupTab";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/topup/")({
  head: () => ({
    meta: [
      { title: "Top Up Mobile Legends — BotakStore" },
      { name: "description", content: "Pilih paket top up Mobile Legends yang tersedia." },
      ...routeSeo("/topup", "Top Up Mobile Legends — BotakStore", "Pilih paket top up Mobile Legends yang tersedia."),
    ],
  }),
  component: TopupPage,
});

function TopupPage() {
  return (
    <PublicLayout footerGap="tight" serviceNavigation="topup">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        <TopupTab />
      </div>
    </PublicLayout>
  );
}
