import { useServerFn } from "@tanstack/react-start";
import { saveGeneratedImage } from "@/lib/image-save.functions";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Download, Expand, ImagePlus, Loader2, RefreshCw, Sparkles, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { useAuth } from "@/lib/auth";
import { useStudio } from "@/lib/studio-store";
import { supabase } from "@/integrations/supabase/client";
import { appendAssets, attachAssetToProject, createJob, createProject, deleteAsset, listAssets, listJobs, listProjects, updateJob, uploadAsset, type AiJob, type Asset, type Project } from "@/lib/data";
import { signedUrl, removeFromStorage } from "@/lib/storage";
import { streamImage } from "@/lib/stream-image";
import { IMAGE_RATIOS, IMAGE_STYLES, imageInput } from "@/lib/image-settings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-image")({ head: () => ({ meta: [
  { title: "AI Image Studio — ZAVITA" }, { name: "description", content: "Generate real AI images, save them privately and add them to your ZAVITA projects." },
  { property: "og:title", content: "AI Image Studio — ZAVITA" }, { property: "og:description", content: "Create images from your prompt and keep them in your projects." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ImageStudio });

function ImageStudio() {
  const { user, loading } = useAuth();
  const saveImage = useServerFn(saveGeneratedImage);
  const studio = useStudio();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof IMAGE_STYLES)[number]>("Realistic Photography");
  const [ratio, setRatio] = useState<(typeof IMAGE_RATIOS)[number]>("1:1");
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState("");
  const [history, setHistory] = useState<AiJob[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [image, setImage] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [job, setJob] = useState<AiJob | null>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "saving" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const lock = useRef(false);
  const saved = useRef<Asset | null>(null);
  const busy = status === "generating" || status === "saving";
  const refresh = async () => {
    if (!user) return;
    const [p, j, a] = await Promise.all([listProjects(), listJobs(), listAssets()]);
    const images = a.filter((item) => item.type === "AI_VISUAL");
    const thumbs = await Promise.all(images.map(async (item) => [item.id, await signedUrl(item.thumbnail_url ?? item.storage_path)] as const));
    setProjects(p); setHistory(j.filter((item) => item.type === "generateImage")); setAssets(images);
    setThumbnails(Object.fromEntries(thumbs.filter((entry) => entry[1]) as [string, string][]));
  };
  useEffect(() => { setImage(null); setAsset(null); setJob(null); setHistory([]); setAssets([]); setStatus("idle"); saved.current = null; if (user) void refresh().catch((e) => setError(e.message)); }, [user?.id]);
  useEffect(() => { if (studio.projectId) setProject(studio.projectId); }, [studio.projectId]);

  const saveGenerated = async (dataUrl: string, generation: AiJob) => {
    if (!user) throw new Error("Sign in to save this image.");
    setStatus("saving");
    const realAsset = await saveImage({ data: { jobId: generation.id, dataUrl } });
    saved.current = realAsset;
    const completed = { ...generation, status: "COMPLETED" as const, output: { assetId: realAsset.id, storagePath: realAsset.storage_path } };
    const url = await signedUrl(realAsset.storage_path);
    if (!url) throw new Error("Image generated and saved, but preview is unavailable. Reopen it from history.");
    setAsset(realAsset); setJob(completed); setImage(url); setFinal(true); setStatus("ready");
    await refresh().catch((e) => setError("Image saved, but history could not refresh: " + e.message));
  };
  const generate = async () => {
    if (lock.current || !user) return;
    const parsed = imageInput.safeParse({ prompt, style, ratio });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a prompt."); return; }
    lock.current = true; saved.current = null; setError(null); setNotice(null); setImage(null); setAsset(null); setFinal(false); setStatus("generating");
    let generation: AiJob | null = null;
    let generated: string | null = null;
    try {
      const session = await supabase.auth.getSession(); const token = session.data.session?.access_token;
      if (!token) throw new Error("Your session expired. Sign in again.");
      generation = await createJob({ user_id: user.id, project_id: project || null, type: "generateImage", input: { ...parsed.data }, status: "QUEUED" });
      setJob(generation);
      await streamImage("/api/generate-image", { ...parsed.data, jobId: generation.id }, (url, isFinal) => { setImage(url); setFinal(isFinal); if (isFinal) generated = url; }, undefined, { Authorization: `Bearer ${token}` });
      if (!generated) throw new Error("The generation ended without a final image.");
      await saveGenerated(generated, generation);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Image generation failed.";
      const storedAsset = saved.current as Asset | null;
      setError(generated ? `Generation succeeded, but saving failed: ${message}` : message); setStatus("error");
      if (generation) {
        try { await updateJob(generation.id, { status: "FAILED", error: message, ...(generated ? { output: { generated: true, saved: Boolean(storedAsset), ...(storedAsset ? { assetId: storedAsset.id, storagePath: storedAsset.storage_path } : {}) } } : {}) }); } catch { /* original error remains visible */ }
      }
      if (!generated) { setImage(null); setFinal(false); }
      void refresh().catch(() => {});
    } finally { lock.current = false; }
  };
  const action = async (kind: "project" | "editor" | "delete" | "download") => {
    if (!asset || actionBusy || lock.current || !user) return;
    lock.current = true;
    setActionBusy(true); setError(null); setNotice(null);
    try {
      if (kind === "download") {
        const url = await signedUrl(asset.storage_path); if (!url) throw new Error("Image unavailable.");
        const res = await fetch(url); if (!res.ok) throw new Error("Download failed. Retry.");
        const local = URL.createObjectURL(await res.blob()); const link = document.createElement("a"); link.href = local; link.download = asset.name; link.click(); setTimeout(() => URL.revokeObjectURL(local), 1000);
      } else if (kind === "delete") {
        if (!window.confirm("Delete this generated image and its timeline clips?")) return;
        const { error: clipsError } = await supabase.from("timeline_clips").delete().eq("asset_id", asset.id); if (clipsError) throw new Error(clipsError.message);
        if (asset.thumbnail_url) await removeFromStorage(asset.thumbnail_url);
        if (asset.storage_path) await removeFromStorage(asset.storage_path);
        await deleteAsset(asset.id); setImage(null); setAsset(null); setJob(null); saved.current = null; setStatus("idle"); await refresh(); await studio.refreshProject();
      } else {
        const id = project || await studio.ensureProject();
        await attachAssetToProject(asset.id, id);
        if (job) await updateJob(job.id, { project_id: id });
        setAsset({ ...asset, project_id: id }); setProject(id);
        if (kind === "editor") {
          await appendAssets(user.id, id, [{ assetId: asset.id, track: "AI_VISUAL", duration: 5, label: asset.name }]);
          await studio.openProject(id); await navigate({ to: "/editor" });
        } else { setNotice("Image saved to project"); await refresh(); }
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Action failed. Retry."); }
    finally { lock.current = false; setActionBusy(false); }
  };
  const reopen = async (row: AiJob) => {
    if (busy) return;
    const input = row.input as Record<string, unknown>; const output = row.output as Record<string, unknown> | null;
    setPrompt(String(input["prompt"] ?? ""));
    if (IMAGE_STYLES.includes(input["style"] as typeof style)) setStyle(input["style"] as typeof style);
    if (IMAGE_RATIOS.includes(input["ratio"] as typeof ratio)) setRatio(input["ratio"] as typeof ratio);
    setProject(row.project_id ?? ""); setJob(row); setError(row.error); setNotice(null); setImage(null); setAsset(null); saved.current = null;
    const item = assets.find((a) => a.id === output?.["assetId"]);
    if (!item) { setStatus("idle"); return; }
    const url = await signedUrl(item.storage_path);
    if (!url) throw new Error("Could not reopen this saved image.");
    setImage(url); setAsset(item); setFinal(true); setStatus("ready"); saved.current = item;
  };

  return <div className="min-h-[100dvh] bg-background pb-10"><ModuleHeader title="AI Image Studio" subtitle="Create a visual" />
    <main className="mx-auto grid w-full max-w-[1000px] gap-6 px-4 pt-5 md:grid-cols-2">
      <section className="min-w-0">
        <h1 className="mb-5 text-xl font-bold">AI <span className="text-gradient">Image Studio</span></h1>
        <label htmlFor="image-prompt" className="text-[11px] font-bold uppercase text-muted-foreground">Prompt</label>
        <textarea id="image-prompt" value={prompt} disabled={busy} onChange={(e) => setPrompt(e.target.value)} maxLength={4000} rows={5} placeholder="A cinematic photograph of a tropical island at sunrise, soft light, vivid detail…" className="mt-2 w-full resize-y rounded-xl border border-border bg-surface p-3 text-[13px] outline-none focus:border-accent" />
        <p className="mt-1 text-right text-[10px] tabular-nums text-muted-foreground">{prompt.length} / 4000</p>
        <label htmlFor="image-style" className="mt-4 block text-[11px] font-bold uppercase text-muted-foreground">Style</label>
        <select id="image-style" value={style} disabled={busy} onChange={(e) => setStyle(e.target.value as typeof style)} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[13px]">{IMAGE_STYLES.map((s) => <option key={s}>{s}</option>)}</select>
        <p className="mb-2 mt-5 text-[11px] font-bold uppercase text-muted-foreground">Aspect ratio</p>
        <div className="grid grid-cols-4 gap-2">{IMAGE_RATIOS.map((r) => <Button key={r} variant="outline" disabled={busy} aria-pressed={r === ratio} onClick={() => setRatio(r)} className={cn("rounded-xl text-[12px]", r === ratio && "border-accent bg-accent/10 text-accent")}>{r}</Button>)}</div>
        <label htmlFor="image-project" className="mt-5 block text-[11px] font-bold uppercase text-muted-foreground">Project</label>
        <select id="image-project" value={project} disabled={busy || actionBusy} onChange={(e) => setProject(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[13px]"><option value="">Media library</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        {user && <Button variant="link" disabled={busy || actionBusy} onClick={() => { const title = window.prompt("Project name"); if (title?.trim()) void createProject(user.id, title.trim()).then(async (p) => { setProject(p.id); await refresh(); }).catch((e) => setError(e.message)); }}>New project</Button>}
        {!loading && !user ? <Button asChild className="mt-5 w-full bg-gradient-brand"><Link to="/auth">Sign in to generate</Link></Button> : <Button disabled={busy || actionBusy || loading} onClick={() => void generate()} className="mt-5 h-12 w-full rounded-xl bg-gradient-brand text-primary-foreground">{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{status === "saving" ? "Saving image…" : status === "generating" ? "Generating…" : "Generate image"}</Button>}
        {error && <p role="alert" className="mt-3 break-words text-[12px] text-destructive">{error}</p>}{notice && <p role="status" className="mt-3 text-[12px] text-accent">{notice}</p>}
        {status === "error" && image?.startsWith("data:") && final && job && <Button variant="outline" className="mt-3" onClick={() => { if (lock.current) return; lock.current = true; void saveGenerated(image, job).catch((e) => { setError(e.message); setStatus("error"); }).finally(() => { lock.current = false; }); }}>Retry saving — no regeneration</Button>}
      </section>
      <section className="min-w-0">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
          {image ? <img src={image} alt={prompt || "Generated image"} className={cn("size-full object-contain transition-[filter]", !final && "blur-2xl")} /> : <ImagePlus className="size-10 text-muted-foreground" />}
          {busy && <span role="status" className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-[11px]"><Loader2 className="size-3 animate-spin" />{status === "saving" ? "Saving real image" : "Generating image"}</span>}
          {image && final && <Button variant="outline" size="icon" aria-label="Expand image" title="Expand image" onClick={() => setExpanded(true)} className="absolute right-3 top-3 bg-background/80"><Expand /></Button>}
        </div>
        {asset && <><p className="mt-2 flex items-center gap-1 text-[11px] text-accent"><Check className="size-3" />Saved privately</p><div className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" disabled={actionBusy} onClick={() => void action("download")}><Download />Download</Button><Button variant="outline" disabled={busy || actionBusy} onClick={() => void generate()}><RefreshCw />Regenerate</Button><Button variant="outline" disabled={actionBusy} onClick={() => void action("project")}>Save to project</Button><Button disabled={actionBusy} onClick={() => void action("editor")} className="bg-gradient-brand"><ImagePlus />Add to Editor</Button></div><Button variant="ghost" disabled={actionBusy} onClick={() => void action("delete")} className="mt-2 text-destructive"><Trash2 />Delete image</Button></>}
        <h2 className="mb-3 mt-6 text-[11px] font-bold uppercase text-muted-foreground">Generation history</h2>
        {history.length === 0 && <p className="text-[12px] text-muted-foreground">No generations yet.</p>}
        <div className="space-y-2">{history.map((row) => { const input = row.input as Record<string, unknown>; const output = row.output as Record<string, unknown> | null; const thumb = thumbnails[String(output?.["assetId"])]; return <Button key={row.id} variant="outline" disabled={busy} onClick={() => void reopen(row).catch((e) => setError(e.message))} className="h-auto w-full justify-start rounded-xl p-2 text-left"><span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">{thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <ImagePlus />}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12px]">{String(input["prompt"] ?? "Image generation")}</span><span className="block text-[10px] text-muted-foreground">{String(input["style"] ?? "")} · {String(input["ratio"] ?? "")} · {row.status === "QUEUED" ? "CREATED" : row.status}</span></span></Button>; })}</div>
      </section>
    </main>
    {expanded && image && <div role="dialog" aria-label="Image preview" className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-5"><img src={image} alt={prompt || "Generated image"} className="max-h-full max-w-full object-contain" /><Button variant="outline" size="icon" aria-label="Close image preview" onClick={() => setExpanded(false)} className="absolute right-4 top-4"><X /></Button></div>}
  </div>;
}
