import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/joki/")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "joki" });
  },
});
