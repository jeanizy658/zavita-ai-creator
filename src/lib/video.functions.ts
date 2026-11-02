import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { videoInput, VIDEO_MODEL } from "./video-settings";

export const submitVideo = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ requestId: z.string().uuid(), settings: videoInput }).parse(input))
  .handler(async ({ data, context }) => {
    const { enqueueVideo } = await import("./video.server");
    return enqueueVideo(context.supabase, context.userId, data.requestId, data.settings);
  });

export const syncVideos = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { syncVideoQueue } = await import("./video.server");
    return syncVideoQueue(context.supabase, context.userId);
  });

export const resumeVideoService = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { resumeVideo } = await import("./video.server");
    return resumeVideo(context.userId);
  });

export const videoAvailability = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .handler(async () => ({ model: VIDEO_MODEL, configured: Boolean(process.env["LOVABLE_API_KEY"]), enabled: process.env["AI_VIDEO_ENABLED"] !== "false" }));