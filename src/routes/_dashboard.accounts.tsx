import { createFileRoute } from "@tanstack/react-router";
import Accounts from "@/pages/Accounts";

export const Route = createFileRoute("/_dashboard/accounts")({
  head: () => ({
    meta: [{ title: "Аккаунты — TeleBoost" }],
  }),
  component: Accounts,
});
