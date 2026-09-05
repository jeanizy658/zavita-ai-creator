import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Gauge,
  Layers,
  Maximize2,
  Mic,
  Music2,
  Pause,
  Play,
  Plus,
  Scissors,
  Sliders,
  Sparkles,
  Trash2,
  Type,
  Volume2,
  Wand2,
  X,
  Crop,
  Camera,
  Check,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Timeline, TIMELINE_DURATION } from "@/components/zavita/Timeline";
import { AddToProjectSheet } from "@/components/zavita/AddToProjectSheet";
import { useStudio } from "@/lib/studio-store";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import editorFrame from "@/assets/editor-frame.jpg";
import ill1 from "@/assets/ai-ill-1.jpg";
import ill2 from "@/assets/ai-ill-2.jpg";
import ill3 from "@/assets/ai-ill-3.jpg";
import broll1 from "@/assets/broll-1.jpg";
import broll2 from "@/assets/broll-2.jpg";
import broll3 from "@/assets/broll-3.jpg";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Video Editor — ZAVITA" },
      {
        name: "description",
        content:
          "Multi-track mobile video editor with AI suggestions, B-roll, subtitles and a professional timeline.",
      },
      { property: "og:title", content: "Video Editor — ZAVITA" },
      { property: "og:description", content: "Professional multi-track mobile editing with AI." },
    ],
  }),
  component: EditorScreen,
});

const QUICK_TOOLS = [
  { id: "split", label: "Split", icon: Scissors },
  { id: "trim", label: "Trim", icon: Crop },
  { id: "speed", label: "Speed", icon: Gauge },
  { id: "enhance", label: "AI Enhance", icon: Wand2 },
  { id: "voice", label: "AI Voice", icon: Mic },
  { id: "volume", label: "Volume", icon: Volume2 },
  { id: "delete", label: "Delete", icon: Trash2 },
  { id: "duplicate", label: "Duplicate", icon: Copy },
] as const;

const BOTTOM_TABS = [
  { id: "edit", label: "Edit", icon: Sliders },
  { id: "filters", label: "Filters", icon: Sparkles },
  { id: "effects", label: "Effects", icon: Wand2 },
  { id: "text", label: "Text", icon: Type },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "audio", label: "Audio", icon: Music2 },
  { id: "ai", label: "AI Tools", icon: Sparkles },
] as const;

const ILLUSTRATIONS = [
  { id: "i1", image: ill1, title: "Growth chart" },
  { id: "i2", image: ill2, title: "Client deal" },
  { id: "i3", image: ill3, title: "Success" },
];

const BROLL = [
  { id: "b1", image: broll1, title: "City skyline", duration: "00:06" },
  { id: "b2", image: broll2, title: "Laptop work", duration: "00:04" },
  { id: "b3", image: broll3, title: "Team meeting", duration: "00:08" },
];

function tc(seconds: number) {
  const s = Math.max(0, Math.min(TIMELINE_DURATION, seconds));
  const frames = Math.floor((s % 1) * 25);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")} ${String(frames).padStart(2, "0")}`;
}

