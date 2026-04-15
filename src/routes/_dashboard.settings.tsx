import { createFileRoute } from "@tanstack/react-router";
import Settings from "@/pages/Settings";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({
    meta: [{ title: "Настройки — TeleBoost" }],
  }),
  component: Settings,
});
