import { createFileRoute } from "@tanstack/react-router";
import Referral from "@/pages/Referral";

export const Route = createFileRoute("/_dashboard/referral")({
  head: () => ({
    meta: [{ title: "Рефералка — TeleBoost" }],
  }),
  component: Referral,
});
