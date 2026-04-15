import { createFileRoute } from "@tanstack/react-router";
import Warming from "@/pages/Warming";

export const Route = createFileRoute("/_dashboard/warming")({
  head: () => ({
    meta: [{ title: "Прогрев — TeleBoost" }],
  }),
  component: Warming,
});
