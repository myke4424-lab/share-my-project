import { createFileRoute } from "@tanstack/react-router";
import Proxies from "@/pages/Proxies";

export const Route = createFileRoute("/_dashboard/proxies")({
  head: () => ({
    meta: [{ title: "Прокси — TeleBoost" }],
  }),
  component: Proxies,
});
