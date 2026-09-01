import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { useStudio, type BackgroundMode, type BlurStrength } from "@/lib/studio-store";
import editorFrame from "@/assets/editor-frame.jpg";
import bgOffice from "@/assets/bg-office.jpg";
import bgStudio from "@/assets/bg-studio.jpg";
import bgPodcast from "@/assets/bg-podcast.jpg";
import broll1 from "@/assets/broll-1.jpg";
import broll2 from "@/assets/broll-2.jpg";
import broll3 from "@/assets/broll-3.jpg";

export const Route = createFileRoute("/ai-background")({
  head: () => ({
    meta: [
      { title: "AI Background — ZAVITA" },
      {
        name: "description",
        content: "Blur or replace your video background with cinematic AI environments in ZAVITA.",
      },
      { property: "og:title", content: "AI Background — ZAVITA" },
      { property: "og:description", content: "Blur or generate a new background with AI." },
    ],
  }),
  component: AiBackgroundScreen,
});

const MODES: BackgroundMode[] = ["ORIGINAL", "BLUR", "REPLACE"];
const BLURS: { id: BlurStrength; px: number }[] = [
  { id: "LIGHT", px: 3 },
  { id: "MEDIUM", px: 7 },
  { id: "STRONG", px: 13 },
  { id: "CINEMATIC", px: 20 },
];

const PRESETS = [
  { id: "office", name: "Modern Office", image: bgOffice },
  { id: "studio", name: "Studio", image: bgStudio },
  { id: "podcast", name: "Podcast", image: bgPodcast },
  { id: "luxury", name: "Luxury", image: broll1 },
  { id: "creative", name: "Creative Workspace", image: broll2 },
  { id: "minimal", name: "Minimal Office", image: broll3 },
];

function AiBackgroundScreen() {
  const {
    backgroundMode,
    setBackgroundMode,
    blurStrength,
    setBlurStrength,
    selectedBackground,
    setSelectedBackground,
    backgroundPrompt,
    setBackgroundPrompt,
  } = useStudio();
  const [status, setStatus] = useState<"idle" | "processing" | "completed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const blurPx = BLURS.find((b) => b.id === blurStrength)?.px ?? 7;
  const preset = PRESETS.find((p) => p.id === selectedBackground);
  const showReplacement = backgroundMode === "REPLACE" && !!preset;

  const generate = () => {
    if (status === "processing") return;
    setStatus("processing");
    timer.current = setTimeout(() => {
      setBackgroundMode("REPLACE");
      setSelectedBackground(selectedBackground ?? "office");
      setStatus("completed");
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      <ModuleHeader title="AI Background" subtitle="Blur or replace" />
      <div className="mx-auto w-full max-w-[560px] px-4">
        <section className="animate-rise relative mt-4 overflow-hidden rounded-2xl border border-border">
          {/* Background layer */}
          <div className="absolute inset-0">
            <img
              src={showReplacement ? preset!.image : editorFrame}
              alt="Background"
              loading="lazy"
              className="size-full object-cover transition-all duration-300"
              style={{
                filter: backgroundMode === "BLUR" ? `blur(${blurPx}px) brightness(0.85)` : "none",
                transform: backgroundMode === "BLUR" ? "scale(1.08)" : "none",
              }}
            />
          </div>
          {/* Subject layer stays sharp */}
          <img
            src={editorFrame}
            alt="Video preview subject"
            width={1280}
            height={720}
            className="relative aspect-video w-full object-cover"
            style={{
              WebkitMaskImage:
                backgroundMode === "ORIGINAL"
                  ? "none"
                  : "radial-gradient(52% 78% at 50% 58%, #000 62%, transparent 100%)",
              maskImage:
                backgroundMode === "ORIGINAL"
                  ? "none"
                  : "radial-gradient(52% 78% at 50% 58%, #000 62%, transparent 100%)",
            }}
          />
          <span className="absolute left-2.5 top-2.5 rounded-md bg-background/75 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
            {backgroundMode === "REPLACE" && preset ? preset.name : backgroundMode}
          </span>
          {status === "processing" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/65 backdrop-blur-[2px]">
              <Sparkles className="size-6 animate-spin-slow text-accent" strokeWidth={1.6} />
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em]">
                Generating background…
              </p>
              <span className="h-1 w-32 overflow-hidden rounded-full bg-surface-2">
                <span className="block h-full w-1/2 animate-[rise_1s_ease-in-out_infinite_alternate] rounded-full bg-gradient-brand" />
              </span>
            </div>
          ) : null}
        </section>

        <div className="animate-rise mt-4 grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setBackgroundMode(m)}
              className={cn(
                "rounded-xl border py-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] transition-all active:scale-95",
                backgroundMode === m
                  ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </div>

        {backgroundMode === "BLUR" ? (
          <div className="animate-rise no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            {BLURS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBlurStrength(b.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all active:scale-95",
                  blurStrength === b.id
                    ? "border-accent bg-surface-2 text-accent"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                {b.id}
              </button>
            ))}
          </div>
        ) : null}

        <section className="animate-rise mt-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Background presets
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedBackground(p.id);
                  setBackgroundMode("REPLACE");
                }}
                className={cn(
                  "overflow-hidden rounded-xl border text-left transition-all active:scale-[0.98]",
                  selectedBackground === p.id ? "border-accent shadow-glow-sm" : "border-border",
                )}
              >
                <div className="relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    width={896}
                    height={512}
                    className="aspect-video w-full object-cover"
                  />
                  {selectedBackground === p.id ? (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-md bg-accent text-background">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  ) : null}
                </div>
                <p className="truncate px-2 py-1.5 text-[11px] font-semibold">{p.name}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="animate-rise mt-6 surface-card p-4">
          <label
            htmlFor="bg-prompt"
            className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground"
          >
            Describe your background
          </label>
          <input
            id="bg-prompt"
            value={backgroundPrompt}
            onChange={(e) => setBackgroundPrompt(e.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-accent"
            placeholder="Modern luxury office"
          />
          <button
            onClick={generate}
            disabled={status === "processing"}
            className={cn(
              "mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[12px] font-extrabold uppercase tracking-[0.14em] transition-all active:scale-[0.98]",
              status === "completed"
                ? "border border-accent bg-surface text-accent"
                : "bg-gradient-brand text-primary-foreground shadow-glow-sm",
            )}
          >
            {status === "processing" ? (
              <>
                <span className="size-4 animate-spin-slow rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Generating…
              </>
            ) : status === "completed" ? (
              <>
                <Check className="size-4" strokeWidth={2.6} /> Background applied
              </>
            ) : (
              <>✨ Generate background</>
            )}
          </button>
        </section>
      </div>
    </div>
  );
}
