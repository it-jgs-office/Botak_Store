import { createFileRoute, redirect } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { TopupTab } from "@/components/bs/TopupTab";

export const Route = createFileRoute("/topup/$slug")({
  beforeLoad: ({ params }) => {
    if (params.slug !== "mobile-legends") {
      throw redirect({ to: "/", hash: "topup" });
    }
  },
  head: () => ({
    meta: [
      { title: "Top Up Mobile Legends — BotakStore" },
      {
        name: "description",
        content: "Top up Diamond Mobile Legends cepat dan aman di BotakStore.",
      },
    ],
  }),
  component: TopupDetailPage,
});

function TopupDetailPage() {
  const { slug } = Route.useParams();

  return (
    <PublicLayout banner="none">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:py-10">
        <TopupTab gameSlug={slug} />
      </div>
    </PublicLayout>
  );
}