function EditorScreen() {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(8.56);
  const [tool, setTool] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("edit");
  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { timelineMedia } = useStudio();
  const mediaCount = useRef(timelineMedia.length);

  useEffect(() => {
    if (timelineMedia.length > mediaCount.current) {
      const added = timelineMedia.length - mediaCount.current;
      setToast(`${added} media added to your project`);
      const t = setTimeout(() => setToast(null), 2200);
      mediaCount.current = timelineMedia.length;
      return () => clearTimeout(t);
    }
    mediaCount.current = timelineMedia.length;
    return;
  }, [timelineMedia]);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => {
      setPlayhead((p) => (p >= TIMELINE_DURATION ? 0 : p + 0.04));
    }, 40);
    return () => {
      if (raf.current) clearInterval(raf.current);
    };
  }, [playing]);

  const onTool = (id: string) => {
    setTool(id);
    if (id === "enhance") navigate({ to: "/ai-enhance" });
    if (id === "voice") navigate({ to: "/ai-voice" });
  };

  const onTab = (id: string) => {
    setTab(id);
    setTool(null);
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(env(safe-area-inset-bottom)+86px)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link
          to="/camera"
          aria-label="Back to camera"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
        >
          <ChevronLeft className="size-5" strokeWidth={1.7} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">Business Tips</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Editing</p>
        </div>
        <Link
          to="/home"
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground active:scale-95"
        >
          Home
        </Link>
        <button
          onClick={() => setAddOpen(true)}
          aria-label="Add media to project"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent active:scale-95"
        >
          <ImagePlus className="size-4.5" strokeWidth={1.7} />
        </button>
        <button
          onClick={() => navigate({ to: "/export" })}
          className="rounded-full bg-gradient-brand px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-glow-sm active:scale-95"
        >
          Export
        </button>
      </header>

      <div className="mx-auto w-full max-w-[560px] px-4">
        {/* Preview */}
        <section className="animate-rise mt-4">
          <div
            className={cn(
              "relative overflow-hidden border border-border",
              fullscreen
                ? "fixed inset-0 z-50 flex flex-col justify-center rounded-none bg-background"
                : "rounded-2xl",
            )}
          >
            <img
              src={editorFrame}
              alt="Video preview"
              width={1280}
              height={720}
              className="aspect-video w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30" />
            <p className="absolute inset-x-3 bottom-14 text-center text-[13px] font-bold leading-snug text-foreground drop-shadow-[0_2px_10px_oklch(0_0_0/0.9)]">
              Pour réussir dans le business, il faut comprendre son client.
            </p>
            <button
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg border border-border bg-background/60 backdrop-blur-md active:scale-95"
            >
              <Maximize2 className="size-4" strokeWidth={1.7} />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-background/60 px-3 py-2 backdrop-blur-md">
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Play"}
                className="flex size-8 items-center justify-center rounded-full bg-gradient-brand shadow-glow-sm active:scale-95"
              >
                {playing ? (
                  <Pause className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                ) : (
                  <Play className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                )}
              </button>
              <span className="text-[11px] font-semibold tabular-nums text-foreground">
                {tc(playhead)} <span className="text-muted-foreground">/ 02:15 36</span>
              </span>
              <div className="relative h-1 flex-1 rounded-full bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand"
                  style={{ width: `${(playhead / TIMELINE_DURATION) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* AI analysis */}
        <section className="animate-rise mt-5 surface-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-accent" strokeWidth={1.8} />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground">
              AI Suggestions
            </p>
            <span className="ml-auto rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              AI Analysis
            </span>
          </div>
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            Detected keywords in your speech — ZAVITA proposes matching visuals.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["BUSINESS", "CLIENT", "SUCCESS"].map((k) => (
              <span
                key={k}
                className="rounded-full bg-gradient-brand p-[1px] text-[10px] font-bold tracking-[0.14em]"
              >
                <span className="block rounded-full bg-background px-2.5 py-1 text-foreground">{k}</span>
              </span>
            ))}
          </div>
        </section>

        {/* AI Illustration */}
        <section className="animate-rise mt-6">
          <SectionHeader title="AI Illustration" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {ILLUSTRATIONS.filter((i) => !removed.includes(i.id)).map((i) => (
              <div key={i.id} className="w-[132px] shrink-0">
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img
                    src={i.image}
                    alt={i.title}
                    loading="lazy"
                    width={640}
                    height={640}
                    className="aspect-square w-full object-cover"
                  />
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-background/70 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-accent backdrop-blur-sm">
                    AI
                  </span>
                </div>
                <p className="mt-1.5 truncate text-[11px] font-semibold">{i.title}</p>
                <div className="mt-1.5 flex gap-1.5">
                  <button
                    onClick={() => setAdded((a) => (a.includes(i.id) ? a : [...a, i.id]))}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all active:scale-95",
                      added.includes(i.id)
                        ? "bg-surface-2 text-muted-foreground"
                        : "bg-gradient-brand text-primary-foreground shadow-glow-sm",
                    )}
                  >
                    <Plus className="size-3" strokeWidth={2.4} />
                    {added.includes(i.id) ? "Added" : "Add"}
                  </button>
                  <button
                    aria-label={`Remove ${i.title}`}
                    onClick={() => setRemoved((r) => [...r, i.id])}
                    className="flex size-7 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground active:scale-95"
                  >
                    <X className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI B-roll */}
        <section className="animate-rise mt-6">
          <SectionHeader title="AI B-Roll" actionLabel="Refresh" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {BROLL.map((b) => (
              <div key={b.id} className="w-[176px] shrink-0">
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img
                    src={b.image}
                    alt={b.title}
                    loading="lazy"
                    width={896}
                    height={512}
                    className="aspect-video w-full object-cover"
                  />
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/75 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums backdrop-blur-sm">
                    {b.duration}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[11px] font-semibold">{b.title}</p>
                  <button
                    onClick={() => setAdded((a) => (a.includes(b.id) ? a : [...a, b.id]))}
                    className="flex items-center gap-1 rounded-lg border border-border-strong bg-surface px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] active:scale-95"
                  >
                    <Plus className="size-3" strokeWidth={2.4} />
                    {added.includes(b.id) ? "Added" : "Add"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick edit toolbar */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Quick Edit" actionLabel="Add media" onAction={() => setAddOpen(true)} />
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {QUICK_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => onTool(t.id)}
                className={cn(
                  "flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all active:scale-95",
                  tool === t.id
                    ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                    : "border-border bg-surface text-muted-foreground",
                  t.id === "delete" && tool !== t.id && "text-destructive",
                )}
              >
                <t.icon className="size-[18px]" strokeWidth={1.7} />
                <span className="text-[9px] font-bold uppercase tracking-[0.06em]">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Timeline" />
          <Timeline playhead={playhead} onPlayheadChange={setPlayhead} />
          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Drag the timeline to move the playhead
          </p>
        </section>

        {/* Mode panel */}
        {tab !== "edit" ? (
          <section className="animate-rise mt-5 surface-card p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {BOTTOM_TABS.find((b) => b.id === tab)?.label} mode
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              {tab === "ai"
                ? "AI tools panel: Enhance, Voice, Background, Captions and Avatar."
                : `${BOTTOM_TABS.find((b) => b.id === tab)?.label} editing is active — select a clip on the timeline to apply it.`}
            </p>
            {tab === "ai" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate({ to: "/ai-enhance" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Wand2 className="size-4 text-accent" strokeWidth={1.7} /> AI Enhance
                </button>
                <button
                  onClick={() => navigate({ to: "/ai-voice" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Mic className="size-4 text-accent" strokeWidth={1.7} /> AI Voice
                </button>
                <button
                  onClick={() => navigate({ to: "/ai-background" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Layers className="size-4 text-accent" strokeWidth={1.7} /> AI Background
                </button>
                <button
                  onClick={() => navigate({ to: "/avatar" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Sparkles className="size-4 text-accent" strokeWidth={1.7} /> AI Avatar
                </button>
                <button
                  onClick={() => navigate({ to: "/camera" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Camera className="size-4 text-accent" strokeWidth={1.7} /> Re-record
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {toast ? (
        <div className="animate-rise pointer-events-none fixed inset-x-0 bottom-[104px] z-50 flex justify-center px-4">
          <span className="flex items-center gap-2 rounded-full border border-accent bg-surface px-4 py-2 text-[11px] font-semibold shadow-glow-sm">
            <Check className="size-3.5 text-accent" strokeWidth={2.6} />
            {toast}
          </span>
        </div>
      ) : null}

      <AddToProjectSheet open={addOpen} onClose={() => setAddOpen(false)} />

      {/* Editor bottom toolbar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] border-t border-border bg-background/92 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur-xl">
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-3">
          {BOTTOM_TABS.map((b) => (
            <button
              key={b.id}
              onClick={() => onTab(b.id)}
              className={cn(
                "flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors",
                tab === b.id ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <b.icon
                className={cn("size-[19px]", tab === b.id && "text-accent")}
                strokeWidth={1.6}
              />
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.06em]">{b.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
