import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import { useStudio, type ExportFormat, type ExportFps, type ExportQuality } from "@/lib/studio-store";
import editorFrame from "@/assets/editor-frame.jpg";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Export Your Video — ZAVITA" },
      {
        name: "description",
        content:
          "Your AI-edited video is ready. Choose format, quality and frame rate, then export and publish everywhere.",
      },
      { property: "og:title", content: "Export Your Video — ZAVITA" },
      {
        property: "og:description",
        content: "Export settings, rendering and one-tap publishing for your ZAVITA video.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExportScreen,
});

const AI_TASKS = ["AI Enhanced", "Background", "Voice Enhanced", "AI Montage", "Captions"];

const FORMATS: { id: ExportFormat; label: string; ratio: string }[] = [
  { id: "9:16", label: "Vertical", ratio: "9 / 16" },
  { id: "1:1", label: "Square", ratio: "1 / 1" },
  { id: "16:9", label: "Horizontal", ratio: "16 / 9" },
];

const QUALITIES: { id: ExportQuality; label: string }[] = [
  { id: "1080p", label: "Full HD" },
  { id: "4K", label: "Ultra HD" },
];

const FPS_OPTIONS: { id: ExportFps; label: string }[] = [
  { id: 30, label: "Standard" },
  { id: 60, label: "Smooth" },
];

const CONFETTI = Array.from({ length: 14 }, (_, i) => ({
  left: 6 + i * 6.6,
  delay: (i % 7) * 0.14,
  color: ["var(--brand-cyan)", "var(--brand-violet)", "var(--gold)", "var(--brand-blue)"][i % 4]!,
}));

