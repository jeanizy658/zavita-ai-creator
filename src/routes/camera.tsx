import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { ensureActiveProject, uploadAsset, type UploadState } from "@/lib/data";
import { formatBytes } from "@/lib/media";
import {
  ChevronLeft,
  Images,
  RefreshCw,
  Sliders,
  Sparkles,
  Timer,
  Zap,
  ZoomIn,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import cameraPreview from "@/assets/camera-preview.jpg";
import galleryThumb from "@/assets/proj-business.jpg";

export const Route = createFileRoute("/camera")({
  head: () => ({
    meta: [
      { title: "AI Camera — ZAVITA" },
      {
        name: "description",
        content: "Record with the ZAVITA AI camera: auto light, skin, HDR, color and stabilization.",
      },
      { property: "og:title", content: "AI Camera — ZAVITA" },
      { property: "og:description", content: "Record a video with the ZAVITA AI camera." },
    ],
  }),
  component: CameraScreen,
});

const PRESETS = [
  { name: "Standard", tools: { "AUTO LIGHT": true, SKIN: false, HDR: true, COLOR: false, STABILIZATION: false } },
  { name: "Beauty", tools: { "AUTO LIGHT": true, SKIN: true, HDR: false, COLOR: true, STABILIZATION: false } },
  { name: "Cinema", tools: { "AUTO LIGHT": false, SKIN: false, HDR: true, COLOR: true, STABILIZATION: true } },
] as const satisfies readonly { name: string; tools: Record<string, boolean> }[];

const AI_TOOLS = ["AUTO LIGHT", "SKIN", "HDR", "COLOR", "STABILIZATION"] as const;

function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}

