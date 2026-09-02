import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Play, RefreshCw, Save, Sparkles, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/zavita/AppShell";
import { Header } from "@/components/zavita/Header";
import { useStudio, type AvatarStyle } from "@/lib/studio-store";
import presenter from "@/assets/avatar-presenter.jpg";

export const Route = createFileRoute("/avatar")({
  head: () => ({
    meta: [
      { title: "AI Avatar Studio — ZAVITA" },
      {
        name: "description",
        content:
          "Create a photorealistic talking AI avatar: pick a style, write your script, choose a voice and generate.",
      },
      { property: "og:title", content: "AI Avatar Studio — ZAVITA" },
      { property: "og:description", content: "Create a talking AI avatar with ZAVITA." },
    ],
  }),
  component: AvatarStudio,
});

const STYLES: AvatarStyle[] = ["REALISTIC", "BUSINESS", "CREATOR", "PRESENTER"];
const STYLE_FILTER: Record<AvatarStyle, string> = {
  REALISTIC: "none",
  BUSINESS: "contrast(1.1) saturate(0.9) brightness(1.03)",
  CREATOR: "saturate(1.35) contrast(1.05) hue-rotate(-6deg)",
  PRESENTER: "brightness(1.08) contrast(1.12) saturate(1.1)",
};

const VOICES = ["Natural Voice", "Professional Voice", "Deep Voice", "Studio Voice", "Warm Voice"];

const STAGES = [
  "Preparing avatar...",
  "Generating voice...",
  "Synchronizing lips...",
  "Rendering video...",
  "Completed",
];

const MAX = 500;

