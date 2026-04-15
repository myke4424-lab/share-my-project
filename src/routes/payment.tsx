import { createFileRoute } from "@tanstack/react-router";
import Payment from "@/pages/Payment";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Оплата — TeleBoost" },
    ],
  }),
  component: Payment,
});
