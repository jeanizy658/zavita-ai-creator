import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Camera,
  Clapperboard,
  Facebook,
  Image as ImageIcon,
  Instagram,
  Layers,
  Youtube,
  Mic,
  Music2,
  Sparkles,
  Subtitles,
  Wand2,
} from "lucide-react";
import { AppShell } from "@/components/zavita/AppShell";
import { FeatureCard } from "@/components/zavita/FeatureCard";
import { Header } from "@/components/zavita/Header";
import { PlatformButton } from "@/components/zavita/PlatformButton";
import { ProjectCard } from "@/components/zavita/ProjectCard";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import { useStudio } from "@/lib/studio-store";
import businessThumb from "@/assets/proj-business.jpg";
import travelThumb from "@/assets/proj-travel.jpg";
import productThumb from "@/assets/proj-product.jpg";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "ZAVITA Studio — Create once. Let AI do the rest." },
      {
        name: "description",
        content:
          "Record, enhance, edit, generate visuals and publish everywhere from one premium AI content studio.",
      },
      { property: "og:title", content: "ZAVITA Studio — Create once. Let AI do the rest." },
      {
        property: "og:description",
        content: "The premium mobile AI content creation studio for creators.",
      },
    ],
  }),
  component: HomeScreen,
});

const projects = [
  { title: "Business Tips", duration: "02:15", date: "Today", thumbnail: businessThumb },
  { title: "Travel Vlog", duration: "01:28", date: "Yesterday", thumbnail: travelThumb },
  { title: "Product Review", duration: "00:58", date: "2 days ago", thumbnail: productThumb },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { platforms, togglePlatform } = useStudio();

  const features = [
    {
      icon: Clapperboard,
      title: "AI Video",
      description: "Enhance & edit",
      onClick: () => navigate({ to: "/editor" }),
    },
    {
      icon: ImageIcon,
      title: "AI Photo",
      description: "Enhance photos",
      onClick: () => navigate({ to: "/ai-enhance" }),
    },
    {
      icon: Mic,
      title: "AI Voice",
      description: "Enhance voice",
      onClick: () => navigate({ to: "/ai-voice" }),
    },
    {
      icon: Layers,
      title: "AI Background",
      description: "Change or blur background",
      onClick: () => navigate({ to: "/ai-background" }),
    },
    {
      icon: Wand2,
      title: "AI Montage",
      description: "Professional editing",
      onClick: () => navigate({ to: "/editor" }),
    },
    {
      icon: Subtitles,
      title: "AI Captions",
      description: "Automatic subtitles",
      onClick: () => navigate({ to: "/editor" }),
    },
    {
      icon: Sparkles,
      title: "AI Avatar",
      description: "Create a talking avatar",
      onClick: () => navigate({ to: "/avatar" }),
    },
  ];

  return (
    <AppShell>
      <Header />

      <section className="animate-rise">
        <h1 className="text-[26px] font-bold leading-tight">
          What do you want to <span className="text-gradient">create?</span>
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">Create once. Let AI do the rest.</p>

        <button
          onClick={() => navigate({ to: "/camera" })}
          className="relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-gradient-brand p-[1.5px] shadow-glow transition-transform duration-200 active:scale-[0.98]"
        >
          <span className="flex w-full items-center gap-4 rounded-[calc(var(--radius)+10px)] bg-[color-mix(in_oklab,var(--background)_78%,transparent)] px-5 py-5 backdrop-blur-sm">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-brand shadow-glow-sm">
              <Camera className="size-6 text-primary-foreground" strokeWidth={1.6} />
            </span>
            <span className="flex-1 text-left">
              <span className="block text-[15px] font-extrabold uppercase tracking-[0.14em] text-foreground">
                AI Camera
              </span>
              <span className="block text-[12.5px] text-muted-foreground">Record a video</span>
            </span>
            <span className="rounded-full bg-gradient-brand px-3 py-1.5 text-[11px] font-bold text-primary-foreground">
              Start
            </span>
          </span>
        </button>
      </section>

      <section className="animate-rise mt-8" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="AI Features" />
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      <section className="animate-rise mt-8" style={{ animationDelay: "120ms" }}>
        <SectionHeader
          title="My Projects"
          actionLabel="See all"
          onAction={() => navigate({ to: "/projects" })}
        />
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {projects.map((p) => (
            <ProjectCard key={p.title} {...p} onClick={() => navigate({ to: "/editor" })} />
          ))}
        </div>
      </section>

      <section className="animate-rise mt-8" style={{ animationDelay: "180ms" }}>
        <SectionHeader
          title="Publish Everywhere"
          actionLabel="Open"
          onAction={() => navigate({ to: "/publish" })}
        />
        <div className="grid grid-cols-4 gap-3">
          <PlatformButton
            icon={Youtube}
            label="YouTube"
            tint="oklch(0.62 0.24 25)"
            active={platforms.youtube}
            onClick={() => togglePlatform("youtube")}
          />
          <PlatformButton
            icon={Facebook}
            label="Facebook"
            tint="oklch(0.6 0.19 260)"
            active={platforms.facebook}
            onClick={() => togglePlatform("facebook")}
          />
          <PlatformButton
            icon={Instagram}
            label="Instagram"
            tint="oklch(0.66 0.22 350)"
            active={platforms.instagram}
            onClick={() => togglePlatform("instagram")}
          />
          <PlatformButton
            icon={Music2}
            label="TikTok"
            tint="oklch(0.78 0.15 200)"
            active={platforms.tiktok}
            onClick={() => togglePlatform("tiktok")}
          />
        </div>
        <button
          onClick={() => navigate({ to: "/publish" })}
          className="mt-3 w-full rounded-xl bg-gradient-brand py-3 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm active:scale-[0.98]"
        >
          Publish everywhere
        </div>
      </section>
    </AppShell>
  );
}
