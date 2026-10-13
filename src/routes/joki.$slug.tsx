import { createFileRoute, redirect } from "@tanstack/react-router";
import { PublicLayout } from "@/components/bs/PublicLayout";
import { JokiTab } from "@/components/bs/JokiTab";

export const Route = createFileRoute("/joki/$slug")({
  beforeLoad: ({ params }) => {
    if (params.slug !== "mobile-legends") {
      throw redirect({ to: "/", hash: "joki" });
    }
  },
  head: () => ({
    meta: [
      { title: "Joki Mobile Legends — BotakStore" },
      { name: "description", content: "Joki Mobile Legends cepat, aman, dan bergaransi di BotakStore." },
    ],
  }),
  component: JokiDetailPage,
});

function JokiDetailPage() {
  const { slug } = Route.useParams();

  return (
    <PublicLayout banner="none">
      <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-4 sm:py-6 md:py-10">
        <JokiTab gameSlug={slug} />
      </div>
    </PublicLayout>
  );
}
