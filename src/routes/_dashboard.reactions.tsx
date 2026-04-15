import { createFileRoute } from "@tanstack/react-router";
import Reactions from "@/pages/Reactions";

export const Route = createFileRoute("/_dashboard/reactions")({
  head: () => ({
    meta: [{ title: "Реакции — TeleBoost" }],
  }),
  component: Reactions,
});
