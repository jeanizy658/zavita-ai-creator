import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Instagram,
  Loader2,
  Music2,
  Plus,
  Send,
  X,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import { useStudio, type PlatformId } from "@/lib/studio-store";
import {
  MONTHS,
  formatLongDate,
  formatTime,
  parseISODate,
  toISODate,
} from "@/lib/schedule-format";

export const Route = createFileRoute("/publish")({
  head: () => ({
    meta: [
      { title: "Publish Everywhere — ZAVITA" },
      {
        name: "description",
        content:
          "Publish or schedule your ZAVITA video to YouTube, Facebook, Instagram and TikTok in one tap.",
      },
      { property: "og:title", content: "Publish Everywhere — ZAVITA" },
      {
        property: "og:description",
        content: "AI publishing assistant: captions, hashtags, platforms and scheduling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublishScreen,
});

const PLATFORMS: { id: PlatformId; name: string; icon: typeof Youtube; tint: string }[] = [
  { id: "youtube", name: "YouTube", icon: Youtube, tint: "oklch(0.62 0.23 22)" },
  { id: "facebook", name: "Facebook", icon: Facebook, tint: "oklch(0.62 0.21 265)" },
  { id: "instagram", name: "Instagram", icon: Instagram, tint: "oklch(0.68 0.2 340)" },
  { id: "tiktok", name: "TikTok", icon: Music2, tint: "oklch(0.78 0.15 200)" },
];

const CAPTION_MAX = 220;

function PublishScreen() {
  const navigate = useNavigate();
  const s = useStudio();
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");

  const active = parseISODate(s.scheduledDate);
  const [viewMonth, setViewMonth] = useState({ year: active.year, month: active.month });

  const selectedPlatforms = PLATFORMS.filter((p) => s.platforms[p.id]);

  const days = useMemo(() => {
    const first = new Date(Date.UTC(viewMonth.year, viewMonth.month, 1)).getUTCDay();
    const count = new Date(Date.UTC(viewMonth.year, viewMonth.month + 1, 0)).getUTCDate();
    return { lead: first, count };
  }, [viewMonth]);

  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === viewMonth.year &&
    today.getMonth() === viewMonth.month &&
    today.getDate() === d;

  const validate = () => {
    if (selectedPlatforms.length === 0) return "Select at least one platform.";
    if (!s.caption.trim()) return "Add a caption before publishing.";
    if (s.publishMode === "SCHEDULE") {
      const { year, month, day } = parseISODate(s.scheduledDate);
      if (!year || !MONTHS[month] || !day) return "Choose a valid date and time.";
      const t = s.scheduledTime;
      if (t.hour < 1 || t.hour > 12 || t.minute < 0 || t.minute > 59)
        return "Choose a valid date and time.";
    }
    return null;
  };

  const run = async (stages: string[], finalStatus: "published" | "scheduled") => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    s.setPublishStatus("processing");
    for (const st of stages) {
      setStage(st);
      await new Promise((r) => setTimeout(r, 620));
    }
    setStage(null);
    s.setPublishStatus(finalStatus);
  };

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 2600);
      return () => clearTimeout(t);
    }
    return;
  }, [error]);

  // ---------- Success screens ----------
  if (s.publishStatus === "published" || s.publishStatus === "scheduled") {
    const scheduled = s.publishStatus === "scheduled";
    return (
      <div className="min-h-[100dvh] bg-background px-4 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="animate-rise mt-10 text-center">
            <div className="animate-pop mx-auto flex size-20 items-center justify-center rounded-full border border-[oklch(0.72_0.18_150)] bg-[color-mix(in_oklab,oklch(0.72_0.18_150)_16%,transparent)]">
              <Check className="size-10 text-[oklch(0.78_0.19_150)]" strokeWidth={2.6} />
            </div>
            <h1 className="mt-4 text-lg font-bold">
              {scheduled ? "POST SCHEDULED SUCCESSFULLY" : "PUBLISHED SUCCESSFULLY"}
            </h1>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {scheduled
                ? "Your video has been scheduled."
                : "Your video is live on all selected platforms."}
            </p>
          </div>

          <div className="animate-rise mt-6 surface-card p-4">
            {scheduled ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Date
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-semibold">
                    {formatLongDate(s.scheduledDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Time
                  </p>
                  <p className="mt-0.5 text-[12.5px] font-semibold">{formatTime(s.scheduledTime)}</p>
                </div>
              </div>
            ) : null}
            <p className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Platforms
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {selectedPlatforms.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10.5px] font-semibold"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-2">
            {scheduled ? (
              <Link
                to="/schedule"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow active:scale-[0.98]"
              >
                <CalendarIcon className="size-4" strokeWidth={2} /> View schedule
              </Link>
            ) : null}
            <button
              onClick={() => s.setPublishStatus("idle")}
              className="rounded-xl border border-border-strong bg-surface py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] active:scale-[0.98]"
            >
              {scheduled ? "Edit schedule" : "Back to publishing"}
            </button>
            <button
              onClick={() => navigate({ to: "/editor" })}
              className="rounded-xl border border-border bg-surface py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground active:scale-[0.98]"
            >
              Back to project
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Main publishing screen ----------
  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(env(safe-area-inset-bottom)+104px)]">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/export"
          aria-label="Back to export"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
        >
          <ChevronLeft className="size-5" strokeWidth={1.7} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">Publish Everywhere</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Business Tips · 02:15
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
        {/* Platforms */}
        <section className="animate-rise mt-5">
          <SectionHeader title="Social Platforms" />
          <div className="grid gap-2">
            {PLATFORMS.map((p) => {
              const on = s.platforms[p.id];
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-strong"
                    style={{ backgroundColor: `color-mix(in oklab, ${p.tint} 20%, transparent)` }}
                  >
                    <p.icon className="size-4" strokeWidth={1.8} style={{ color: p.tint }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold">{p.name}</p>
                    <p className="truncate text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {on ? "Connected · will publish" : "Excluded"}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    aria-label={`Toggle ${p.name}`}
                    onClick={() => s.togglePlatform(p.id)}
                    className={cn(
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                      on ? "bg-gradient-brand" : "bg-surface-2",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-foreground transition-all duration-200",
                        on ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Caption */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Caption" />
          <div className="surface-card p-3">
            <textarea
              value={s.caption}
              maxLength={CAPTION_MAX}
              onChange={(e) => s.setCaption(e.target.value.slice(0, CAPTION_MAX))}
              rows={3}
              className="w-full resize-none rounded-lg bg-surface-2 p-3 text-[12.5px] outline-none ring-accent/60 focus:ring-1"
              placeholder="Write your caption..."
            />
            <p className="mt-1.5 text-right text-[10px] font-semibold tabular-nums text-muted-foreground">
              {s.caption.length}/{CAPTION_MAX}
            </p>
          </div>
        </section>

        {/* Hashtags */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Hashtags" />
          <div className="surface-card p-3">
            <div className="flex flex-wrap gap-1.5">
              {s.hashtags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 rounded-full border border-border bg-surface-2 py-1 pl-2.5 pr-1.5 text-[11px] font-semibold"
                >
                  {t}
                  <button
                    aria-label={`Remove ${t}`}
                    onClick={() => s.removeHashtag(t)}
                    className="flex size-4 items-center justify-center rounded-full bg-background text-muted-foreground active:scale-90"
                  >
                    <X className="size-2.5" strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTag.trim()) return;
                s.addHashtag(newTag);
                setNewTag("");
              }}
              className="mt-3 flex items-center gap-2"
            >
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value.slice(0, 30))}
                placeholder="Add hashtag"
                aria-label="Add hashtag"
                className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2 text-[12px] outline-none ring-accent/60 focus:ring-1"
              />
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-brand px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground active:scale-95"
              >
                <Plus className="size-3.5" strokeWidth={2.6} /> Add
              </button>
            </form>
          </div>
        </section>

        {/* Mode tabs */}
        <section className="animate-rise mt-6">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
            {(["NOW", "SCHEDULE"] as const).map((m) => (
              <button
                key={m}
                onClick={() => s.setPublishMode(m)}
                className={cn(
                  "rounded-lg py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all active:scale-[0.98]",
                  s.publishMode === m
                    ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                    : "text-muted-foreground",
                )}
              >
                {m === "NOW" ? "Publish now" : "Schedule"}
              </button>
            ))}
          </div>
        </section>

        {s.publishMode === "NOW" ? (
          <section className="animate-rise mt-4 surface-card p-4">
            <p className="text-[12px] text-muted-foreground">
              Your video will be published immediately to all selected platforms.
            </p>
          </section>
        ) : (
          <>
            {/* Date & time */}
            <section className="animate-rise mt-6">
              <SectionHeader title="Date & Time" />
              <div className="surface-card p-3">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Date
                    </p>
                    <p className="truncate text-[12px] font-bold">
                      {formatLongDate(s.scheduledDate)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Time
                    </p>
                    <p className="truncate text-[12px] font-bold">{formatTime(s.scheduledTime)}</p>
                  </div>
                </div>

                {/* Calendar */}
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <button
                      aria-label="Previous month"
                      onClick={() =>
                        setViewMonth((v) =>
                          v.month === 0
                            ? { year: v.year - 1, month: 11 }
                            : { year: v.year, month: v.month - 1 },
                        )
                      }
                      className="flex size-8 items-center justify-center rounded-full border border-border active:scale-95"
                    >
                      <ChevronLeft className="size-4" strokeWidth={2} />
                    </button>
                    <p className="text-[12px] font-bold">
                      {MONTHS[viewMonth.month]} {viewMonth.year}
                    </p>
                    <button
                      aria-label="Next month"
                      onClick={() =>
                        setViewMonth((v) =>
                          v.month === 11
                            ? { year: v.year + 1, month: 0 }
                            : { year: v.year, month: v.month + 1 },
                        )
                      }
                      className="flex size-8 items-center justify-center rounded-full border border-border active:scale-95"
                    >
                      <ChevronRight className="size-4" strokeWidth={2} />
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground"
                      >
                        {d}
                      </span>
                    ))}
                    {Array.from({ length: days.lead }, (_, i) => (
                      <span key={`lead-${i}`} />
                    ))}
                    {Array.from({ length: days.count }, (_, i) => {
                      const day = i + 1;
                      const iso = toISODate(viewMonth.year, viewMonth.month, day);
                      const sel = iso === s.scheduledDate;
                      return (
                        <button
                          key={day}
                          onClick={() => s.setScheduledDate(iso)}
                          className={cn(
                            "relative aspect-square rounded-lg text-[11.5px] font-semibold tabular-nums transition-all active:scale-90",
                            sel
                              ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                              : "text-foreground hover:bg-surface-2",
                          )}
                        >
                          {day}
                          {isToday(day) && !sel ? (
                            <span className="absolute inset-x-0 bottom-1 mx-auto block size-1 rounded-full bg-accent" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time picker */}
                <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <Clock className="size-3.5 text-accent" strokeWidth={1.8} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Time
                    </p>
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <div className="no-scrollbar h-28 overflow-y-auto rounded-lg bg-surface-2 p-1">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <button
                          key={h}
                          onClick={() => s.setScheduledTime({ ...s.scheduledTime, hour: h })}
                          className={cn(
                            "block w-full rounded-md py-1.5 text-center text-[12px] font-semibold tabular-nums",
                            s.scheduledTime.hour === h
                              ? "bg-gradient-brand text-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    <div className="no-scrollbar h-28 overflow-y-auto rounded-lg bg-surface-2 p-1">
                      {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                        <button
                          key={m}
                          onClick={() => s.setScheduledTime({ ...s.scheduledTime, minute: m })}
                          className={cn(
                            "block w-full rounded-md py-1.5 text-center text-[12px] font-semibold tabular-nums",
                            s.scheduledTime.minute === m
                              ? "bg-gradient-brand text-primary-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {String(m).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2">
                      {(["AM", "PM"] as const).map((mer) => (
                        <button
                          key={mer}
                          onClick={() => s.setScheduledTime({ ...s.scheduledTime, meridiem: mer })}
                          className={cn(
                            "rounded-lg px-3 py-2 text-[11px] font-bold tracking-[0.1em] transition-all active:scale-95",
                            s.scheduledTime.meridiem === mer
                              ? "bg-gradient-brand text-primary-foreground shadow-glow-sm"
                              : "border border-border bg-surface-2 text-muted-foreground",
                          )}
                        >
                          {mer}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Summary */}
            <section className="animate-rise mt-6">
              <SectionHeader title="Schedule Summary" />
              <div className="surface-card grid gap-3 p-4">
                <SummaryRow label="Platforms">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlatforms.length ? (
                      selectedPlatforms.map((p) => (
                        <span
                          key={p.id}
                          className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10.5px] font-semibold"
                        >
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-destructive">None selected</span>
                    )}
                  </div>
                </SummaryRow>
                <div className="grid grid-cols-2 gap-3">
                  <SummaryRow label="Date">
                    <p className="text-[12px] font-semibold">{formatLongDate(s.scheduledDate)}</p>
                  </SummaryRow>
                  <SummaryRow label="Time">
                    <p className="text-[12px] font-semibold">{formatTime(s.scheduledTime)}</p>
                  </SummaryRow>
                </div>
                <SummaryRow label="Caption">
                  <p className="text-[12px] leading-snug">{s.caption || "—"}</p>
                </SummaryRow>
                <SummaryRow label="Hashtags">
                  <p className="text-[12px] text-accent">{s.hashtags.join(" ") || "—"}</p>
                </SummaryRow>
              </div>
            </section>
          </>
        )}
      </div>

      {error ? (
        <div className="animate-rise pointer-events-none fixed inset-x-0 bottom-[104px] z-50 flex justify-center px-4">
          <span className="flex items-center gap-2 rounded-full border border-destructive bg-surface px-4 py-2 text-[11px] font-semibold">
            <AlertCircle className="size-3.5 text-destructive" strokeWidth={2.2} />
            {error}
          </span>
        </div>
      ) : null}

      {stage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-8 backdrop-blur-sm">
          <div className="animate-rise w-full max-w-[320px] rounded-2xl border border-border bg-surface p-5 text-center">
            <Loader2 className="animate-spin-slow mx-auto size-6 text-accent" strokeWidth={2} />
            <p className="mt-3 text-[12.5px] font-semibold">{stage}</p>
          </div>
        </div>
      ) : null}

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] border-t border-border bg-background/92 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur-xl">
        <button
          disabled={s.publishStatus === "processing"}
          onClick={() =>
            s.publishMode === "NOW"
              ? run(
                  ["Preparing posts...", "Connecting platforms...", "Publishing...", "Completed"],
                  "published",
                )
              : run(
                  [
                    "Preparing scheduled post...",
                    "Validating selected platforms...",
                    "Scheduling content...",
                    "Schedule confirmed.",
                  ],
                  "scheduled",
                )
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow active:scale-[0.98] disabled:opacity-60"
        >
          <Send className="size-4" strokeWidth={2.1} />
          {s.publishMode === "NOW" ? "Publish now" : "Schedule post"}
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}
