import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/Notifications";

export const Route = createFileRoute("/_dashboard/notifications")({
  head: () => ({
    meta: [{ title: "История — TeleBoost" }],
  }),
  component: Notifications,
});
