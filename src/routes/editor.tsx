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
import { Button } from "@/components/ui/button";
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
          "Preview stored media and arrange your ZAVITA project clips on six tracks.",
      },
      { property: "og:title", content: "Video Editor — ZAVITA" },
      { property: "og:description", content: "Preview stored media and arrange real project clips on six tracks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const s = Math.max(0, seconds);
  const frames = Math.floor((s % 1) * 25);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")} ${String(frames).padStart(2, "0")}`;
}

function EditorScreen() {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [tool, setTool] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("edit");
  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { timelineMedia, projectName, projectLoading, projectError } = useStudio();
  const player = useRef<HTMLVideoElement>(null);
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const current = timelineMedia.find((m) => m.trackId === "main" && playhead >= (m.start ?? 0) && playhead < (m.start ?? 0) + m.duration) ?? timelineMedia.find((m) => m.trackId === "main");
  const currentAudio = timelineMedia.find((m) => m.trackId === "audio" && playhead >= (m.start ?? 0) && playhead < (m.start ?? 0) + m.duration) ?? timelineMedia.find((m) => m.trackId === "audio");
  const imageMedia = timelineMedia.find((m) => ["photo", "overlay", "ai"].includes(m.trackId) && playhead >= (m.start ?? 0) && playhead < (m.start ?? 0) + m.duration) ?? timelineMedia.find((m) => ["photo", "overlay", "ai"].includes(m.trackId));
  const totalDuration = Math.max(0, ...timelineMedia.map((m) => (m.start ?? 0) + m.duration));
  const seek = (seconds: number) => {
    setPlayhead(seconds);
    if (player.current && current) player.current.currentTime = Math.max(0, Math.min(current.duration, seconds - (current.start ?? 0)));
    if (!current && audioPlayer.current) audioPlayer.current.currentTime = seconds;
  };
  const togglePlayback = async () => {
    const el = current ? player.current : audioPlayer.current;
    if (!el) return;
    try { if (el.paused) await el.play(); else el.pause(); setPlayError(null); }
    catch { setPlayError("This media cannot be played by this browser. Import a compatible file."); }
  };
  const mediaCount = useRef(timelineMedia.length);

  useEffect(() => {
    if (timelineMedia.length > mediaCount.current) {
      const added = timelineMedia.length - mediaCount.current;
      setToast(`${added} saved media available`);
      const t = setTimeout(() => setToast(null), 2200);
      mediaCount.current = timelineMedia.length;
      return () => clearTimeout(t);
    }
    mediaCount.current = timelineMedia.length;
    return;
  }, [timelineMedia]);
  const onTool = (id: string) => {
    setTool(id);
    if (!["enhance", "voice"].includes(id)) setPlayError("This editing operation is not configured for stored media yet.");
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
          <p className="truncate text-[13px] font-bold">{projectName}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Editing</p>
        </div>
        <Link
          to="/home"
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground active:scale-95"
        >
          Home
        </Link>
        <Button variant="ghost"
          onClick={() => setAddOpen(true)}
          aria-label="Add media to project"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-accent active:scale-95"
        >
          <ImagePlus className="size-4.5" strokeWidth={1.7} />
        </Button>
        <Button variant="ghost"
          onClick={() => navigate({ to: "/export" })}
          className="rounded-full bg-gradient-brand px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-glow-sm active:scale-95"
        >
          Export
        </Button>
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
            {current?.source ? <video ref={player} src={current.source} playsInline preload="metadata" controls className="aspect-video w-full object-contain" onTimeUpdate={(e) => setPlayhead((current.start ?? 0) + e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setPlayError("Unable to play this video. Choose a compatible file.")} /> : imageMedia?.source ? <img src={imageMedia.source} alt={imageMedia.label} className="aspect-video w-full object-contain" /> : <div className="flex aspect-video items-center justify-center bg-surface text-[12px] text-muted-foreground">{projectLoading ? "Restoring project…" : "No video selected"}</div>}
            {currentAudio?.source && <audio ref={audioPlayer} src={currentAudio.source} controls preload="metadata" className="w-full" onPlay={() => { if (!current) setPlaying(true); }} onPause={() => { if (!current) setPlaying(false); }} onTimeUpdate={(e) => { if (!current) setPlayhead(e.currentTarget.currentTime); }} />}
            {playError && <p role="alert" className="p-2 text-[11px] text-destructive">{playError}</p>}
            {projectError && <p role="alert" className="p-2 text-[11px] text-destructive">{projectError}</p>}
            <Button variant="ghost"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-lg border border-border bg-background/60 backdrop-blur-md active:scale-95"
            >
              <Maximize2 className="size-4" strokeWidth={1.7} />
            </Button>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-background/60 px-3 py-2 backdrop-blur-md">
              <Button variant="ghost"
                onClick={() => void togglePlayback()}
                aria-label={playing ? "Pause" : "Play"}
                className="flex size-8 items-center justify-center rounded-full bg-gradient-brand shadow-glow-sm active:scale-95"
              >
                {playing ? (
                  <Pause className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                ) : (
                  <Play className="size-4 fill-current text-primary-foreground" strokeWidth={0} />
                )}
              </Button>
              <span className="text-[11px] font-semibold tabular-nums text-foreground">
                {tc(playhead)} <span className="text-muted-foreground">/ {tc(totalDuration)}</span>
              </span>
              <div className="relative h-1 flex-1 rounded-full bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-brand"
                  style={{ width: `${(playhead / Math.max(totalDuration, 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 border-b border-border pb-4">
          <SectionHeader title="AI Suggestions" />
          <p className="mt-2 text-[11px] text-muted-foreground">No analysis has been run for this media.</p>
        </section>

        {/* Quick edit toolbar */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Quick Edit" actionLabel="Add media" onAction={() => setAddOpen(true)} />
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {QUICK_TOOLS.map((t) => (
              <Button variant="ghost"
                key={t.id}
                onClick={() => onTool(t.id)}
                className={cn(
                  "flex h-auto w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 transition-all active:scale-95",
                  tool === t.id
                    ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                    : "border-border bg-surface text-muted-foreground",
                  t.id === "delete" && tool !== t.id && "text-destructive",
                )}
              >
                <t.icon className="size-[18px]" strokeWidth={1.7} />
                <span className="text-[9px] font-bold uppercase tracking-[0.06em]">{t.label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Timeline" />
          <Timeline playhead={playhead} onPlayheadChange={seek} />
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
                : "This editing operation is not configured for stored media yet."}
            </p>
            {tab === "ai" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="ghost"
                  onClick={() => navigate({ to: "/ai-enhance" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Wand2 className="size-4 text-accent" strokeWidth={1.7} /> AI Enhance
                </Button>
                <Button variant="ghost"
                  onClick={() => navigate({ to: "/ai-voice" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Mic className="size-4 text-accent" strokeWidth={1.7} /> AI Voice
                </Button>
                <Button variant="ghost"
                  onClick={() => navigate({ to: "/ai-background" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Layers className="size-4 text-accent" strokeWidth={1.7} /> AI Background
                </Button>
                <Button variant="ghost"
                  onClick={() => navigate({ to: "/avatar" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Sparkles className="size-4 text-accent" strokeWidth={1.7} /> AI Avatar
                </Button>
                <Button variant="ghost"
                  onClick={() => navigate({ to: "/camera" })}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-[11px] font-semibold active:scale-95"
                >
                  <Camera className="size-4 text-accent" strokeWidth={1.7} /> Re-record
                </Button>
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
            <Button variant="ghost"
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
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
