import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/Dashboard";

export const Route = createFileRoute("/_dashboard/dashboard")({
  head: () => ({
    meta: [{ title: "Дашборд — TeleBoost" }],
  }),
  component: Dashboard,
});
