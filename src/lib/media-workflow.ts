export type MediaTrack = "main" | "overlay" | "photo" | "text" | "ai" | "audio";

export function trackForAsset(type: string): MediaTrack {
  if (type === "VIDEO" || type === "AI_VIDEO") return "main";
  if (["AUDIO", "MUSIC", "VOICE"].includes(type)) return "audio";
  if (type === "AI_VISUAL" || type === "GRAPHIC") return "ai";
  if (type === "IMAGE" || type === "LOGO") return "overlay";
  if (type === "TEXT") return "text";
  return "photo";
}

export function assetDuration(type: string, duration: number | null): number {
  if (duration !== null && Number.isFinite(duration) && duration > 0) return duration;
  if (["PHOTO", "IMAGE", "LOGO", "AI_VISUAL", "GRAPHIC", "TEXT"].includes(type)) return 5;
  throw new Error("Unable to read this file's duration. Choose a playable file.");
}

export function appendPositions(
  existing: { track_type: string; end_time: number; position: number }[],
  items: { track: string; duration: number }[],
) {
  const ends = new Map<string, number>();
  const positions = new Map<string, number>();
  for (const clip of existing) {
    ends.set(clip.track_type, Math.max(ends.get(clip.track_type) ?? 0, Number(clip.end_time)));
    positions.set(clip.track_type, Math.max(positions.get(clip.track_type) ?? -1, clip.position));
  }
  return items.map((item) => {
    if (!Number.isFinite(item.duration) || item.duration <= 0) throw new Error("Invalid media duration.");
    const start = ends.get(item.track) ?? 0;
    const position = (positions.get(item.track) ?? -1) + 1;
    ends.set(item.track, start + item.duration);
    positions.set(item.track, position);
    return { start_time: start, end_time: start + item.duration, position };
  });
}

export function recordingMime(supported: (type: string) => boolean) {
  return ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find(supported);
}

export function deviceError(error: unknown, device = "Camera"): string {
  const name = error instanceof Error ? error.name : "";
  if (["NotAllowedError", "SecurityError"].includes(name)) return `${device} permission denied. Allow access in your browser settings, then retry.`;
  if (name === "NotFoundError") return `No ${device.toLowerCase()} was found. Import a file instead.`;
  if (name === "NotReadableError") return `${device} is busy or unavailable. Close other camera apps and retry.`;
  if (name === "OverconstrainedError") return `This ${device.toLowerCase()} does not support the selected setting.`;
  return error instanceof Error ? error.message : `${device} failed. Please retry.`;
}