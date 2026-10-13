import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/topup/")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "topup" });
  },
});
