import { createFileRoute } from "@tanstack/react-router";
import Chatting from "@/pages/Chatting";

export const Route = createFileRoute("/_dashboard/chatting")({
  head: () => ({
    meta: [{ title: "Чаттинг — TeleBoost" }],
  }),
  component: Chatting,
});
