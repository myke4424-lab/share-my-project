import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

export const Route = createFileRoute("/_dashboard/admin")({
  head: () => ({
    meta: [{ title: "Админ — TeleBoost" }],
  }),
  component: Admin,
});
