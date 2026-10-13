import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cek-order")({
  beforeLoad: () => {
    throw redirect({ to: "/", hash: "orders" });
  },
});
