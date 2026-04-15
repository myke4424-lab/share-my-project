import { createFileRoute, redirect } from "@tanstack/react-router";
import Login from "@/pages/Login";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Вход — TeleBoost" },
      { name: "description", content: "Войдите в панель управления TeleBoost" },
    ],
  }),
  component: Login,
});
