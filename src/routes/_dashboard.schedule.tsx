import { createFileRoute } from "@tanstack/react-router";
import Schedule from "@/pages/Schedule";

export const Route = createFileRoute("/_dashboard/schedule")({
  head: () => ({
    meta: [{ title: "Планировщик — TeleBoost" }],
  }),
  component: Schedule,
});
