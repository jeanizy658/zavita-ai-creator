import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Mic, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { StudioSlider } from "@/components/zavita/StudioSlider";
import { useStudio } from "@/lib/studio-store";
import editorFrame from "@/assets/editor-frame.jpg";

export const Route = createFileRoute("/ai-voice")({
  head: () => ({
    meta: [
      { title: "AI Voice — ZAVITA" },
      {
        name: "description",
        content: "Clean, boost and transform your voice with ZAVITA AI Voice processing.",
      },
      { property: "og:title", content: "AI Voice — ZAVITA" },
      { property: "og:description", content: "Studio-grade AI voice for your videos." },
    ],
  }),
  component: AiVoiceScreen,
});

const PROFILES = ["Natural Voice", "Professional Voice", "Deep Voice", "Studio Voice"];

function bars(seed: number, count = 84) {
  return Array.from({ length: count }, (_, i) =>
    Math.abs(
      Math.sin(i * (0.6 + seed * 0.12)) * 0.5 +
        Math.sin(i * (0.21 + seed * 0.05)) * 0.35 +
        Math.sin(i * 1.9) * 0.2,
    ),
  );
}

const RAW = bars(1);
const CLEAN = bars(2).map((v, i) => (v * 0.72 + 0.22) * (0.9 + Math.sin(i * 0.11) * 0.1));

function Wave({
  data,
  color,
  active,
  rough,
}: {
  data: number[];
  color: string;
  active: boolean;
  rough?: boolean;
}) {
  return (
    <div className="flex h-12 w-full items-center gap-[2px]">
      {data.map((b, i) => (
        <span
          key={i}
          className="flex-1 rounded-full transition-all duration-500"
          style={{
            height: `${((rough ? 14 + b * 82 : 22 + b * 66) * (active ? 1 : 0.72)).toFixed(2)}%`,
            background: color,
            opacity: Number((active ? 0.5 + b * 0.5 : 0.35 + b * 0.3).toFixed(2)),
          }}
        />
      ))}
    </div>
  );
}

function AiVoiceScreen() {
  const { voice, setVoice, voiceProfile, setVoiceProfile } = useStudio();
  const [status, setStatus] = useState<"idle" | "processing" | "completed">("idle");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preview = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (preview.current) clearTimeout(preview.current);
    },
    [],
  );

  const enhance = () => {
    if (status === "processing") return;
    setStatus("processing");
    timer.current = setTimeout(() => setStatus("completed"), 1900);
  };

  const playPreview = (p: string) => {
    setPreviewing(p);
    if (preview.current) clearTimeout(preview.current);
    preview.current = setTimeout(() => setPreviewing(null), 1600);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      <ModuleHeader title="AI Voice" subtitle="Studio audio" />
      <div className="mx-auto w-full max-w-[560px] px-4">
        <section className="animate-rise mt-4 overflow-hidden rounded-2xl border border-border">
          <img
            src={editorFrame}
            alt="Video preview"
            width={1280}
            height={720}
            className="aspect-video w-full object-cover"
          />
        </section>

        <section className="animate-rise mt-5 surface-card p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Audio timeline
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Original
              </span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                Noisy
              </span>
            </div>
            <div className="mt-1.5 overflow-hidden rounded-lg border border-border bg-surface px-1.5 py-1">
              <Wave data={RAW} color="oklch(0.7 0.02 275)" active={false} rough />
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet">
                AI Enhanced
              </span>
              <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                {status === "completed" ? "Clean" : "Preview"}
              </span>
            </div>
            <div
              className={cn(
                "mt-1.5 overflow-hidden rounded-lg border bg-surface px-1.5 py-1 transition-shadow",
                status === "completed" ? "border-accent shadow-glow-sm" : "border-border",
              )}
            >
              <Wave
                data={CLEAN}
                color="var(--brand-violet)"
                active={status !== "idle"}
              />
            </div>
          </div>

          <button
            onClick={enhance}
            disabled={status === "processing"}
            className={cn(
              "mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[12px] font-extrabold uppercase tracking-[0.16em] transition-all active:scale-[0.98]",
              status === "completed"
                ? "border border-accent bg-surface text-accent"
                : "bg-gradient-brand text-primary-foreground shadow-glow-sm",
            )}
          >
            {status === "processing" ? (
              <>
                <span className="size-4 animate-spin-slow rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Enhancing voice…
              </>
            ) : status === "completed" ? (
              <>
                <Check className="size-4" strokeWidth={2.6} /> Voice enhanced
              </>
            ) : (
              <>
                <Mic className="size-4" strokeWidth={2} /> Enhance voice
              </>
            )}
          </button>
        </section>

        <section className="animate-rise mt-6 surface-card grid grid-cols-2 gap-x-4 gap-y-4 p-4">
          <StudioSlider
            label="Noise Reduction"
            value={voice.noise}
            onChange={(v) => setVoice("noise", v)}
          />
          <StudioSlider
            label="Echo Removal"
            value={voice.echo}
            onChange={(v) => setVoice("echo", v)}
          />
          <StudioSlider
            label="Voice Clarity"
            value={voice.clarity}
            onChange={(v) => setVoice("clarity", v)}
          />
          <StudioSlider
            label="Volume"
            value={voice.volume}
            onChange={(v) => setVoice("volume", v)}
          />
        </section>

        <section className="animate-rise mt-6">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Voice change
          </p>
          <div className="space-y-2">
            {PROFILES.map((p) => (
              <div
                key={p}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                  voiceProfile === p ? "border-accent bg-surface-2 shadow-glow-sm" : "border-border bg-surface",
                )}
              >
                <button
                  aria-label={`Preview ${p}`}
                  onClick={() => playPreview(p)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-brand shadow-glow-sm active:scale-95"
                >
                  {previewing === p ? (
                    <Pause className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                  ) : (
                    <Play className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold">{p}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {previewing === p ? "Playing preview…" : voiceProfile === p ? "Selected" : "Tap to apply"}
                  </p>
                </div>
                <button
                  onClick={() => setVoiceProfile(p)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all active:scale-95",
                    voiceProfile === p
                      ? "bg-gradient-brand text-primary-foreground"
                      : "border border-border-strong bg-surface text-muted-foreground",
                  )}
                >
                  {voiceProfile === p ? "Applied" : "Select"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
