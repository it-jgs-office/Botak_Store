import { createFileRoute } from "@tanstack/react-router";
import { JokiPage } from "./index";
import { routeSeo } from "@/lib/site";

export const Route = createFileRoute("/joki/")({
  head: () => ({
    meta: [
      { title: "Joki Rank Mobile Legends — BotakStore" },
      { name: "description", content: "Pilih layanan joki rank Mobile Legends di BotakStore." },
      ...routeSeo("/joki", "Joki Rank Mobile Legends — BotakStore", "Pilih layanan joki rank Mobile Legends di BotakStore."),
    ],
  }),
  component: JokiPage,
});
