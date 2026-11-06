import { describe, expect, it } from "vitest";
import { videoInput, videoRequest, videoHttpRetryable, inspectMp4 } from "./video-settings";
const base = { prompt: "Ocean waves at sunrise", mode: "text" as const, duration: 5, ratio: "16:9" as const, resolution: "720p" as const };
describe("real supported video settings", () => {
  it("supports five and ten second requests", () => { for (const duration of [5,10]) expect(videoRequest(videoInput.parse({ ...base, duration })).response_format.duration).toBe(`${duration}s`); });
  it("rejects unsupported square ratio", () => { expect(videoInput.safeParse({ ...base, ratio: "1:1" }).success).toBe(false); });
  it("rejects unsupported 480p and 720p remains supported", () => { expect(videoInput.safeParse({ ...base, resolution: "480p" }).success).toBe(false); expect(videoInput.parse(base).resolution).toBe("720p"); });
  it("requires a source for image animation", () => { expect(videoInput.safeParse({ ...base, mode: "image" }).success).toBe(false); });
  it("sends inline image data without a URL", () => { const r = videoRequest(videoInput.parse({ ...base, mode: "image", sourceAssetId: "00000000-0000-4000-8000-000000000001" }), { data: "AAAA", mime_type: "image/png" }); const parts = r.input as { type: string; text?: string }[]; expect(parts[0]).toEqual({ type: "image", data: "AAAA", mime_type: "image/png" }); expect(parts[1]?.text).toContain("<FIRST_FRAME>"); expect(r.generation_config.video_config.task).toBe("image_to_video"); });
  it("defaults to photorealistic text-to-video", () => { const r = videoRequest(videoInput.parse(base)); expect(r.input).toContain("Photorealistic live-action"); expect(r.generation_config.video_config.task).toBe("text_to_video"); });
  it("rejects still images as video output", () => { expect(() => inspectMp4(new Uint8Array([0x89,0x50,0x4e,0x47,0,0,0,0,0,0,0,0]))).toThrow(/PNG/); expect(() => inspectMp4(new Uint8Array([0xff,0xd8,0xff,0,0,0,0,0,0,0,0,0]))).toThrow(/JPEG/); });
  it("camera and lighting influence the real request", () => { const r = videoRequest(videoInput.parse({ ...base, camera: "Pan left", atmosphere: "Soft sunrise" })); expect(r.input).toContain("Camera movement: Pan left."); expect(r.input).toContain("Lighting and atmosphere: Soft sunrise."); });
  it("never retries terminal HTTP errors", () => { for (const status of [400,401,402,403,404]) expect(videoHttpRetryable(status)).toBe(false); expect(videoHttpRetryable(429)).toBe(true); expect(videoHttpRetryable(503)).toBe(true); });
});