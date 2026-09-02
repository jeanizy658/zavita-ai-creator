import { useMemo, useRef, useState } from "react";
import { useStudio } from "@/lib/studio-store";
import { Eye, EyeOff, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import editorFrame from "@/assets/editor-frame.jpg";
import broll1 from "@/assets/broll-1.jpg";
import broll2 from "@/assets/broll-2.jpg";
import broll3 from "@/assets/broll-3.jpg";
import ill1 from "@/assets/ai-ill-1.jpg";
import ill2 from "@/assets/ai-ill-2.jpg";
import photo1 from "@/assets/proj-travel.jpg";
import photo2 from "@/assets/proj-product.jpg";

export const TIMELINE_DURATION = 135; // 02:15
export const PX_PER_SECOND = 26;

type Clip = {
  id: string;
  start: number;
  duration: number;
  label?: string | undefined;
  image?: string | undefined;
};

type Track = {
  id: string;
  name: string;
  tint: string;
  clips: Clip[];
  kind?: "audio";
};

const TRACKS: Track[] = [
  {
    id: "main",
    name: "Main Video",
    tint: "var(--brand-blue)",
    clips: [
      { id: "m1", start: 0, duration: 42, image: editorFrame },
      { id: "m2", start: 44, duration: 38, image: broll2 },
      { id: "m3", start: 84, duration: 51, image: editorFrame },
    ],
  },
  {
    id: "overlay",
    name: "Overlay",
    tint: "var(--brand-violet)",
    clips: [
      { id: "o1", start: 10, duration: 18, label: "Logo" },
      { id: "o2", start: 62, duration: 22, label: "Lower third" },
    ],
  },
  {
    id: "photo",
    name: "Photo",
    tint: "var(--brand-cyan)",
    clips: [
      { id: "p1", start: 6, duration: 12, image: photo1 },
      { id: "p2", start: 50, duration: 14, image: photo2 },
      { id: "p3", start: 100, duration: 16, image: broll1 },
    ],
  },
  {
    id: "text",
    name: "Text",
    tint: "var(--gold)",
    clips: [
      { id: "t1", start: 2, duration: 14, label: "Pour réussir" },
      { id: "t2", start: 17, duration: 22, label: "dans le business," },
      { id: "t3", start: 40, duration: 28, label: "il faut comprendre" },
      { id: "t4", start: 69, duration: 16, label: "son client." },
    ],
  },
  {
    id: "ai",
    name: "AI Visual",
    tint: "oklch(0.7 0.2 320)",
    clips: [
      { id: "a1", start: 20, duration: 20, image: ill1 },
      { id: "a2", start: 55, duration: 18, image: ill2 },
      { id: "a3", start: 96, duration: 24, image: broll3 },
    ],
  },
  {
    id: "audio",
    name: "Audio",
    tint: "oklch(0.78 0.19 150)",
    kind: "audio",
    clips: [{ id: "au1", start: 0, duration: TIMELINE_DURATION, label: "Voice + Music" }],
  },
];

function Waveform() {
  const bars = Array.from({ length: 160 }, (_, i) =>
    Math.abs(Math.sin(i * 0.7) * 0.5 + Math.sin(i * 0.21) * 0.4 + Math.sin(i * 1.7) * 0.18),
  );
  return (
    <div className="flex h-full w-full items-center gap-[2px] px-1">
      {bars.map((b, i) => (
        <span
          key={i}
          className="flex-1 rounded-full bg-[oklch(0.78_0.19_150)]"
          style={{ height: `${(18 + b * 70).toFixed(2)}%`, opacity: Number((0.55 + b * 0.45).toFixed(2)) }}
        />
      ))}
    </div>
  );
}

export function Timeline({
  playhead,
  onPlayheadChange,
}: {
  playhead: number;
  onPlayheadChange: (seconds: number) => void;
}) {
  const { timelineMedia } = useStudio();
  const tracks = useMemo(() => {
    return TRACKS.map((t) => {
      const extras = timelineMedia.filter((m) => m.trackId === t.id);
      if (extras.length === 0) return t;
      let cursor = t.clips.reduce((max, c) => Math.max(max, c.start + c.duration), 0) + 1;
      const clips = [...t.clips];
      for (const e of extras) {
        clips.push({ id: e.id, start: cursor, duration: e.duration, label: e.label, image: e.image });
        cursor += e.duration + 1;
      }
      return { ...t, clips };
    });
  }, [timelineMedia]);

  const totalDuration = useMemo(
    () =>
      Math.max(
        TIMELINE_DURATION,
        ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)),
      ),
    [tracks],
  );
  const width = totalDuration * PX_PER_SECOND;

  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [selectedTrack, setSelectedTrack] = useState("main");
  const [selectedClip, setSelectedClip] = useState<string | null>("m1");
  const laneRef = useRef<HTMLDivElement>(null);

  const seek = (clientX: number) => {
    const el = laneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    onPlayheadChange(Math.max(0, Math.min(totalDuration, x / PX_PER_SECOND)));
  };

  const ticks = Array.from({ length: Math.floor(totalDuration / 5) + 1 }, (_, i) => i * 5);

  return (
    <div className="rounded-2xl border border-border bg-surface/60">
      <div className="flex">
        {/* Track heads */}
        <div className="w-[84px] shrink-0 border-r border-border">
          <div className="h-7 border-b border-border" />
          {tracks.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              className={cn(
                "flex h-[52px] items-center gap-1 border-b border-border px-1.5 transition-colors",
                selectedTrack === t.id && "bg-surface-2",
              )}
            >
              <button
                aria-label={`Toggle ${t.name} visibility`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHidden((h) => ({ ...h, [t.id]: !h[t.id] }));
                }}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground active:scale-90"
              >
                {hidden[t.id] ? (
                  <EyeOff className="size-3.5" strokeWidth={1.7} />
                ) : (
                  <Eye className="size-3.5 text-accent" strokeWidth={1.7} />
                )}
              </button>
              <span className="min-w-0 flex-1 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {t.name}
              </span>
              <GripHorizontal className="size-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.7} />
            </div>
          ))}
        </div>

        {/* Lanes */}
        <div
          ref={laneRef}
          className="no-scrollbar relative flex-1 overflow-x-auto"
          onPointerDown={(e) => seek(e.clientX)}
          onPointerMove={(e) => {
            if (e.buttons === 1) seek(e.clientX);
          }}
        >
          <div className="relative" style={{ width }}>
            {/* Ruler */}
            <div className="relative h-7 border-b border-border">
              {ticks.map((s) => (
                <div
                  key={s}
                  className="absolute top-0 h-full border-l border-border/70 pl-1 pt-1 text-[8.5px] tabular-nums text-muted-foreground"
                  style={{ left: s * PX_PER_SECOND }}
                >
                  {s % 10 === 0
                    ? `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
                    : ""}
                </div>
              ))}
            </div>

            {tracks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTrack(t.id)}
                className={cn(
                  "relative h-[52px] border-b border-border",
                  selectedTrack === t.id && "bg-surface-2/60",
                  hidden[t.id] && "opacity-30",
                )}
              >
                {t.clips.map((c) => (
                  <button
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrack(t.id);
                      setSelectedClip(c.id);
                    }}
                    className={cn(
                      "absolute top-1.5 h-[40px] overflow-hidden rounded-md border text-left transition-shadow",
                      selectedClip === c.id
                        ? "border-accent shadow-glow-sm"
                        : "border-border-strong",
                    )}
                    style={{
                      left: c.start * PX_PER_SECOND,
                      width: Math.max(24, c.duration * PX_PER_SECOND - 4),
                      background: `color-mix(in oklab, ${t.tint} 26%, var(--surface))`,
                    }}
                  >
                    {t.kind === "audio" ? (
                      <Waveform />
                    ) : c.image ? (
                      <span className="flex h-full">
                        <img
                          src={c.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover opacity-90"
                        />
                      </span>
                    ) : (
                      <span className="flex h-full items-center px-1.5 text-[9px] font-semibold text-foreground">
                        <span className="truncate">{c.label}</span>
                      </span>
                    )}
                    {t.id === "text" ? (
                      <span className="absolute inset-0 flex items-center px-1.5 text-[9px] font-semibold text-foreground">
                        <span className="truncate">{c.label}</span>
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="pointer-events-none absolute top-0 z-20 h-full w-[2px] bg-accent shadow-glow-sm"
              style={{ left: playhead * PX_PER_SECOND }}
            >
              <span className="absolute -left-[5px] top-0 size-3 rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
