import { createFileRoute } from "@tanstack/react-router";
import StoryLooking from "@/pages/StoryLooking";

export const Route = createFileRoute("/_dashboard/storylooking")({
  head: () => ({
    meta: [{ title: "Масслукинг — TeleBoost" }],
  }),
  component: StoryLooking,
});
