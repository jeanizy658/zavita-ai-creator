import { useMemo, useRef, useState } from "react";
import { useStudio } from "@/lib/studio-store";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, GripHorizontal, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  { id: "main", name: "Main Video", tint: "var(--brand-blue)", clips: [] },
  { id: "overlay", name: "Overlay", tint: "var(--brand-violet)", clips: [] },
  { id: "photo", name: "Photo", tint: "var(--brand-cyan)", clips: [] },
  { id: "text", name: "Text", tint: "var(--gold)", clips: [] },
  { id: "ai", name: "AI Visual", tint: "var(--brand-violet)", clips: [] },
  { id: "audio", name: "Audio", tint: "var(--brand-cyan)", kind: "audio", clips: [] },
];

export function Timeline({
  playhead,
  onPlayheadChange,
}: {
  playhead: number;
  onPlayheadChange: (seconds: number) => void;
}) {
  const { timelineMedia } = useStudio();
  const tracks = useMemo(() => TRACKS.map((t) => ({ ...t, clips: timelineMedia.filter((m) => m.trackId === t.id).map((m) => ({ id: m.id, start: m.start ?? 0, duration: m.duration, label: m.label, image: m.image })) })), [timelineMedia]);

  const totalDuration = useMemo(
    () =>
      Math.max(
        10,
        ...tracks.flatMap((t) => t.clips.map((c) => c.start + c.duration)),
      ),
    [tracks],
  );
  const width = totalDuration * PX_PER_SECOND;

  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [selectedTrack, setSelectedTrack] = useState("main");
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
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
        <div className="w-[104px] shrink-0 border-r border-border">
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
              <Button variant="ghost"
                aria-label={`Toggle ${t.name} visibility`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHidden((h) => ({ ...h, [t.id]: !h[t.id] }));
                }}
                className="h-auto shrink-0 p-0 text-muted-foreground transition-colors hover:text-foreground active:scale-90"
              >
                {hidden[t.id] ? (
                  <EyeOff className="size-3.5" strokeWidth={1.7} />
                ) : (
                  <Eye className="size-3.5 text-accent" strokeWidth={1.7} />
                )}
              </Button>
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
          className="no-scrollbar relative min-w-0 flex-1 overflow-x-auto"
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
                  <Button variant="ghost"
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTrack(t.id);
                      setSelectedClip(c.id);
                      onPlayheadChange(c.start);
                    }}
                    className={cn(
                      "absolute top-1.5 h-[40px] p-0 overflow-hidden rounded-md border text-left transition-shadow",
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
                      <span className="flex h-full items-center gap-1 px-2 text-[9px] text-accent"><Music2 className="size-3 shrink-0" /><span className="truncate">{c.label}</span></span>
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
                  </Button>
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
