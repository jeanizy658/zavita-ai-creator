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
  if (file.type && !rule.mimes.includes(file.type.toLowerCase())) {
    return { error: `Unsupported ${kind} format (${file.type}).` };
  }
  if (file.size > rule.maxBytes) {
    return { error: `File is too large (${formatBytes(file.size)}). Maximum is ${formatBytes(rule.maxBytes)}.` };
  }
  if (file.size === 0) return { error: "File is empty." };
  return { kind };
}

/** Reads real media duration from the file in the browser. */
export function probeDuration(file: File, kind: MediaKind): Promise<number | null> {
  if (kind === "image") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "video" ? "video" : "audio");
    const done = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    el.preload = "metadata";
    el.onloadedmetadata = () => done(Number.isFinite(el.duration) ? el.duration : null);
    el.onerror = () => done(null);
    el.src = url;
  });
}

/** Grabs a real frame from a video file (or downsizes an image) as a JPEG thumbnail. */
export function generateThumbnail(file: File, kind: MediaKind): Promise<Blob | null> {
  if (kind === "audio") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const finish = (blob: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    const draw = (source: CanvasImageSource, w: number, h: number) => {
      const max = 480;
      const ratio = Math.min(max / w, max / h, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) return finish(null);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => finish(b), "image/jpeg", 0.82);
    };

    if (kind === "image") {
      const img = new Image();
      img.onload = () => draw(img, img.naturalWidth, img.naturalHeight);
      img.onerror = () => finish(null);
      img.src = url;
      return;
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      } catch {
        draw(video, video.videoWidth, video.videoHeight);
      }
    };
    video.onseeked = () => draw(video, video.videoWidth, video.videoHeight);
    video.onerror = () => finish(null);
    video.src = url;
  });
}
