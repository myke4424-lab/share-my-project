import { createFileRoute } from "@tanstack/react-router";
import Inviting from "@/pages/Inviting";

export const Route = createFileRoute("/_dashboard/inviting")({
  head: () => ({
    meta: [{ title: "Инвайтинг — TeleBoost" }],
  }),
  component: Inviting,
});
