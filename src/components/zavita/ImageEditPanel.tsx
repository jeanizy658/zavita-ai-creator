import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Download, ImagePlus, Loader2, RefreshCw, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { saveGeneratedImage } from "@/lib/image-save.functions";
import { appendAssets, attachAssetToProject, createJob, listAssets, listProjects, updateJob, uploadAsset, type AiJob, type Asset, type Project } from "@/lib/data";
import { signedUrl } from "@/lib/storage";
import { streamImage } from "@/lib/stream-image";
import { useStudio } from "@/lib/studio-store";
import { buildEditPrompt, editConflict, EDIT_CATEGORIES, EDIT_OPTIONS, EDIT_SOURCE_MAX_BYTES, EDIT_SOURCE_MIMES, EDIT_ZONES, toggleOption, type EditOptionId, type EditZone } from "@/lib/image-edit-settings";
import { cn } from "@/lib/utils";

const label = "text-[11px] font-bold uppercase text-muted-foreground";

export function ImageEditPanel({ userId, onNavigateEditor }: { userId: string; onNavigateEditor: () => void }) {
  const saveImage = useServerFn(saveGeneratedImage);
  const studio = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const [library, setLibrary] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [source, setSource] = useState<Asset | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [options, setOptions] = useState<EditOptionId[]>([]);
  const [instructions, setInstructions] = useState("");
  const [preserve, setPreserve] = useState(true);
  const [zone, setZone] = useState<EditZone>("auto");
  const [status, setStatus] = useState<"idle" | "uploading" | "editing" | "saving" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [final, setFinal] = useState(false);
  const [resultAsset, setResultAsset] = useState<Asset | null>(null);
  const [job, setJob] = useState<AiJob | null>(null);
  const [compare, setCompare] = useState(50);
  const busy = status === "uploading" || status === "editing" || status === "saving";

  const refresh = async () => {
    const [a, p] = await Promise.all([listAssets(), listProjects()]);
    const imgs = a.filter((x) => EDIT_SOURCE_MIMES.includes(x.mime_type as (typeof EDIT_SOURCE_MIMES)[number]));
    setLibrary(imgs); setProjects(p);
    const t = await Promise.all(imgs.slice(0, 40).map(async (x) => [x.id, await signedUrl(x.thumbnail_url ?? x.storage_path)] as const));
    setThumbs(Object.fromEntries(t.filter((e) => e[1]) as [string, string][]));
  };
  useEffect(() => { void refresh().catch((e) => setError(e.message)); }, [userId]);

  const pick = async (a: Asset) => {
    if (busy) return;
    const url = await signedUrl(a.storage_path);
    if (!url) { setError("Impossible d'ouvrir cette image."); return; }
    setSource(a); setSourceUrl(url); setResult(null); setResultAsset(null); setError(null); setNotice(null); setStatus("idle");
  };
  const importFile = async (file: File) => {
    setError(null);
    if (!EDIT_SOURCE_MIMES.includes(file.type as (typeof EDIT_SOURCE_MIMES)[number])) { setError("Format non pris en charge. Utilisez JPEG, PNG ou WebP."); return; }
    if (file.size > EDIT_SOURCE_MAX_BYTES) { setError("Image trop lourde (10 Mo maximum pour l'édition)."); return; }
    setStatus("uploading");
    try {
      const a = await uploadAsset({ userId, projectId: studio.projectId ?? null, file, assetType: "PHOTO", onState: () => {} });
      await refresh(); setStatus("idle"); await pick(a);
    } catch (e) { setStatus("error"); setError(e instanceof Error ? e.message : "Import échoué."); }
  };

  const input = { options, instructions: instructions.trim(), preserve, zone };
  const conflict = editConflict(input);

  const apply = async () => {
    if (lock.current || !source) return;
    if (conflict) { setError(conflict); return; }
    lock.current = true; setError(null); setNotice(null); setResult(null); setResultAsset(null); setFinal(false); setStatus("editing");
    let edit: AiJob | null = null; let generated: string | null = null;
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error("Session expirée. Reconnectez-vous.");
      edit = await createJob({ user_id: userId, project_id: source.project_id, type: "editImage", input: { ...input, sourceAssetId: source.id }, status: "QUEUED" });
      setJob(edit);
      await streamImage("/api/edit-image", { ...input, jobId: edit.id, sourceAssetId: source.id }, (url, isFinal) => { setResult(url); setFinal(isFinal); if (isFinal) generated = url; }, undefined, { Authorization: `Bearer ${token}` });
      if (!generated) throw new Error("L'édition s'est terminée sans image finale.");
      await save(generated, edit);
    } catch (e) {
      const m = e instanceof Error ? e.message : "L'édition a échoué.";
      setStatus("error"); setError(generated ? `Image modifiée, mais l'enregistrement a échoué : ${m}` : m);
      if (edit && !generated) { await updateJob(edit.id, { status: "FAILED", error: m }).catch(() => {}); setResult(null); }
    } finally { lock.current = false; }
  };
  const save = async (dataUrl: string, edit: AiJob) => {
    setStatus("saving");
    const a = await saveImage({ data: { jobId: edit.id, dataUrl } });
    setResultAsset(a); setStatus("ready"); setNotice("Résultat enregistré comme nouvelle image dans votre bibliothèque. L'original est intact.");
    void refresh().catch(() => {});
  };
  const download = async () => {
    if (!resultAsset) return;
    const url = await signedUrl(resultAsset.storage_path); if (!url) return setError("Téléchargement indisponible.");
    const blob = await (await fetch(url)).blob(); const l = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = l; a.download = resultAsset.name; a.click(); setTimeout(() => URL.revokeObjectURL(l), 1000);
  };
  const toProject = async (editor: boolean) => {
    if (!resultAsset || lock.current) return; lock.current = true; setError(null);
    try {
      const id = studio.projectId ?? await studio.ensureProject();
      await attachAssetToProject(resultAsset.id, id);
      if (job) await updateJob(job.id, { project_id: id });
      if (editor) { await appendAssets(userId, id, [{ assetId: resultAsset.id, track: "AI_VISUAL", duration: 5, label: resultAsset.name }]); await studio.openProject(id); onNavigateEditor(); }
      else setNotice("Résultat ajouté au projet.");
    } catch (e) { setError(e instanceof Error ? e.message : "Action échouée."); } finally { lock.current = false; }
  };

  const projectName = (id: string | null) => projects.find((p) => p.id === id)?.title ?? "Bibliothèque";

  return <main className="mx-auto grid w-full max-w-[1000px] gap-6 px-4 pt-5 md:grid-cols-2">
    <section className="min-w-0">
      <p className={label}>Image source</p>
      <input ref={fileRef} type="file" accept={EDIT_SOURCE_MIMES.join(",")} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void importFile(f); }} />
      <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="mt-2 w-full rounded-xl">{status === "uploading" ? <Loader2 className="animate-spin" /> : <Upload />}{source ? "Remplacer par une image de l'appareil" : "Importer depuis l'appareil"}</Button>
      <p className="mt-3 text-[11px] text-muted-foreground">Ou choisissez dans votre bibliothèque et vos projets :</p>
      {library.length === 0 ? <p className="mt-1 text-[12px] text-muted-foreground">Aucune image JPEG/PNG/WebP enregistrée.</p> :
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">{library.map((a) => <button key={a.id} type="button" disabled={busy} onClick={() => void pick(a)} aria-pressed={source?.id === a.id} title={`${a.name} · ${projectName(a.project_id)}`} className={cn("relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-surface", source?.id === a.id ? "border-accent" : "border-border")}>{thumbs[a.id] ? <img src={thumbs[a.id]} alt={a.name} className="size-full object-cover" /> : <ImagePlus className="m-auto" />}<span className="absolute inset-x-0 bottom-0 truncate bg-background/80 px-1 text-[8px]">{projectName(a.project_id)}</span></button>)}</div>}

      {source && <>
        <h2 className="mt-5 text-sm font-bold">MODIFICATIONS VISUELLES</h2>
        <p className="text-[12px] text-muted-foreground">Sélectionnez les éléments que vous souhaitez ajouter ou modifier sur votre image.</p>
        {EDIT_CATEGORIES.map((c) => <div key={c.id} className="mt-3">
          <p className={label}>{c.label}{c.single && " · un seul choix"}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">{(Object.keys(EDIT_OPTIONS) as EditOptionId[]).filter((id) => EDIT_OPTIONS[id].category === c.id).map((id) => { const on = options.includes(id); return <Button key={id} type="button" variant="outline" size="sm" disabled={busy} aria-pressed={on} onClick={() => setOptions((s) => toggleOption(s, id))} className={cn("rounded-full text-[12px]", on && "border-accent bg-accent/10 text-accent")}>{on && <Check />}{EDIT_OPTIONS[id].label}</Button>; })}</div>
        </div>)}
        {options.includes("car") || options.includes("inStore") || options.includes("mannequin") ? <p className="mt-2 text-[11px] text-muted-foreground">Cette option modifie une partie plus large de l'image (décor ou composition).</p> : null}

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <input type="checkbox" checked={preserve} disabled={busy} onChange={(e) => setPreserve(e.target.checked)} className="mt-1 accent-[var(--color-accent)]" />
          <span><span className="block text-[13px] font-semibold">Préserver le visage et la morphologie</span><span className="block text-[11px] text-muted-foreground">Conservez autant que possible le visage, les traits distinctifs, la morphologie et la pose originale tout en appliquant les modifications sélectionnées. Non garanti : l'IA suit une consigne, pas un masque.</span></span>
        </label>

        <label htmlFor="edit-zone" className={cn(label, "mt-4 block")}>Zone à modifier</label>
        <select id="edit-zone" value={zone} disabled={busy} onChange={(e) => setZone(e.target.value as EditZone)} className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-[13px]">{(Object.keys(EDIT_ZONES) as EditZone[]).map((z) => <option key={z} value={z}>{EDIT_ZONES[z].label}</option>)}</select>
        <p className="mt-1 text-[10px] text-muted-foreground">Guidage par instruction. Le moteur actuel n'accepte pas de masque peint : pas de zone personnalisée.</p>

        <label htmlFor="edit-instr" className={cn(label, "mt-4 block")}>Instructions complémentaires</label>
        <textarea id="edit-instr" value={instructions} disabled={busy} maxLength={2000} rows={3} onChange={(e) => setInstructions(e.target.value)} placeholder="Ajoute des lunettes noires élégantes…" className="mt-2 w-full rounded-xl border border-border bg-surface p-3 text-[13px] outline-none focus:border-accent" />
        <p className="text-[10px] text-muted-foreground">Vos instructions priment sur les options en cas de contradiction.</p>

        <Button disabled={busy || Boolean(conflict)} onClick={() => void apply()} className="mt-4 h-12 w-full rounded-xl bg-gradient-brand text-primary-foreground">{busy ? <Loader2 className="animate-spin" /> : <Wand2 />}{status === "editing" ? "Modification en cours…" : status === "saving" ? "Enregistrement…" : "Appliquer les modifications"}</Button>
        {conflict && !busy && <p className="mt-2 text-[11px] text-muted-foreground">{conflict}</p>}
        <details className="mt-2 text-[10px] text-muted-foreground"><summary>Instruction envoyée au moteur</summary><pre className="whitespace-pre-wrap">{buildEditPrompt(input)}</pre></details>
      </>}
      {error && <p role="alert" className="mt-3 break-words text-[12px] text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-[12px] text-accent">{notice}</p>}
      {status === "error" && result && final && job && !resultAsset && <Button variant="outline" className="mt-2" onClick={() => void save(result, job).catch((e) => { setStatus("error"); setError(e.message); })}>Réessayer l'enregistrement — sans nouvelle édition</Button>}
    </section>

    <section className="min-w-0">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
        {!sourceUrl && <ImagePlus className="size-10 text-muted-foreground" />}
        {sourceUrl && <img src={sourceUrl} alt="Image originale" className="absolute inset-0 size-full object-contain" />}
        {result && <img src={result} alt="Image modifiée" style={final ? { clipPath: `inset(0 0 0 ${compare}%)` } : undefined} className={cn("absolute inset-0 size-full object-contain", !final && "blur-2xl")} />}
        {result && final && <span className="absolute top-0 h-full w-0.5 bg-accent" style={{ left: `${compare}%` }} />}
        {result && final && <><span className="absolute left-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px]">AVANT</span><span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-[10px]">APRÈS</span></>}
        {busy && status !== "uploading" && <span role="status" className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-[11px]"><Loader2 className="size-3 animate-spin" />{status === "saving" ? "Enregistrement" : "Édition réelle en cours"}</span>}
      </div>
      {result && final && <input type="range" min={0} max={100} value={compare} onChange={(e) => setCompare(Number(e.target.value))} aria-label="Comparer avant / après" className="mt-3 w-full accent-[var(--color-accent)]" />}
      {resultAsset && <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => void download()}><Download />Télécharger</Button>
        <Button variant="outline" disabled={busy} onClick={() => { setResult(null); setResultAsset(null); setStatus("idle"); setNotice(null); }}><RefreshCw />Autres options</Button>
        <Button variant="outline" onClick={() => void toProject(false)}>Enregistrer au projet</Button>
        <Button onClick={() => void toProject(true)} className="bg-gradient-brand"><ImagePlus />Ajouter à l'éditeur</Button>
      </div>}
    </section>
  </main>;
}
