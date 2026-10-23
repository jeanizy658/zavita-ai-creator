import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Check, Film, Image as ImageIcon, Loader2, Music2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStudio } from "@/lib/studio-store";
import { listAssets, uploadAsset, type Asset, type AssetType, type UploadState } from "@/lib/data";
import { formatDuration } from "@/lib/media";
import { assetDuration, trackForAsset } from "@/lib/media-workflow";
import { signedUrl } from "@/lib/storage";
import type { TrackId } from "@/lib/studio-store";
export type PickedUpload = { id: string; title: string; seconds: number; image?: string; track: TrackId; assetId: string };

export function MyUploads({ selectedIds, onToggle, category = "VIDEO" }: { selectedIds: string[]; onToggle: (item: PickedUpload) => void; category?: string }) {
  const { user, loading } = useAuth();
  const { ensureProject } = useStudio();
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const identity = useRef(user?.id);
  identity.current = user?.id;
  const [state, setState] = useState<UploadState>({ status: "IDLE" });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState<File[]>([]);
  const [preview, setPreview] = useState<{ asset: Asset; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    const account = user?.id;
    if (!account) return;
    try {
      const rows = await listAssets();
      const entries = await Promise.all(rows.map(async (r) => [r.id, await signedUrl(r.thumbnail_url)] as const));
      if (identity.current !== account) return;
      setAssets(rows); setThumbs(Object.fromEntries(entries.filter((e) => e[1]) as [string, string][])); setError(null);
    } catch (e) { if (identity.current === account) setError(e instanceof Error ? e.message : "Could not load media."); }
  };
  useEffect(() => { setAssets([]); setThumbs({}); setPreview(null); setState({ status: "IDLE" }); setFailed([]); if (user) void refresh(); }, [user?.id]);
  const importFiles = async (files: File[]) => {
    if (!user || lock.current) return;
    lock.current = true; setBusy(true); setFailed([]); setError(null);
    const errors: string[] = []; const retries: File[] = [];
    try {
      const projectId = await ensureProject();
      for (const file of files) {
        try {
          const type = category.replaceAll(" ", "_") as AssetType;
          const override = file.type.startsWith("image/") && ["IMAGE", "LOGO"].includes(type) || file.type.startsWith("audio/") && ["AUDIO", "MUSIC", "VOICE"].includes(type) ? type : undefined;
          await uploadAsset({ userId: user.id, projectId, file, ...(override ? { assetType: override } : {}), onState: setState });
        } catch (e) { retries.push(file); errors.push(`${file.name}: ${e instanceof Error ? e.message : "Import failed."}`); }
      }
      await refresh();
    } catch (e) { retries.push(...files); errors.push(e instanceof Error ? e.message : "Could not select project."); }
    finally { setFailed(retries); if (errors.length) setError(errors.join(" · ")); lock.current = false; setBusy(false); }
  };
  const accept = ["PHOTO", "IMAGE", "LOGO", "AI VISUAL"].includes(category) ? "image/*" : ["AUDIO", "MUSIC", "VOICE"].includes(category) ? "audio/*" : "video/*";
  const filtered = assets.filter((a) => a.type.replaceAll("_", " ") === category || category === "PHOTO" && a.type === "IMAGE");
  if (loading) return <Loader2 className="size-4 animate-spin" />;
  if (!user) return <div className="mb-5 flex items-center gap-3 border border-border p-3"><Upload className="size-5 text-accent" /><p className="flex-1 text-[12px] text-muted-foreground">Sign in to import and save your media.</p><Button asChild size="sm"><Link to="/auth">Sign in</Link></Button></div>;
  return <div className="mb-6">
    <input ref={input} type="file" multiple accept={accept} className="hidden" aria-label="Choose device media" onChange={(e) => { void importFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    <Button variant="outline" disabled={busy} onClick={() => input.current?.click()} className="h-auto w-full rounded-xl border-dashed border-accent/60 bg-surface py-3 text-[11px] font-bold uppercase">{busy ? <Loader2 className="animate-spin" /> : <Upload />}Upload from device</Button>
    {state.status !== "IDLE" && <div className="mt-2 rounded-lg border border-border bg-surface p-3 text-[11px]" role="status">{state.status === "UPLOADING" ? <><p className="flex gap-2"><span className="min-w-0 flex-1 truncate">Uploading {state.name}</span><span>{state.progress}%</span></p><progress value={state.progress} max={100} className="mt-2 h-1 w-full" /></> : state.status === "READY" ? <p className="flex items-center gap-2 text-accent"><Check />{state.asset.name} uploaded</p> : state.status === "FAILED" ? <p className="text-destructive">{state.error}</p> : <p>Preparing {state.name}…</p>}</div>}
    {error && <p className="mt-2 flex items-start gap-2 text-[11px] text-destructive" role="alert"><AlertCircle className="size-4 shrink-0" />{error}</p>}
    {failed.length > 0 && <Button variant="outline" size="sm" disabled={busy} onClick={() => void importFiles(failed)} className="mt-2">Retry failed files</Button>}
    <p className="mb-3 mt-4 text-[11px] font-bold uppercase text-muted-foreground">Recents</p>
    {!filtered.length && <p className="text-[11px] text-muted-foreground">No {category.toLowerCase()} uploads yet.</p>}
    <div className="grid grid-cols-2 gap-3">{filtered.map((a) => {
      const thumb = thumbs[a.id]; const selected = selectedIds.includes(`asset-${a.id}`); const Icon = a.mime_type?.startsWith("video/") ? Film : a.mime_type?.startsWith("image/") ? ImageIcon : Music2;
      return <div key={a.id} className={cn("overflow-hidden rounded-xl border bg-surface", selected ? "border-accent shadow-glow-sm" : "border-border")}>
        <Button variant="ghost" onClick={() => { try { onToggle({ id: `asset-${a.id}`, assetId: a.id, title: a.name, seconds: assetDuration(a.type, a.duration), track: trackForAsset(a.type), ...(thumb ? { image: thumb } : {}) }); } catch (e) { setError(e instanceof Error ? e.message : "Cannot add media."); } }} aria-label={`Select ${a.name}`} aria-pressed={selected} className="h-auto w-full flex-col gap-0 rounded-none p-0">
          <span className="relative flex aspect-video w-full items-center justify-center bg-surface-2">{thumb ? <img src={thumb} alt={a.name} className="size-full object-cover" loading="lazy" /> : <Icon className="size-6 text-muted-foreground" />}{selected && <Check className="absolute right-2 top-2 size-4 text-accent" />}</span>
          <span className="block w-full truncate px-2 py-1.5 text-left text-[11px]">{a.name}</span>
        </Button>
        <div className="flex items-center gap-1 px-2 pb-2"><span className="flex-1 text-[10px] text-muted-foreground">{formatDuration(a.duration)}</span><Button variant="outline" size="sm" className="h-6 px-2 text-[10px]" aria-label={`Preview ${a.name}`} onClick={() => { void signedUrl(a.storage_path ?? a.file_url).then((url) => { if (!url) throw new Error("Cannot open this file. Retry media loading."); setPreview({ asset: a, url }); }).catch((e) => setError(e.message)); }}>Preview</Button></div>
      </div>;
    })}</div>
    {preview && <div className="mt-4 border border-border bg-surface p-3"><div className="flex items-center gap-2"><p className="min-w-0 flex-1 truncate text-[11px]">{preview.asset.name}</p><Button variant="ghost" size="sm" onClick={() => setPreview(null)}>Close preview</Button></div>{preview.asset.mime_type?.startsWith("audio/") ? <audio src={preview.url} controls preload="metadata" className="mt-2 w-full" /> : preview.asset.mime_type?.startsWith("video/") ? <video src={preview.url} controls playsInline preload="metadata" className="mt-2 aspect-video w-full" /> : <img src={preview.url} alt={preview.asset.name} className="mt-2 max-h-64 w-full object-contain" />}</div>}
  </div>;
}
