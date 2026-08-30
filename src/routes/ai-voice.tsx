import { createFileRoute } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { PlaceholderScreen } from "@/components/zavita/PlaceholderScreen";

export const Route = createFileRoute("/ai-voice")({
  head: () => ({
    meta: [
      { title: "AI Voice — ZAVITA" },
      {
        name: "description",
        content: "Clean, boost and clone your voice with ZAVITA AI Voice.",
      },
      { property: "og:title", content: "AI Voice — ZAVITA" },
      { property: "og:description", content: "Studio-grade AI voice for your videos." },
    ],
  }),
  component: () => (
    <PlaceholderScreen
      icon={Mic}
      title="AI Voice"
      description="Studio-clean your audio, remove noise and generate natural voiceovers. Arriving in the next phase."
    />
  ),
});
