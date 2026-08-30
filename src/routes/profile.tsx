import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { PlaceholderScreen } from "@/components/zavita/PlaceholderScreen";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ZAVITA" },
      { name: "description", content: "Manage your ZAVITA account, PRO plan and creator preferences." },
      { property: "og:title", content: "Profile — ZAVITA" },
      { property: "og:description", content: "Manage your ZAVITA account and PRO plan." },
    ],
  }),
  component: () => (
    <PlaceholderScreen
      icon={User}
      title="Profile"
      description="Your account, PRO subscription, connected platforms and creator settings."
    />
  ),
});
