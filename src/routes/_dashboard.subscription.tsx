import { createFileRoute } from "@tanstack/react-router";
import Subscription from "@/pages/Subscription";

export const Route = createFileRoute("/_dashboard/subscription")({
  head: () => ({
    meta: [{ title: "Подписка — TeleBoost" }],
  }),
  component: Subscription,
});
