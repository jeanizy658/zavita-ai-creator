import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft, Images, RefreshCw, Sliders, Timer, Zap, ZoomIn, Mic, Download, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToProjectSheet } from "@/components/zavita/AddToProjectSheet";
import { useCamera } from "@/hooks/use-camera";
import { useAuth } from "@/lib/auth";
import { useStudio } from "@/lib/studio-store";
import { appendAssets, uploadAsset, type Asset, type UploadState } from "@/lib/data";
import { assetDuration } from "@/lib/media-workflow";
import { formatBytes, formatDuration } from "@/lib/media";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/camera")({
  head: () => ({ meta: [
    { title: "AI Camera — ZAVITA" },
    { name: "description", content: "Capture and preview real device video, or import media into your ZAVITA project." },
    { property: "og:title", content: "AI Camera — ZAVITA" },
    { property: "og:description", content: "Record real device video and import your own media." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: CameraScreen,
});

function CameraScreen() {
  const camera = useCamera();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ensureProject, refreshProject } = useStudio();
  const [timer, setTimer] = useState(0);
  const [audio, setAudio] = useState(true);
  const [settings, setSettings] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ status: "IDLE" });
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const savedAsset = useRef<Asset | null>(null);
  const inserted = useRef(false);
  const recording = camera.state === "RECORDING";
  const ready = camera.state === "READY";
  const blocked = recording || camera.countdown > 0 || saving || ["REQUESTING_PERMISSION", "STOPPING", "PROCESSING"].includes(camera.state);
  const reset = () => { savedAsset.current = null; inserted.current = false; setUpload({ status: "IDLE" }); };
  const useVideo = async () => {
    if (!camera.clip || lock.current) return;
    if (!user) { camera.setError("Sign in to save this recording. Download it before leaving this page; unsaved recordings do not survive refresh."); return; }
    lock.current = true; setSaving(true);
    try {
      const id = await ensureProject();
      let asset = savedAsset.current;
      if (!asset) {
        asset = await uploadAsset({ userId: user.id, projectId: id, file: camera.clip.file, onState: setUpload });
        savedAsset.current = asset;
      }
      if (!inserted.current) {
        await appendAssets(user.id, id, [{ assetId: asset.id, track: "MAIN", duration: assetDuration(asset.type, asset.duration), label: asset.name }]);
        inserted.current = true;
      }
      await refreshProject();
      await navigate({ to: "/editor" });
    } catch (e) { camera.setError(e instanceof Error ? e.message : "Could not save the recording. Please retry."); }
    finally { lock.current = false; setSaving(false); }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background" data-camera-state={camera.state}>
      <video ref={camera.videoRef} autoPlay muted playsInline className={cn("absolute inset-0 size-full object-cover", camera.facing === "user" && "-scale-x-100", !ready && !recording && "invisible")} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-background/10 to-background/90" />
      <header className="relative z-10 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
        <Button asChild variant="outline" size="icon" className="shrink-0 rounded-full bg-background/60"><Link to="/home" aria-label="Back to home"><ChevronLeft /></Link></Button>
        <p className="flex-1 text-center text-[11px] font-bold uppercase tracking-[0.22em]">AI Camera</p>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-bold tabular-nums">
          {recording && <span className="size-1.5 animate-pulse rounded-full bg-destructive" />}{formatDuration(camera.elapsed) === "--:--" ? "00:00" : formatDuration(camera.elapsed)}
        </span>
      </header>
      <div className="no-scrollbar relative z-10 mt-4 flex gap-2 overflow-x-auto px-4">
        {["AUTO LIGHT", "SKIN", "HDR", "COLOR", "STABILIZATION"].map((t) => <Button key={t} variant="outline" size="sm" title={`${t} processing is not configured`} onClick={() => camera.setError(`${t} processing is not configured. Your recording remains unmodified.`)} className="shrink-0 rounded-full bg-background/50 text-[10px] text-muted-foreground">{t} · OFF</Button>)}
      </div>
      {!ready && !recording && !camera.clip && <div className="relative z-10 mx-6 mt-12 border border-border bg-background/80 p-4 text-center" role="status">
        <p className="text-[12px] font-bold uppercase">{camera.state === "REQUESTING_PERMISSION" ? "Requesting camera access…" : camera.state === "ERROR" ? "Camera unavailable" : "Camera inactive"}</p>
        <Button disabled={blocked} onClick={() => void camera.activate()} className="mt-3 bg-gradient-brand text-primary-foreground">{camera.state === "ERROR" ? "Retry camera" : "Activate camera"}</Button>
        <Button variant="outline" onClick={() => setGallery(true)} className="ml-2 mt-3"><Images />Import</Button>
      </div>}
      {camera.error && <div className="relative z-20 mx-4 mt-3 border border-destructive bg-background/95 p-3 text-[12px]" role="alert">{camera.error}</div>}
      {camera.countdown > 0 && <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-7xl font-bold" role="status">{camera.countdown}</div>}
      {!camera.clip && <>
        <div className="absolute left-4 top-[45%] z-10 flex flex-col gap-2 text-[9px] uppercase"><span className="rounded-lg border border-border bg-background/60 px-2 py-1">LIGHT: DEVICE</span><span className="rounded-lg border border-border bg-background/60 px-2 py-1">SKIN: NATURAL</span></div>
        <div className="absolute right-4 top-[32%] z-10 flex flex-col gap-1 rounded-2xl border border-border bg-background/60 p-1.5">
          <Panel icon={RefreshCw} label="Flip" disabled={!ready || blocked || !camera.canFlip} title={camera.canFlip ? "Switch camera" : "Only one camera is available"} onClick={() => void camera.flip()} />
          <Panel icon={Zap} label="Flash" disabled={!ready || blocked} title={camera.capabilities.torch ? "Camera torch" : "Flash not supported"} active={camera.torch} onClick={() => void camera.apply("torch", !camera.torch)} />
          <Panel icon={Timer} label={timer ? `${timer}s` : "Timer"} disabled={blocked} active={timer > 0} onClick={() => setTimer((t) => t === 0 ? 3 : t === 3 ? 10 : 0)} />
          <Panel icon={ZoomIn} label={`${camera.zoom.toFixed(1)}x`} disabled={!ready || blocked} title={camera.capabilities.zoom ? "Camera zoom" : "Zoom not supported"} onClick={() => { const range = camera.capabilities.zoom; void camera.apply("zoom", range ? camera.zoom >= range.max ? range.min : Math.min(range.max, camera.zoom + Math.max(range.step, 0.5)) : 1); }} />
        </div>
      </>}
      {camera.clip && <div className="relative z-10 mx-auto mt-5 max-w-[560px] px-4">
        <video src={camera.clip.url} controls playsInline preload="metadata" className="aspect-video w-full rounded-xl border border-border bg-surface" aria-label="Recorded video preview" />
        <p className="mt-2 text-[11px] text-muted-foreground">Temporary recording · {formatDuration(camera.clip.duration)} · {formatBytes(camera.clip.file.size)} · {camera.clip.file.type} · {camera.clip.hasAudio ? "Audio captured" : "No audio"}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">Unsaved recording — lost on refresh.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" disabled={saving} onClick={() => { reset(); camera.discard(); }}>Discard</Button>
          <Button variant="outline" disabled={saving} onClick={() => { reset(); void camera.retake(); }}><RefreshCw />Retake</Button>
          <Button asChild variant="outline"><a href={camera.clip.url} download={camera.clip.file.name}><Download />Download</a></Button>
          <Button disabled={saving} onClick={() => void useVideo()} className="bg-gradient-brand text-primary-foreground"><Wand2 />{saving ? "Saving…" : "Use video"}</Button>
        </div>
        {!user && <Button asChild variant="link"><Link to="/auth">Sign in to save</Link></Button>}
        {upload.status !== "IDLE" && <p className="mt-2 text-[12px]" role="status">{upload.status === "UPLOADING" ? `Uploading ${upload.progress}%` : upload.status === "FAILED" ? upload.error : upload.status === "READY" ? "File uploaded — preparing project" : "Preparing media…"}</p>}
      </div>}
      {!camera.clip && <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <p className="mx-auto mb-5 w-fit rounded-full border border-border bg-background/60 px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground">Original capture · AI processing unavailable</p>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" disabled={blocked} aria-label="Gallery" onClick={() => setGallery(true)} className="size-12 rounded-xl bg-background/60"><Images /></Button>
          <Button variant="ghost" disabled={(!ready && !recording) || camera.countdown > 0 || saving} onClick={() => recording ? camera.stop() : void camera.start(timer, audio)} aria-label={recording ? "Stop recording" : "Start recording"} className="relative size-[78px] rounded-full border-[3px] border-foreground/90 p-0">
            <span className={cn("bg-destructive", recording ? "size-7 rounded-md" : "size-[60px] rounded-full")} />
          </Button>
          <Button variant="outline" size="icon" disabled={blocked} aria-label="Recording settings" onClick={() => setSettings((v) => !v)} className="size-12 rounded-xl bg-background/60"><Sliders /></Button>
        </div>
        {settings && <div className="mt-3 rounded-xl border border-border bg-background/90 p-3"><Button variant="outline" aria-pressed={audio} onClick={() => setAudio((a) => !a)}><Mic />Audio {audio ? "ON" : "OFF"}</Button></div>}
        <p className="mt-3 text-center text-[10px] uppercase text-muted-foreground">{camera.state.replaceAll("_", " ")}</p>
      </div>}
      <AddToProjectSheet open={gallery} onClose={() => setGallery(false)} />
    </div>
  );
}
function Panel({ icon: Icon, label, active, disabled, title, onClick }: { icon: typeof Zap; label: string; active?: boolean; disabled?: boolean; title?: string; onClick: () => void }) {
  return <Button variant="ghost" disabled={disabled} title={title} aria-label={label} onClick={onClick} className={cn("h-auto w-14 flex-col gap-0.5 rounded-xl px-1 py-2 text-[9px]", active ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground")}><Icon />{label}</Button>;
}
