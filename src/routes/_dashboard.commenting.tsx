import { createFileRoute } from "@tanstack/react-router";
import Commenting from "@/pages/Commenting";

export const Route = createFileRoute("/_dashboard/commenting")({
  head: () => ({
    meta: [{ title: "Комментинг — TeleBoost" }],
  }),
  component: Commenting,
});
