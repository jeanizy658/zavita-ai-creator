import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Check, Loader2, Music2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { listAssets, uploadAsset, type Asset, type UploadState } from "@/lib/data";
import { formatDuration } from "@/lib/media";
import { signedUrl } from "@/lib/storage";
import type { TrackId } from "@/lib/studio-store";

export type PickedUpload = {
  id: string;
  title: string;
  seconds: number;
  image?: string;
  track: TrackId;
  assetId: string;
};

function trackFor(a: Asset): TrackId {
  if (a.type === "VIDEO" || a.type === "AI_VIDEO") return "main";
  if (a.type === "AUDIO" || a.type === "MUSIC" || a.type === "VOICE") return "audio";
  if (a.type === "AI_VISUAL") return "ai";
  return "photo";
}

/** Real device uploads + the user's stored media library. */
export function MyUploads({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[];
  onToggle: (item: PickedUpload) => void;
}) {
  const { user, loading } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({ status: "IDLE" });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const rows = await listAssets();
      setAssets(rows);
      const entries = await Promise.all(
        rows.map(async (r) => [r.id, await signedUrl(r.thumbnail_url)] as const),
      );
      setThumbs(Object.fromEntries(entries.filter((e) => e[1]) as [string, string][]));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load your media.");
    }
  };

  useEffect(() => {
    if (user) void refresh();
  }, [user]);

  const onFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    for (const file of Array.from(files)) {
      try {
        await uploadAsset({ userId: user.id, file, onState: setState });
      } catch {
        /* state already reflects the failure */
      }
    }
    await refresh();
  };

  if (loading) return null;
  if (!user) {
    return (
      <div className="surface-card mb-5 flex items-center gap-3 p-3">
        <Upload className="size-5 text-accent" strokeWidth={1.7} />
        <p className="flex-1 text-[11.5px] text-muted-foreground">Sign in to upload and keep your own media.</p>
        <Link to="/auth" className="rounded-full bg-gradient-brand px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
          Sign in
        </Link>
      </div>
    );
  }

  const busy = state.status === "SELECTED" || state.status === "UPLOADING" || state.status === "PROCESSING";

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accent/60 bg-surface py-3 text-[11px] font-bold uppercase tracking-[0.14em] active:scale-[0.98] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin text-accent" /> : <Upload className="size-4 text-accent" strokeWidth={1.8} />}
        Upload from device
      </button>

      {state.status !== "IDLE" ? (
        <div className="mt-2 rounded-lg border border-border bg-surface px-3 py-2 text-[11px]" role="status">
          {state.status === "UPLOADING" ? (
            <>
              <p className="flex justify-between"><span className="truncate">Uploading {state.name}</span><span className="tabular-nums text-accent">{state.progress}%</span></p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full bg-gradient-brand transition-all" style={{ width: `${state.progress}%` }} />
              </div>
            </>
          ) : state.status === "SELECTED" ? (
            <p className="truncate">Preparing {state.name}…</p>
          ) : state.status === "PROCESSING" ? (
            <p className="truncate">Saving {state.name}…</p>
          ) : state.status === "READY" ? (
            <p className="flex items-center gap-1.5 text-accent"><Check className="size-3.5" /> {state.asset.name} is ready</p>
          ) : (
            <p className="flex items-center gap-1.5 text-destructive"><AlertCircle className="size-3.5" /> {state.error}</p>
          )}
        </div>
      ) : null}

      <p className="mb-3 mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">My media</p>
      {loadError ? <p className="text-[11px] text-destructive">{loadError}</p> : null}
      {assets.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">No uploads yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {assets.map((a) => {
            const thumb = thumbs[a.id];
            const isSel = selectedIds.includes(`asset-${a.id}`);
            return (
              <button
                key={a.id}
                onClick={() =>
                  onToggle({
                    id: `asset-${a.id}`,
                    assetId: a.id,
                    title: a.name,
                    seconds: Math.max(3, Math.round(Number(a.duration ?? 5))),
                    track: trackFor(a),
                    ...(thumb ? { image: thumb } : {}),
                  })
                }
                className={cn(
                  "overflow-hidden rounded-xl border text-left active:scale-[0.98]",
                  isSel ? "border-accent shadow-glow-sm" : "border-border",
                )}
              >
                <div className="relative aspect-video w-full bg-surface-2">
                  {thumb ? (
                    <img src={thumb} alt={a.name} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center"><Music2 className="size-6 text-muted-foreground" /></span>
                  )}
                  {a.duration ? (
                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/75 px-1.5 py-0.5 text-[9px] font-semibold tabular-nums">
                      {formatDuration(Number(a.duration))}
                    </span>
                  ) : null}
                  {isSel ? (
                    <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-md bg-accent text-background"><Check className="size-3.5" strokeWidth={3} /></span>
                  ) : null}
                </div>
                <p className="truncate px-2 py-1.5 text-[11px] font-semibold">{a.name}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
