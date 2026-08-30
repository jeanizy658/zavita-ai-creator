import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PlaceholderScreen } from "@/components/zavita/PlaceholderScreen";

export const Route = createFileRoute("/avatar")({
  head: () => ({
    meta: [
      { title: "AI Avatar — ZAVITA" },
      { name: "description", content: "Create a talking AI avatar that presents your content for you." },
      { property: "og:title", content: "AI Avatar — ZAVITA" },
      { property: "og:description", content: "Create a talking AI avatar with ZAVITA." },
    ],
  }),
  component: () => (
    <PlaceholderScreen
      icon={Sparkles}
      title="AI Avatar"
      description="Generate a photorealistic talking avatar from a single clip and let it present for you."
    />
  ),
});