function ExportScreen() {
  const navigate = useNavigate();
  const {
    exportFormat,
    setExportFormat,
    exportQuality,
    setExportQuality,
    exportFps,
    setExportFps,
    exportStatus,
    setExportStatus,
  } = useStudio();
  const [step, setStep] = useState(0);
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const steps = [
    "Preparing export...",
    "Rendering video...",
    `Applying ${exportFormat} format...`,
    `Encoding ${exportQuality}...`,
    "Finalizing...",
  ];

  useEffect(() => {
    if (exportStatus !== "processing") return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= steps.length - 1) {
          clearInterval(t);
          setExportStatus("completed");
          return s;
        }
        return s + 1;
      });
    }, 620);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportStatus]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const ratio = FORMATS.find((f) => f.id === exportFormat)?.ratio ?? "9 / 16";

  return (
    <div className="min-h-[100dvh] bg-background pb-[calc(env(safe-area-inset-bottom)+112px)]">
      <ModuleHeader title="Your video is ready" subtitle="Export & publish" />

      <div className="mx-auto w-full max-w-[560px] px-4">
        {/* Success visual */}
        <section className="animate-rise relative mt-5 overflow-hidden surface-card px-4 py-6 text-center">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="animate-confetti absolute top-0 block h-2.5 w-1.5 rounded-[2px]"
                style={{
                  left: `${c.left}%`,
                  backgroundColor: c.color,
                  animationDelay: `${c.delay}s`,
                }}
              />
            ))}
          </div>
          <div className="animate-pop relative mx-auto flex size-16 items-center justify-center rounded-full border border-[oklch(0.72_0.18_150)] bg-[color-mix(in_oklab,oklch(0.72_0.18_150)_18%,transparent)]">
            <Check className="size-8 text-[oklch(0.78_0.19_150)]" strokeWidth={2.6} />
          </div>
          <h1 className="relative mt-3 text-lg font-bold">YOUR VIDEO IS READY</h1>
          <p className="relative mt-1 text-[11.5px] text-muted-foreground">
            All AI processing completed.
          </p>
        </section>

        {/* Completed AI tasks */}
        <section className="animate-rise mt-5">
          <SectionHeader title="Completed AI Tasks" />
          <ul className="grid gap-2">
            {AI_TASKS.map((t) => (
              <li
                key={t}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,oklch(0.72_0.18_150)_22%,transparent)]">
                  <Check className="size-3 text-[oklch(0.78_0.19_150)]" strokeWidth={3} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">{t}</span>
                <span className="shrink-0 text-[9.5px] font-bold uppercase tracking-[0.14em] text-[oklch(0.78_0.19_150)]">
                  Completed
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Preview */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Preview" />
          <div className="surface-card overflow-hidden p-3">
            <div
              className="mx-auto overflow-hidden rounded-xl border border-border transition-all duration-300"
              style={{ aspectRatio: ratio, maxWidth: exportFormat === "9:16" ? 220 : "100%" }}
            >
              <img
                src={editorFrame}
                alt="Business Tips final preview"
                className="size-full object-cover"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">Business Tips</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Duration 02:15
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-accent">
                {exportFormat} · {exportQuality} · {exportFps}fps
              </span>
            </div>
          </div>
        </section>

        {/* Export settings */}
        <section className="animate-rise mt-6">
          <SectionHeader title="Export Settings" />

          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Format
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map((f) => {
              const active = exportFormat === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setExportFormat(f.id)}
                  className={cn(
                    "rounded-xl p-[1px] transition-all active:scale-95",
                    active ? "bg-gradient-brand shadow-glow-sm" : "bg-border",
                  )}
                >
                  <span className="flex h-full flex-col items-center gap-1.5 rounded-[11px] bg-surface px-2 py-3">
                    <span
                      className={cn(
                        "block w-full max-w-[34px] rounded-[4px] border",
                        active ? "border-accent bg-gradient-brand" : "border-border bg-surface-2",
                      )}
                      style={{ aspectRatio: f.ratio }}
                    />
                    <span className="text-[11px] font-bold">{f.id}</span>
                    <span className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                      {f.label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Quality
          </p>
          <div className="grid grid-cols-2 gap-2">
            {QUALITIES.map((q) => (
              <button
                key={q.id}
                onClick={() => setExportQuality(q.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95",
                  exportQuality === q.id
                    ? "border-accent bg-surface-2 shadow-glow-sm"
                    : "border-border bg-surface",
                )}
              >
                <span className="block text-[13px] font-bold">{q.id}</span>
                <span className="block text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {q.label}
                </span>
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            FPS
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FPS_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setExportFps(f.id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-left transition-all active:scale-95",
                  exportFps === f.id
                    ? "border-accent bg-surface-2 shadow-glow-sm"
                    : "border-border bg-surface",
                )}
              >
                <span className="block text-[13px] font-bold">{f.id}</span>
                <span className="block text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Export progress / result */}
        {exportStatus !== "idle" ? (
          <section className="animate-rise mt-5 surface-card p-4">
            {exportStatus === "processing" ? (
              <>
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin-slow size-4 text-accent" strokeWidth={2} />
                  <p className="text-[12px] font-semibold">{steps[step]}</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-brand transition-all duration-500"
                    style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-full bg-[color-mix(in_oklab,oklch(0.72_0.18_150)_20%,transparent)]">
                  <Check className="size-4 text-[oklch(0.78_0.19_150)]" strokeWidth={3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-[oklch(0.82_0.17_150)]">
                    EXPORT COMPLETE
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Business Tips · {exportFormat} · {exportQuality} · {exportFps}fps
                  </p>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {exportStatus === "completed" ? (
          <button
            onClick={() => navigate({ to: "/publish" })}
            className="animate-rise mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow active:scale-[0.98]"
          >
            <Send className="size-4" strokeWidth={2} /> Continue to Publish Everywhere
          </button>
        ) : null}
      </div>

      {toast ? (
        <div className="animate-rise pointer-events-none fixed inset-x-0 bottom-[110px] z-50 flex justify-center px-4">
          <span className="flex items-center gap-2 rounded-full border border-accent bg-surface px-4 py-2 text-[11px] font-semibold shadow-glow-sm">
            <Check className="size-3.5 text-accent" strokeWidth={2.6} />
            {toast}
          </span>
        </div>
      ) : null}

      {/* Share sheet */}
      {share ? (
        <div className="fixed inset-0 z-50 flex items-end bg-background/70 backdrop-blur-sm">
          <div className="animate-rise mx-auto w-full max-w-[560px] rounded-t-3xl border-t border-border bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="mb-3 flex items-center gap-2">
              <Share2 className="size-4 text-accent" strokeWidth={1.8} />
              <p className="text-[12px] font-bold uppercase tracking-[0.16em]">Share</p>
              <button
                aria-label="Close share sheet"
                onClick={() => setShare(false)}
                className="ml-auto flex size-8 items-center justify-center rounded-full border border-border active:scale-95"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
            {[
              { id: "link", label: "Copy Link", icon: Copy, msg: "Link copied" },
              { id: "device", label: "Share to Device", icon: Smartphone, msg: "Sent to device" },
              { id: "social", label: "Share to Social", icon: Sparkles, msg: "Opening social share" },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setShare(false);
                  setToast(o.msg);
                }}
                className="mb-2 flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3 text-left text-[12.5px] font-semibold active:scale-[0.98]"
              >
                <o.icon className="size-4 text-accent" strokeWidth={1.8} />
                {o.label}
              </button>
            ))}
            <button
              onClick={() => setShare(false)}
              className="w-full rounded-xl border border-border-strong py-3 text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {/* Sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[560px] border-t border-border bg-background/92 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            disabled={exportStatus === "processing"}
            onClick={() => {
              setStep(0);
              setExportStatus("processing");
            }}
            className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {exportStatus === "processing" ? (
              <Loader2 className="animate-spin-slow size-4" strokeWidth={2.2} />
            ) : (
              <Upload className="size-4" strokeWidth={2.2} />
            )}
            {exportStatus === "completed" ? "Export again" : "Export video"}
          </button>
          <button
            onClick={() => setShare(true)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface py-3.5 text-[12px] font-bold uppercase tracking-[0.14em] active:scale-[0.98]"
          >
            <Share2 className="size-4" strokeWidth={1.9} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
