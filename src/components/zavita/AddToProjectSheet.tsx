import { useMemo, useState } from "react";
import { Check, Film, Image as ImageIcon, Music2, Mic, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudio, type TrackId } from "@/lib/studio-store";
import editorFrame from "@/assets/editor-frame.jpg";
import broll1 from "@/assets/broll-1.jpg";
import broll2 from "@/assets/broll-2.jpg";
import broll3 from "@/assets/broll-3.jpg";
import ill1 from "@/assets/ai-ill-1.jpg";
import ill2 from "@/assets/ai-ill-2.jpg";
import ill3 from "@/assets/ai-ill-3.jpg";
import photo1 from "@/assets/proj-travel.jpg";
import photo2 from "@/assets/proj-product.jpg";
import photo3 from "@/assets/proj-business.jpg";
import bgOffice from "@/assets/bg-office.jpg";
import bgStudio from "@/assets/bg-studio.jpg";
import logoImg from "@/assets/zavita-logo.png";

const CATEGORIES = [
  "VIDEO",
  "PHOTO",
  "AUDIO",
  "MUSIC",
  "VOICE",
  "IMAGE",
  "LOGO",
  "AI VISUAL",
  "AI VIDEO",
] as const;

type Asset = {
  id: string;
  title: string;
  duration?: string;
  seconds: number;
  image?: string;
  track: TrackId;
  kind: "video" | "photo" | "audio" | "visual";
};

const LIBRARY: Record<string, Asset[]> = {
  VIDEO: [
    { id: "v1", title: "Interview_A.mp4", duration: "00:42", seconds: 12, image: editorFrame, track: "main", kind: "video" },
    { id: "v2", title: "City_Drive.mp4", duration: "00:18", seconds: 9, image: broll1, track: "main", kind: "video" },
    { id: "v3", title: "Desk_Work.mp4", duration: "00:24", seconds: 10, image: broll2, track: "main", kind: "video" },
    { id: "v4", title: "Team_Talk.mp4", duration: "00:31", seconds: 11, image: broll3, track: "main", kind: "video" },
  ],
  PHOTO: [
    { id: "p1", title: "Travel_01.jpg", seconds: 6, image: photo1, track: "photo", kind: "photo" },
    { id: "p2", title: "Product_02.jpg", seconds: 6, image: photo2, track: "photo", kind: "photo" },
    { id: "p3", title: "Business_03.jpg", seconds: 6, image: photo3, track: "photo", kind: "photo" },
  ],
  AUDIO: [
    { id: "a1", title: "Room_Tone.wav", duration: "01:10", seconds: 14, track: "audio", kind: "audio" },
    { id: "a2", title: "Crowd_Amb.wav", duration: "00:36", seconds: 10, track: "audio", kind: "audio" },
  ],
  MUSIC: [
    { id: "m1", title: "Neon Drive.mp3", duration: "02:04", seconds: 18, track: "audio", kind: "audio" },
    { id: "m2", title: "Soft Focus.mp3", duration: "01:42", seconds: 15, track: "audio", kind: "audio" },
    { id: "m3", title: "Uplift.mp3", duration: "01:12", seconds: 12, track: "audio", kind: "audio" },
  ],
  VOICE: [
    { id: "vo1", title: "VO_Intro.wav", duration: "00:12", seconds: 8, track: "audio", kind: "audio" },
    { id: "vo2", title: "VO_Outro.wav", duration: "00:09", seconds: 7, track: "audio", kind: "audio" },
  ],
  IMAGE: [
    { id: "im1", title: "Studio_BG.png", seconds: 6, image: bgStudio, track: "overlay", kind: "photo" },
    { id: "im2", title: "Office_BG.png", seconds: 6, image: bgOffice, track: "overlay", kind: "photo" },
  ],
  LOGO: [
    { id: "lg1", title: "ZAVITA_Logo.png", seconds: 5, image: logoImg, track: "overlay", kind: "photo" },
    { id: "lg2", title: "Watermark.png", seconds: 5, image: logoImg, track: "overlay", kind: "photo" },
  ],
  "AI VISUAL": [
    { id: "iv1", title: "Growth_Chart", seconds: 8, image: ill1, track: "ai", kind: "visual" },
    { id: "iv2", title: "Client_Deal", seconds: 8, image: ill2, track: "ai", kind: "visual" },
    { id: "iv3", title: "Success_Scene", seconds: 8, image: ill3, track: "ai", kind: "visual" },
  ],
  "AI VIDEO": [
    { id: "av1", title: "AI_Skyline.mp4", duration: "00:08", seconds: 10, image: broll1, track: "ai", kind: "visual" },
    { id: "av2", title: "AI_Presenter.mp4", duration: "00:14", seconds: 12, image: editorFrame, track: "ai", kind: "visual" },
  ],
};

