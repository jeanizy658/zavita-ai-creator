export type MediaKind = "video" | "image" | "audio";

export const MEDIA_RULES: Record<MediaKind, { mimes: string[]; maxBytes: number; accept: string }> = {
  video: {
    mimes: ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/3gpp"],
    maxBytes: 500 * 1024 * 1024,
    accept: "video/*",
  },
  image: {
    mimes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"],
    maxBytes: 25 * 1024 * 1024,
    accept: "image/*",
  },
  audio: {
    mimes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg"],
    maxBytes: 100 * 1024 * 1024,
    accept: "audio/*",
  },
};

export function kindOfFile(file: File): MediaKind | null {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return null;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "--:--";
  const s = Math.round(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Real validation against MIME type and size. Returns an error message or null. */
export function validateFile(file: File): { kind: MediaKind } | { error: string } {
  const kind = kindOfFile(file);
  if (!kind) return { error: `Unsupported file type: ${file.type || "unknown"}.` };
  const rule = MEDIA_RULES[kind];
  if (file.type && !rule.mimes.includes(file.type.toLowerCase().split(";")[0] ?? "")) {
    return { error: `Unsupported ${kind} format (${file.type}).` };
  }
  if (file.size > rule.maxBytes) {
    return { error: `File is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(rule.maxBytes)}.` };
  }
  if (file.size === 0) return { error: "File is empty." };
  return { kind };
}

/** Probe playable media with a bounded timeout, including WebM's infinite-duration metadata. */
export function probeDuration(file: File, kind: MediaKind): Promise<number | null> {
  if (kind === "image") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "video" ? "video" : "audio");
    let finished = false;
    const done = (value: number | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      el.onloadedmetadata = null; el.ondurationchange = null; el.ontimeupdate = null; el.onerror = null;
      el.pause(); el.removeAttribute("src"); el.load(); URL.revokeObjectURL(url);
      resolve(value);
    };
    const timeout = setTimeout(() => done(null), 15000);
    const read = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) done(el.duration);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) read();
      else { try { el.currentTime = 1e10; } catch { done(null); } }
    };
    el.ondurationchange = read;
    el.ontimeupdate = read;
    el.onerror = () => done(null);
    el.src = url;
  });
}

/** Generate only actual image pixels or video frames; return null when unsupported. */
export function generateThumbnail(file: File, kind: MediaKind): Promise<Blob | null> {
  if (kind === "audio") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    let finished = false;
    const video = kind === "video" ? document.createElement("video") : null;
    const finish = (blob: Blob | null) => {
      if (finished) return;
      finished = true; clearTimeout(timeout);
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      URL.revokeObjectURL(url); resolve(blob);
    };
    const timeout = setTimeout(() => finish(null), 8000);
    const draw = (source: CanvasImageSource, w: number, h: number) => {
      if (finished || !w || !h) return finish(null);
      try {
        const ratio = Math.min(480 / w, 480 / h, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * ratio)); canvas.height = Math.max(1, Math.round(h * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) return finish(null);
        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(finish, "image/jpeg", 0.82);
      } catch { finish(null); }
    };
    if (!video) {
      const img = new Image();
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => finish(null); img.src = url; return;
    }
    video.muted = true; video.playsInline = true; video.preload = "auto";
    video.onloadeddata = () => { try { video.currentTime = Math.min(0.1, Number.isFinite(video.duration) ? video.duration / 2 : 0.1); } catch { draw(video, video.videoWidth, video.videoHeight); } };
    video.onseeked = () => draw(video, video.videoWidth, video.videoHeight);
    video.onerror = () => finish(null); video.src = url;
  });
}
