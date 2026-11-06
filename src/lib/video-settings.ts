import { z } from "zod";

export const VIDEO_MODEL = "google/gemini-omni-1.1-flash";
export const VIDEO_DURATIONS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export const VIDEO_RATIOS = ["16:9", "9:16"] as const;
export const VIDEO_RESOLUTIONS = ["360p", "720p", "1080p", "4k"] as const;
export const CAMERA_MOVEMENTS = ["Natural", "Static camera", "Zoom in", "Zoom out", "Pan left", "Pan right"] as const;
export const VIDEO_STYLES = ["Photorealistic", "Cinematic", "Commercial", "Documentary", "Animation", "3D"] as const;
export const MOTION_LEVELS = ["Low", "Medium", "High"] as const;

const STYLE_TEXT: Record<(typeof VIDEO_STYLES)[number], string> = {
  Photorealistic: "Photorealistic live-action footage that looks captured with a real camera: realistic skin texture, natural lighting and shadows, natural depth of field, real-world environmental detail. Not a cartoon, illustration, painting or 3D render.",
  Cinematic: "Photorealistic cinematic live-action footage: filmic lighting, shallow depth of field, smooth camera movement, rich but natural color grading.",
  Commercial: "Photorealistic commercial advertisement footage: clean professional lighting, polished product presentation, smooth deliberate camera moves.",
  Documentary: "Photorealistic documentary footage: natural available light, handheld-feeling camera, authentic unstaged movement.",
  Animation: "Stylized 2D animation style with fluid, expressive motion.",
  "3D": "High-quality 3D animated render with smooth, believable motion.",
};
const MOTION_TEXT: Record<(typeof MOTION_LEVELS)[number], string> = {
  Low: "Subtle, gentle motion throughout the clip — small natural movements, still clearly moving, never frozen.",
  Medium: "Clear, natural motion throughout the clip.",
  High: "Energetic, dynamic motion throughout the clip with pronounced movement.",
};
const HUMAN_TEXT = "Every subject keeps moving for the whole clip; nothing is a still image. Any people move naturally: realistic walking and body mechanics, natural arm and hand movement, natural blinking, head turns, expressions and smiles, hair and clothing reacting to motion, realistic interaction with objects. Consistent identity, faces and bodies across frames. No frozen faces, no robotic motion, no distorted hands, no extra fingers or limbs, no body deformation, no flickering. Consider micro-detail, expression and timing.";

export const videoInput = z.object({
  prompt: z.string().trim().min(3, "Describe the video you want to create.").max(4000),
  mode: z.enum(["text", "image"]),
  sourceAssetId: z.string().uuid().nullable().default(null),
  projectId: z.string().uuid().nullable().default(null),
  duration: z.number().int().min(3).max(10),
  ratio: z.enum(VIDEO_RATIOS), resolution: z.enum(VIDEO_RESOLUTIONS),
  camera: z.enum(CAMERA_MOVEMENTS).default("Natural"),
  atmosphere: z.string().trim().max(200).default(""),
  style: z.enum(VIDEO_STYLES).default("Photorealistic"),
  motion: z.enum(MOTION_LEVELS).default("Medium"),
}).superRefine((value, ctx) => {
  if (value.mode === "image" && !value.sourceAssetId) ctx.addIssue({ code: "custom", path: ["sourceAssetId"], message: "Select an image first." });
});
export type VideoInput = z.infer<typeof videoInput>;

export function videoPrompt(input: VideoInput, withImage: boolean) {
  return [
    withImage ? `Animate <FIRST_FRAME> into a moving video. Preserve the person's or subject's identity, appearance, clothing and the composition of the source image. ${input.prompt}` : input.prompt,
    STYLE_TEXT[input.style], MOTION_TEXT[input.motion], HUMAN_TEXT,
    input.camera === "Natural" ? "" : `Camera movement: ${input.camera}.`,
    input.atmosphere ? `Lighting and atmosphere: ${input.atmosphere}.` : "",
    "In a single continuous shot.",
  ].filter(Boolean).join("\n");
}
export function videoRequest(input: VideoInput, image?: { data: string; mime_type: string }) {
  const text = videoPrompt(input, Boolean(image));
  return { model: VIDEO_MODEL, input: image ? [{ type: "image", ...image }, { type: "text", text }] : text,
    response_format: { type: "video", resolution: input.resolution, duration: `${input.duration}s`, aspect_ratio: input.ratio },
    generation_config: { video_config: { task: image ? "image_to_video" : "text_to_video" } } };
}
export function videoHttpRetryable(status: number) { return status === 429 || status >= 500; }

/** Inspects provider bytes; rejects still images and anything without a real video track. */
export function inspectMp4(bytes: Uint8Array): { duration: number; width: number; height: number } {
  const ascii = (o: number, n: number) => String.fromCharCode(...bytes.subarray(o, o + n));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) throw new Error("Provider returned a JPEG image, not a video.");
  if (ascii(1, 3) === "PNG") throw new Error("Provider returned a PNG image, not a video.");
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") throw new Error("Provider returned a WebP image, not a video.");
  if (bytes.length < 12 || ascii(4, 4) !== "ftyp") throw new Error("Provider returned an invalid MP4 file.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const find = (tag: string, from = 0) => { for (let i = from; i < bytes.length - 4; i++) if (bytes[i] === tag.charCodeAt(0) && ascii(i, 4) === tag) return i; return -1; };
  const mvhd = find("mvhd"); if (mvhd < 0) throw new Error("Video has no playable movie header.");
  const v1 = bytes[mvhd + 4] === 1; const scale = view.getUint32(mvhd + (v1 ? 24 : 16));
  const units = v1 ? Number(view.getBigUint64(mvhd + 28)) : view.getUint32(mvhd + 20);
  const duration = scale ? units / scale : 0;
  if (!(duration > 0.5)) throw new Error("Video duration is too short to contain motion.");
  let width = 0, height = 0;
  for (let t = find("tkhd"); t >= 0; t = find("tkhd", t + 4)) {
    const hdlr = find("hdlr", t); if (hdlr < 0 || ascii(hdlr + 12, 4) !== "vide") continue;
    const tv1 = bytes[t + 4] === 1; const off = t + (tv1 ? 92 : 80);
    width = view.getUint32(off) >>> 16; height = view.getUint32(off + 4) >>> 16; break;
  }
  if (!width || !height) throw new Error("File contains no video track.");
  return { duration, width, height };
}
