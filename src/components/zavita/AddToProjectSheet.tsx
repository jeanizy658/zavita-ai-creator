import { useMemo, useState, useRef, useEffect } from "react";
import { Check, Film, Image as ImageIcon, Music2, Mic, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStudio, type TrackId } from "@/lib/studio-store";
import { MyUploads } from "./MyUploads";
import { useAuth } from "@/lib/auth";
import { appendAssets } from "@/lib/data";

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
  assetId?: string;
};

const LAYERS: { id: TrackId; name: string }[] = [
  { id: "main", name: "MAIN VIDEO" },
  { id: "overlay", name: "OVERLAY" },
  { id: "photo", name: "PHOTO" },
  { id: "text", name: "TEXT" },
  { id: "ai", name: "AI VISUAL" },
  { id: "audio", name: "AUDIO" },
];

export function AddToProjectSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ensureProject, refreshProject } = useStudio();
  const lock = useRef(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("VIDEO");
  const [selected, setSelected] = useState<Asset[]>([]);


  useEffect(() => { setSelected([]); setSaveError(null); }, [user?.id]);

  const targetTracks = useMemo(() => new Set(selected.map((s) => s.track)), [selected]);

  if (!open) return null;

  const toggle = (a: Asset) =>
    setSelected((prev) =>
      prev.some((s) => s.id === a.id) ? prev.filter((s) => s.id !== a.id) : [...prev, a],
    );

  const confirm = async () => {
    if (lock.current || !selected.length) return;
    if (!user) { setSaveError("Sign in to add media to your project."); return; }
    lock.current = true; setSaving(true); setSaveError(null);
    try {
      const id = await ensureProject();
      const items = selected.flatMap((s) => s.assetId ? [{ assetId: s.assetId, duration: s.seconds, label: s.title, track: ({ main: "MAIN", overlay: "OVERLAY", photo: "PHOTO", text: "TEXT", ai: "AI_VISUAL", audio: "AUDIO" } as const)[s.track] }] : []);
      await appendAssets(user.id, id, items);
      setSelected([]);
      await refreshProject();
      onClose();
    } catch (e) { setSaveError(e instanceof Error ? e.message : "Could not save media. Please retry."); }
    finally { lock.current = false; setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-xl">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <p className="flex-1 text-[12px] font-extrabold uppercase tracking-[0.18em]">
          Add to <span className="text-gradient">Project</span>
        </p>
        <Button variant="ghost"
          disabled={saving} onClick={onClose}
          aria-label="Close add to project"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
        >
          <X className="size-4.5" strokeWidth={1.8} />
        </Button>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border px-4 py-2.5">
        {CATEGORIES.map((c) => (
          <Button variant="ghost"
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
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <MyUploads
          category={category}
          selectedIds={selected.map((s) => s.id)}
          onToggle={(u) =>
            toggle({ ...u, kind: u.track === "audio" ? "audio" : u.track === "main" ? "video" : "photo" })
          }
        />
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
        {saveError ? <p className="mt-2 text-[11px] text-destructive">{saveError}</p> : null}
        <Button variant="ghost"
          disabled={selected.length === 0 || saving}
          onClick={() => void confirm()}
          className="mt-3 w-full rounded-xl bg-gradient-brand py-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm transition-all active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? "Adding…" : `Add (${selected.length})`}
        </Button>
      </div>
    </div>
  );
}
