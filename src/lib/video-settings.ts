import { z } from "zod";

export const VIDEO_MODEL = "google/gemini-omni-1.1-flash";
export const VIDEO_DURATIONS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export const VIDEO_RATIOS = ["16:9", "9:16"] as const;
export const VIDEO_RESOLUTIONS = ["360p", "720p", "1080p", "4k"] as const;
export const CAMERA_MOVEMENTS = ["Natural", "Static camera", "Zoom in", "Zoom out", "Pan left", "Pan right"] as const;
export const videoInput = z.object({
  prompt: z.string().trim().min(3, "Describe the video you want to create.").max(4000),
  mode: z.enum(["text", "image"]),
  sourceAssetId: z.string().uuid().nullable().default(null),
  projectId: z.string().uuid().nullable().default(null),
  duration: z.number().int().min(3).max(10),
  ratio: z.enum(VIDEO_RATIOS), resolution: z.enum(VIDEO_RESOLUTIONS),
  camera: z.enum(CAMERA_MOVEMENTS).default("Natural"),
  atmosphere: z.string().trim().max(200).default(""),
}).superRefine((value, ctx) => {
  if (value.mode === "image" && !value.sourceAssetId) ctx.addIssue({ code: "custom", path: ["sourceAssetId"], message: "Select an image first." });
});
export type VideoInput = z.infer<typeof videoInput>;
export function videoRequest(input: VideoInput, image?: { data: string; mime_type: string }) {
  const text = [input.prompt, input.camera === "Natural" ? "" : `Camera movement: ${input.camera}.`, input.atmosphere ? `Lighting and atmosphere: ${input.atmosphere}.` : "", "In a single continuous shot."].filter(Boolean).join("\n");
  return { model: VIDEO_MODEL, input: image ? [{ type: "image", ...image }, { type: "text", text }] : text,
    response_format: { type: "video", resolution: input.resolution, duration: `${input.duration}s`, aspect_ratio: input.ratio } };
}
export function videoHttpRetryable(status: number) { return status === 429 || status >= 500; }