function AvatarStudio() {
  const navigate = useNavigate();
  const {
    avatarStyle,
    setAvatarStyle,
    avatarScript,
    setAvatarScript,
    avatarVoice,
    setAvatarVoice,
    avatarStatus,
    setAvatarStatus,
    addToTimeline,
  } = useStudio();
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const generate = () => {
    if (avatarStatus === "generating") return;
    setSaved(false);
    setStage(0);
    setAvatarStatus("generating");
    timers.current.forEach(clearTimeout);
    timers.current = STAGES.map((_, i) =>
      setTimeout(
        () => {
          setStage(i);
          if (i === STAGES.length - 1) setAvatarStatus("completed");
        },
        (i + 1) * 700,
      ),
    );
  };

  const previewVoice = () => {
    setPlaying(true);
    timers.current.push(setTimeout(() => setPlaying(false), 1600));
  };

  const addToProject = () => {
    addToTimeline([
      {
        trackId: "ai",
        label: `AI Avatar — ${avatarStyle}`,
        image: presenter,
        duration: 12,
      },
    ]);
    navigate({ to: "/editor" });
  };

  const speaking = avatarStatus !== "idle";

  return (
    <AppShell>
      <Header />

      <section className="animate-rise">
        <h1 className="text-[24px] font-bold leading-tight">
          AI <span className="text-gradient">Avatar Studio</span>
        </h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          Let a virtual presenter deliver your script.
        </p>

        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
          {STYLES.map((s) => (
            <button
              key={s}
              onClick={() => setAvatarStyle(s)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-all active:scale-95",
                avatarStyle === s
                  ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-4">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={presenter}
            alt="AI virtual presenter preview"
            width={896}
            height={1152}
            className="aspect-[4/5] w-full object-cover transition-all duration-300"
            style={{ filter: STYLE_FILTER[avatarStyle] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 rounded-md bg-background/70 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            {avatarStyle}
          </span>
          <div className="absolute inset-x-3 bottom-3">
            <p
              className={cn(
                "text-center font-mono text-[11px] font-bold tracking-[0.18em] text-accent",
                speaking && "animate-pulse",
              )}
            >
              ░░▒▒▓ {avatarStatus === "generating" ? STAGES[stage] : "SPEAKING..."} ▓▒▒░░
            </p>
            {avatarStatus === "generating" ? (
              <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-surface-2">
                <span
                  className="block h-full rounded-full bg-gradient-brand transition-all duration-500"
                  style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
                />
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="animate-rise mt-5 surface-card p-4">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="avatar-script"
            className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Script
          </label>
          <span className="text-[10.5px] font-bold tabular-nums text-accent">
            {avatarScript.length}/{MAX}
          </span>
        </div>
        <textarea
          id="avatar-script"
          rows={3}
          maxLength={MAX}
          value={avatarScript}
          onChange={(e) => setAvatarScript(e.target.value.slice(0, MAX))}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-3 py-3 text-[13px] leading-relaxed outline-none focus:border-accent"
        />

        <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Voice
        </p>
        <div className="mt-2 flex items-center gap-2">
          <select
            aria-label="Avatar voice"
            value={avatarVoice}
            onChange={(e) => setAvatarVoice(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-[12.5px] font-semibold text-foreground outline-none focus:border-accent"
          >
            {VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button
            onClick={previewVoice}
            aria-label="Preview voice"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-brand px-3.5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-glow-sm active:scale-95"
          >
            {playing ? (
              <>
                <Square className="size-3.5 fill-current" strokeWidth={0} /> Stop
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" strokeWidth={0} /> Play
              </>
            )}
          </button>
        </div>
        {playing ? (
          <div className="mt-2 flex h-5 items-end gap-[3px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <span
                key={i}
                className="flex-1 animate-pulse rounded-full bg-violet"
                style={{
                  height: `${25 + Math.abs(Math.sin(i * 0.8)) * 70}%`,
                  animationDelay: `${i * 40}ms`,
                }}
              />
            ))}
          </div>
        ) : null}
      </section>

      <button
        onClick={generate}
        disabled={avatarStatus === "generating"}
        className={cn(
          "animate-rise mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-all active:scale-[0.98]",
          avatarStatus === "completed"
            ? "border border-accent bg-surface text-accent"
            : "bg-gradient-brand text-primary-foreground shadow-glow",
        )}
      >
        {avatarStatus === "generating" ? (
          <>
            <span className="size-4 animate-spin-slow rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            {STAGES[stage]}
          </>
        ) : avatarStatus === "completed" ? (
          <>
            <Check className="size-4" strokeWidth={2.6} /> Avatar generated
          </>
        ) : (
          <>✨ Make avatar speak</>
        )}
      </button>

      {avatarStatus === "completed" ? (
        <section className="animate-rise mt-5 surface-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" strokeWidth={1.8} />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
              Generated Avatar Video
            </p>
          </div>
          <div className="mt-3 flex gap-3">
            <img
              src={presenter}
              alt="Generated avatar result"
              loading="lazy"
              className="size-[76px] shrink-0 rounded-xl border border-border object-cover"
              style={{ filter: STYLE_FILTER[avatarStyle] }}
            />
            <dl className="min-w-0 flex-1 space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-semibold tabular-nums">00:12</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Voice</dt>
                <dd className="truncate font-semibold">{avatarVoice}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Style</dt>
                <dd className="font-semibold">{avatarStyle}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-4 grid gap-2">
            <button
              onClick={addToProject}
              className="rounded-xl bg-gradient-brand py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary-foreground shadow-glow-sm active:scale-[0.98]"
            >
              Add to project
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setAvatarStatus("idle");
                  setStage(0);
                  setSaved(false);
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground active:scale-95"
              >
                <RefreshCw className="size-3.5" strokeWidth={2} /> Regenerate
              </button>
              <button
                onClick={() => setSaved(true)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] active:scale-95",
                  saved
                    ? "border-accent bg-surface text-accent"
                    : "border-border-strong bg-surface text-muted-foreground",
                )}
              >
                {saved ? <Check className="size-3.5" strokeWidth={2.6} /> : <Save className="size-3.5" strokeWidth={2} />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
