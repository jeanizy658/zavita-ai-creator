import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PlaceholderScreen } from "@/components/zavita/PlaceholderScreen";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "AI Camera — ZAVITA" },
      { name: "description", content: "Record a video with the ZAVITA AI camera and let AI finish it." },
      { property: "og:title", content: "AI Camera — ZAVITA" },
      { property: "og:description", content: "Record a video with the ZAVITA AI camera." },
    ],
  }),
  component: () => (
    <PlaceholderScreen
      icon={Camera}
      title="AI Camera"
      description="Record with smart framing, teleprompter and live enhancement. Create once, let AI do the rest."
    />
  ),
});
