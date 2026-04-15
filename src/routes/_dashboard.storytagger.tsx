import { createFileRoute } from "@tanstack/react-router";
import StoryTagger from "@/pages/StoryTagger";

export const Route = createFileRoute("/_dashboard/storytagger")({
  head: () => ({
    meta: [{ title: "Теггер — TeleBoost" }],
  }),
  component: StoryTagger,
});
