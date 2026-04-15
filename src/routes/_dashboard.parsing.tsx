import { createFileRoute } from "@tanstack/react-router";
import Parser from "@/pages/Parser";

export const Route = createFileRoute("/_dashboard/parsing")({
  head: () => ({
    meta: [{ title: "Парсинг — TeleBoost" }],
  }),
  component: Parser,
});
