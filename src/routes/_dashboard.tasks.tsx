import { createFileRoute } from "@tanstack/react-router";
import Tasks from "@/pages/Tasks";

export const Route = createFileRoute("/_dashboard/tasks")({
  head: () => ({
    meta: [{ title: "Задачи — TeleBoost" }],
  }),
  component: Tasks,
});
