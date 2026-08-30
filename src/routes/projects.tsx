import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { PlaceholderScreen } from "@/components/zavita/PlaceholderScreen";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ZAVITA" },
      { name: "description", content: "All your ZAVITA AI video and photo projects in one place." },
      { property: "og:title", content: "Projects — ZAVITA" },
      { property: "og:description", content: "All your ZAVITA AI projects in one place." },
    ],
  }),
  component: () => (
    <PlaceholderScreen
      icon={LayoutGrid}
      title="Projects"
      description="Every recording, edit and export you create with ZAVITA will live here."
    />
  ),
});