const LAYERS: { id: TrackId; name: string }[] = [
  { id: "main", name: "MAIN VIDEO" },
  { id: "overlay", name: "OVERLAY" },
  { id: "photo", name: "PHOTO" },
  { id: "text", name: "TEXT" },
  { id: "ai", name: "AI VISUAL" },
  { id: "audio", name: "AUDIO" },
];

const kindIcon = {
  video: Film,
  photo: ImageIcon,
  audio: Music2,
  visual: Sparkles,
};

export function AddToProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addToTimeline } = useStudio();
  const [category, setCategory] = useState<string>("VIDEO");
  const [selected, setSelected] = useState<Asset[]>([]);

  const items = LIBRARY[category] ?? [];
  const targetTracks = useMemo(() => new Set(selected.map((s) => s.track)), [selected]);

  if (!open) return null;

  const toggle = (a: Asset) =>
    setSelected((prev) =>
      prev.some((s) => s.id === a.id) ? prev.filter((s) => s.id !== a.id) : [...prev, a],
    );

  const confirm = () => {
    addToTimeline(
      selected.map((s) => ({
        trackId: s.track,
        label: s.title,
        image: s.image,
        duration: s.seconds,
      })),
    );
    setSelected([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <p className="flex-1 text-[12px] font-extrabold uppercase tracking-[0.18em]">
          Add to <span className="text-gradient">Project</span>
        </p>
        <button
          onClick={onClose}
          aria-label="Close add to project"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
        >
          <X className="size-4.5" strokeWidth={1.8} />
        </button>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border px-4 py-2.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] transition-all active:scale-95",
              category === c
                ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                : "border-border bg-surface text-muted-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Recents
        </p>
        <div className="grid grid-cols-2 gap-3">
          {items.map((a) => {
            const Icon = kindIcon[a.kind];
            const isSel = selected.some((s) => s.id === a.id);
            return (
              <button
                key={a.id}
                onClick={() => toggle(a)}
                data-media-item="true"
                className={cn(
                  "animate-rise overflow-hidden rounded-xl border text-left transition-all active:scale-[0.98]",
                  isSel ? "border-accent shadow-glow-sm" : "border-border",
                )}
              >
                <div className="relative aspect-video w-full bg-surface-2">
                  {a.image ? (
                    <img
                      src={a.image}
                      alt={a.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <Mic className="size-6 text-muted-foreground" strokeWidth={1.5} />
                    </span>
                  )}
                  <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-background/75 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm">
                    <Icon className="size-3 text-accent" strokeWidth={1.8} />
                    {a.kind}
                  </span>
                  <span
                    className={cn(
                      "absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-md border transition-colors",
                      isSel
                        ? "border-transparent bg-accent text-background"
                        : "border-border-strong bg-background/70",
                    )}
                  >
                    {isSel ? <Check className="size-3.5" strokeWidth={3} /> : null}
                  </span>
                  {a.duration ? (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/75 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums backdrop-blur-sm">
                      {a.duration}
                    </span>
                  ) : null}
                </div>
                <p className="truncate px-2 py-1.5 text-[11px] font-semibold">{a.title}</p>
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Layers
        </p>
        <div className="surface-card divide-y divide-border">
          {LAYERS.map((l) => (
            <div key={l.id} className="flex items-center gap-2 px-3 py-2">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  targetTracks.has(l.id) ? "bg-accent" : "bg-muted-foreground/40",
                )}
              />
              <span className="flex-1 text-[10.5px] font-bold uppercase tracking-[0.12em]">
                {l.name}
              </span>
              {targetTracks.has(l.id) ? (
                <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                  Insert here
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Selected
          </p>
          <p className="text-[10.5px] font-bold tabular-nums text-accent">{selected.length} assets</p>
        </div>
        <div className="no-scrollbar mt-2 flex min-h-[42px] gap-2 overflow-x-auto">
          {selected.length === 0 ? (
            <p className="self-center text-[11px] text-muted-foreground">
              Pick media above to add it to your project.
            </p>
          ) : (
            selected.map((s) => (
              <span
                key={s.id}
                className="animate-rise size-[42px] shrink-0 overflow-hidden rounded-lg border border-border-strong bg-surface-2"
              >
                {s.image ? (
                  <img src={s.image} alt={s.title} loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <Music2 className="size-4 text-accent" strokeWidth={1.7} />
                  </span>
                )}
              </span>
            ))
          )}
        </div>
        <button
          disabled={selected.length === 0}
          onClick={confirm}
          className="mt-3 w-full rounded-xl bg-gradient-brand py-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          Add ({selected.length})
        </button>
      </div>
    </div>
  );
}