function CameraScreen() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Record<string, boolean>>({
    "AUTO LIGHT": true,
    SKIN: false,
    HDR: true,
    COLOR: false,
    STABILIZATION: false,
  });
  const [recording, setRecording] = useState(false);
  const [frames, setFrames] = useState(0);
  const [hasClip, setHasClip] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [flash, setFlash] = useState(false);
  const [timer, setTimer] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [preset, setPreset] = useState("Standard");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [camState, setCamState] = useState<"requesting" | "live" | "denied" | "unavailable">("requesting");
  const [camError, setCamError] = useState<string | null>(null);
  const [clip, setClip] = useState<{ blob: Blob; url: string } | null>(null);
  const [upload, setUpload] = useState<UploadState>({ status: "IDLE" });

  // Real camera + microphone access, re-requested when flipping lenses.
  useEffect(() => {
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unavailable");
      setCamError(window.isSecureContext ? "This browser does not support camera access." : "Camera requires a secure (HTTPS) connection.");
      return;
    }
    setCamState("requesting");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: flipped ? "environment" : "user" }, audio: true })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamState("live");
        setCamError(null);
      })
      .catch((err: DOMException) => {
        if (cancelled) return;
        const denied = err.name === "NotAllowedError" || err.name === "SecurityError";
        setCamState(denied ? "denied" : "unavailable");
        setCamError(denied ? "Camera and microphone permission was denied. Allow access in your browser settings." : err.name === "NotFoundError" ? "No camera was found on this device." : err.message);
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [flipped]);

  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);

  useEffect(() => {
    if (!recording) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    interval.current = setInterval(() => setFrames((f) => f + 1), 1000 / 25);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [recording]);

  const totalSeconds = Math.floor(frames / 25);
  const timecode = `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}:${pad(frames % 25)}`;

  const toggle = (key: string) => setActive((s) => ({ ...s, [key]: !s[key] }));

  const applyPreset = (name: string, tools: Record<string, boolean>) => {
    setPreset(name);
    setActive((s) => ({ ...s, ...tools }));
    setPresetsOpen(false);
  };

  const onRec = () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = streamRef.current;
    if (!stream || camState !== "live") {
      setCamError(camError ?? "Camera is not available.");
      return;
    }
    const mime = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType.split(";")[0] || "video/webm" });
      setClip({ blob, url: URL.createObjectURL(blob) });
      setHasClip(true);
      setUpload({ status: "IDLE" });
    };
    recorderRef.current = rec;
    rec.start(1000);
    setFrames(0);
    setHasClip(false);
    setRecording(true);
  };

  const editClip = async () => {
    if (!clip) return navigate({ to: "/editor" });
    if (!user) return navigate({ to: "/auth" });
    try {
      const ext = clip.blob.type.includes("mp4") ? "mp4" : "webm";
      const project = await ensureActiveProject(user.id);
      await uploadAsset({ userId: user.id, projectId: project.id, file: clip.blob, filename: `recording-${Date.now()}.${ext}`, onState: setUpload });
      navigate({ to: "/editor" });
    } catch {
      /* upload state shows the error */
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={cn(
          "absolute inset-0 size-full object-cover transition-all duration-500",
          !flipped && "scale-x-[-1]",
          active["COLOR"] && "saturate-150 contrast-110",
          active["SKIN"] && "brightness-105",
          camState !== "live" && "opacity-0",
        )}
        style={{ transform: `${!flipped ? "scaleX(-1) " : ""}scale(${zoom})` }}
      />
      {camState !== "live" ? (
        <div className="absolute inset-x-6 top-1/3 z-20 rounded-2xl border border-border bg-background/80 p-4 text-center backdrop-blur-xl" role="status">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em]">
            {camState === "requesting" ? "Requesting camera access…" : "Camera unavailable"}
          </p>
          {camError ? <p className="mt-1.5 text-[11.5px] text-muted-foreground">{camError}</p> : null}
        </div>
      ) : null}
      <img
        src={cameraPreview}
        alt=""
        aria-hidden="true"
        width={720}
        height={1280}
        className={cn(camState === "live" && "hidden", "opacity-30",
          "absolute inset-0 size-full object-cover transition-all duration-500",
          flipped && "scale-x-[-1]",
          active["COLOR"] && "saturate-150 contrast-110",
          active["SKIN"] && "brightness-105",
        )}
        style={{ transform: `${flipped ? "scaleX(-1) " : ""}scale(${zoom})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/10 to-background/90" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+14px)]">
        <Link
          to="/home"
          aria-label="Back to home"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/60 backdrop-blur-md active:scale-95"
        >
          <ChevronLeft className="size-5 text-foreground" strokeWidth={1.7} />
        </Link>
        <p className="flex-1 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
          AI Camera
        </p>
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-bold tabular-nums tracking-widest text-foreground backdrop-blur-md">
          {recording ? <span className="size-1.5 animate-pulse rounded-full bg-destructive" /> : null}
          {timecode}
        </span>
      </div>

      {/* AI toolbar */}
      <div className="no-scrollbar relative z-10 mt-4 flex gap-2 overflow-x-auto px-4">
        {AI_TOOLS.map((t) => {
          const on = active[t];
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur-md transition-all active:scale-95",
                on
                  ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                  : "border-border bg-background/50 text-muted-foreground",
              )}
            >
              {t === "HDR" ? (
                <>
                  HDR: {on ? "ON" : "OFF"}
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      on ? "bg-[oklch(0.8_0.2_150)]" : "bg-muted-foreground",
                    )}
                  />
                </>
              ) : (
                t
              )}
            </button>
          );
        })}
      </div>

      {/* Left status chips */}
      <div className="absolute left-4 top-[38%] z-10 flex flex-col gap-2">
        <StatusChip label="LIGHT" value={active["AUTO LIGHT"] ? "AUTO" : "MANUAL"} />
        <StatusChip label="SKIN" value={active["SKIN"] ? "SMOOTH" : "NATURAL"} />
      </div>

      {/* Floating control panel */}
      <div className="absolute right-4 top-[32%] z-10 flex flex-col gap-1 rounded-2xl border border-border bg-background/45 p-1.5 backdrop-blur-xl">
        <PanelButton icon={RefreshCw} label="Flip" active={flipped} onClick={() => setFlipped((v) => !v)} />
        <PanelButton icon={Zap} label="Flash" active={flash} onClick={() => setFlash((v) => !v)} />
        <PanelButton
          icon={Timer}
          label={timer ? `${timer}s` : "Timer"}
          active={timer > 0}
          onClick={() => setTimer((t) => (t === 0 ? 3 : t === 3 ? 10 : 0))}
        />
        <PanelButton
          icon={ZoomIn}
          label={`${zoom}x`}
          active={zoom > 1}
          onClick={() => setZoom((z) => (z === 1 ? 1.5 : z === 1.5 ? 2 : 1))}
        />
      </div>

      {/* Bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-border-strong bg-background/60 px-4 py-2 backdrop-blur-xl">
          <Sparkles className="size-3.5 animate-pulse text-accent" strokeWidth={1.8} />
          <span className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-gradient">
            AI Enhancement Ready
          </span>
        </div>

        {hasClip ? (
          <div className="animate-rise mb-5 flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-3 backdrop-blur-xl">
            {clip ? (
              <video src={clip.url} muted playsInline className="size-12 rounded-lg object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">New recording</p>
              <p className="text-[11px] tabular-nums text-muted-foreground">
                {upload.status === "UPLOADING"
                  ? `Uploading ${upload.progress}%`
                  : upload.status === "PROCESSING" || upload.status === "SELECTED"
                    ? "Saving…"
                    : upload.status === "FAILED"
                      ? upload.error
                      : `${timecode} · ${clip ? formatBytes(clip.blob.size) : ""}`}
              </p>
            </div>
            <button
              disabled={upload.status === "UPLOADING" || upload.status === "PROCESSING"}
              onClick={() => void editClip()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-brand px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-glow-sm active:scale-95"
            >
              <Wand2 className="size-3.5" strokeWidth={2} /> Edit video
            </button>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setGalleryOpen(true)}
            aria-label="Gallery"
            className="size-12 overflow-hidden rounded-xl border border-border-strong active:scale-95"
          >
            <img
              src={galleryThumb}
              alt="Recent media"
              loading="lazy"
              width={512}
              height={768}
              className="size-full object-cover"
            />
          </button>

          <button
            onClick={onRec}
            aria-label={recording ? "Stop recording" : "Start recording"}
            className="relative flex size-[78px] items-center justify-center rounded-full border-[3px] border-foreground/90 transition-transform active:scale-95"
          >
            {recording ? (
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-destructive/60" />
            ) : null}
            <span
              className={cn(
                "bg-destructive transition-all duration-300",
                recording ? "size-7 rounded-md" : "size-[60px] rounded-full",
              )}
            />
          </button>

          <button
            onClick={() => setPresetsOpen((v) => !v)}
            aria-label="Presets"
            className="flex size-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-border bg-background/50 backdrop-blur-md active:scale-95"
          >
            <Sliders className="size-5 text-foreground" strokeWidth={1.6} />
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground">
              {preset === "Standard" ? "Set" : preset.slice(0, 3)}
            </span>
          </button>
        </div>

        {presetsOpen ? (
          <div className="animate-rise mt-3 rounded-2xl border border-border-strong bg-background/80 p-2 backdrop-blur-xl">
            <p className="px-1.5 pb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Camera presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p.name, p.tools)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-[10px] font-bold uppercase tracking-[0.1em] active:scale-95",
                    preset === p.name
                      ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                      : "border-border bg-background/50 text-muted-foreground",
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {galleryOpen ? (
          <div className="animate-rise mt-3 rounded-2xl border border-border-strong bg-background/80 p-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Recent media
              </p>
              <button
                onClick={() => setGalleryOpen(false)}
                className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-accent active:scale-95"
              >
                Close
              </button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[galleryThumb, cameraPreview, galleryThumb].map((src, i) => (
                <button
                  key={i}
                  onClick={() => navigate({ to: "/editor" })}
                  className="overflow-hidden rounded-lg border border-border active:scale-95"
                >
                  <img src={src} alt="Recent media" loading="lazy" className="aspect-[9/13] w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Images className="size-3.5" strokeWidth={1.6} />
          {recording ? "Recording" : hasClip ? "Clip ready" : "Tap to record"}
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-border bg-background/45 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-md">
      {label}: <span className="text-foreground">{value}</span>
    </span>
  );
}

function PanelButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Zap;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-14 flex-col items-center gap-0.5 rounded-xl px-1 py-2 transition-all active:scale-95",
        active ? "bg-gradient-brand text-primary-foreground shadow-glow-sm" : "text-muted-foreground",
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.6} />
      <span className="text-[9px] font-semibold uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}
