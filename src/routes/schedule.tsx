import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ChevronLeft } from "lucide-react";
import { useStudio } from "@/lib/studio-store";
import { formatLongDate, formatTime } from "@/lib/schedule-format";
import editorFrame from "@/assets/editor-frame.jpg";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Scheduled Posts — ZAVITA" },
      {
        name: "description",
        content: "Review your scheduled ZAVITA video posts, platforms, caption, date and time.",
      },
      { property: "og:title", content: "Scheduled Posts — ZAVITA" },
      { property: "og:description", content: "Your upcoming ZAVITA publications at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScheduleScreen,
});

const NAMES: Record<string, string> = {
  youtube: "YouTube",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function ScheduleScreen() {
  const s = useStudio();
  const platforms = Object.entries(s.platforms)
    .filter(([, on]) => on)
    .map(([id]) => NAMES[id]!);
  const scheduled = s.publishStatus === "scheduled";

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/publish"
          aria-label="Back to publishing"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
        >
          <ChevronLeft className="size-5" strokeWidth={1.7} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">Schedule</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Upcoming posts
          </p>
        </div>
        <Link
          to="/editor"
          className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground active:scale-95"
        >
          Project
        </Link>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-4">
        {scheduled ? (
          <article className="animate-rise mt-5 surface-card overflow-hidden">
            <div className="flex gap-3 p-3">
              <img
                src={editorFrame}
                alt="Business Tips thumbnail"
                className="size-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[13px] font-bold">Business Tips</p>
                  <span className="shrink-0 rounded-full bg-[color-mix(in_oklab,oklch(0.72_0.18_150)_20%,transparent)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[oklch(0.8_0.18_150)]">
                    Scheduled
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{s.caption}</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-accent">
                  {s.hashtags.join(" ")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border px-3 py-3">
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Date
                </p>
                <p className="text-[12px] font-semibold">{formatLongDate(s.scheduledDate)}</p>
              </div>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Time
                </p>
                <p className="text-[12px] font-semibold">{formatTime(s.scheduledTime)}</p>
              </div>
            </div>
            <div className="border-t border-border px-3 py-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Platforms
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10.5px] font-semibold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ) : (
          <div className="animate-rise mt-10 text-center">
            <CalendarClock className="mx-auto size-10 text-muted-foreground" strokeWidth={1.4} />
            <p className="mt-3 text-[13px] font-bold">No scheduled posts yet</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Schedule a post from Publish Everywhere.
            </p>
            <Link
              to="/publish"
              className="mt-5 inline-flex rounded-xl bg-gradient-brand px-5 py-3 text-[11.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow active:scale-95"
            >
              Go to publishing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
