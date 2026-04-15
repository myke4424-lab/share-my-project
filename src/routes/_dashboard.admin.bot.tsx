import { createFileRoute } from "@tanstack/react-router";
import BotAdmin from "@/pages/BotAdmin";

export const Route = createFileRoute("/_dashboard/admin/bot")({
  head: () => ({
    meta: [{ title: "Бот Админ — TeleBoost" }],
  }),
  component: BotAdmin,
});
