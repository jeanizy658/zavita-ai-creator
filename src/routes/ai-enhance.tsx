import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { StudioSlider } from "@/components/zavita/StudioSlider";
import { useStudio, type EnhanceMode } from "@/lib/studio-store";
import editorFrame from "@/assets/editor-frame.jpg";

export const Route = createFileRoute("/ai-enhance")({
  head: () => ({
    meta: [
      { title: "AI Enhance — ZAVITA" },
      {
        name: "description",
        content: "Upscale, denoise and cinematically grade your clip with ZAVITA AI Enhance.",
      },
      { property: "og:title", content: "AI Enhance — ZAVITA" },
      { property: "og:description", content: "Cinematic AI enhancement for your footage." },
    ],
  }),
  component: AiEnhanceScreen,
});

const MODES: { id: EnhanceMode; hint: string; factor: number }[] = [
  { id: "Natural", hint: "Subtle", factor: 0.5 },
  { id: "Balanced", hint: "Moderate", factor: 1 },
  { id: "Pro", hint: "Strong", factor: 1.6 },
];

function AiEnhanceScreen() {
  const { enhanceMode, setEnhanceMode, enhanceIntensity, setEnhanceIntensity } = useStudio();
  const [divider, setDivider] = useState(50);
  const [status, setStatus] = useState<"idle" | "processing" | "completed">("idle");
  const frameRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const factor = MODES.find((m) => m.id === enhanceMode)?.factor ?? 1;
  const strength = (enhanceIntensity / 100) * factor;
  const afterFilter = `brightness(${1 + strength * 0.35}) contrast(${1 + strength * 0.45}) saturate(${1 + strength * 0.5})`;

  const drag = (clientX: number) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDivider(Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100)));
  };

  const enhance = () => {
    if (status === "processing") return;
    setStatus("processing");
    timer.current = setTimeout(() => setStatus("completed"), 1800);
  };

  const reset = () => {
    setEnhanceMode("Balanced");
    setEnhanceIntensity(50);
    setDivider(50);
    setStatus("idle");
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-10">
      <ModuleHeader title="AI Enhance" subtitle="Cinematic upgrade" />
      <div className="mx-auto w-full max-w-[560px] px-4">
        <section className="animate-rise mt-4">
          <div
            ref={frameRef}
            className="relative select-none overflow-hidden rounded-2xl border border-border"
            onPointerDown={(e) => drag(e.clientX)}
            onPointerMove={(e) => e.buttons === 1 && drag(e.clientX)}
          >
            <img
              src={editorFrame}
              alt="Original preview"
              width={1280}
              height={720}
              className="aspect-video w-full object-cover"
              style={{ filter: "brightness(0.78) contrast(0.85) saturate(0.75)" }}
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${divider}%)` }}
            >
              <img
                src={editorFrame}
                alt="Enhanced preview"
                loading="lazy"
                className="aspect-video w-full object-cover"
                style={{ filter: status === "idle" ? "brightness(0.92) contrast(1)" : afterFilter }}
              />
            </div>
            <span className="absolute left-2.5 top-2.5 rounded-md bg-background/75 px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
              Before
            </span>
            <span className="absolute right-2.5 top-2.5 rounded-md bg-gradient-brand px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
              After
            </span>
            <div
              className="pointer-events-none absolute inset-y-0 w-[2px] bg-accent shadow-glow-sm"
              style={{ left: `${divider}%` }}
            >
              <span className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-background/85 backdrop-blur-md">
                <span className="text-[10px] font-bold text-accent">↔</span>
              </span>
            </div>
            {status === "processing" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-[2px]">
                <Sparkles className="size-6 animate-spin-slow text-accent" strokeWidth={1.6} />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em]">Enhancing…</p>
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Drag the divider to compare
          </p>
        </section>

        <button
          onClick={enhance}
          disabled={status === "processing"}
          className={cn(
            "animate-rise mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[12px] font-extrabold uppercase tracking-[0.16em] transition-all active:scale-[0.98]",
            status === "completed"
              ? "border border-accent bg-surface text-accent"
              : "bg-gradient-brand text-primary-foreground shadow-glow-sm",
          )}
        >
          {status === "processing" ? (
            <>
              <span className="size-4 animate-spin-slow rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Processing…
            </>
          ) : status === "completed" ? (
            <>
              <Check className="size-4" strokeWidth={2.6} /> Enhanced
            </>
          ) : (
            <>
              <Wand2 className="size-4" strokeWidth={2} /> Enhance with AI
            </>
          )}
        </button>

        <section className="animate-rise mt-5 surface-card p-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Enhancement mode
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setEnhanceMode(m.id)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 transition-all active:scale-95",
                  enhanceMode === m.id
                    ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                    : "border-border bg-surface text-muted-foreground",
                )}
              >
                <span className="block text-[11.5px] font-bold">{m.id}</span>
                <span className="block text-[9px] uppercase tracking-[0.1em] opacity-80">
                  {m.hint}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            <StudioSlider
              label="Intensity"
              value={enhanceIntensity}
              onChange={setEnhanceIntensity}
              suffix=""
            />
          </div>

          <button
            onClick={reset}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground active:scale-[0.98]"
          >
            <RotateCcw className="size-3.5" strokeWidth={2} /> Reset
          </button>
        </section>
      </div>
    </div>
  );
}
