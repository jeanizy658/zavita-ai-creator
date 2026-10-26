import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Idempotent private save keyed by the real generation job; no privileged client. */
export const saveGeneratedImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ jobId: z.string().uuid(), dataUrl: z.string().max(36 * 1024 * 1024) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: job, error: jobError } = await context.supabase.from("ai_jobs").select("*").eq("id", data.jobId).eq("user_id", context.userId).single();
    if (jobError || !job || job.type !== "generateImage") throw new Error("Generation not found.");
    const { data: existing } = await context.supabase.from("assets").select("*").eq("id", job.id).maybeSingle();
    let asset = existing;
    if (!asset) {
      const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(data.dataUrl);
      if (!match?.[1]) throw new Error("The generated image must be a valid PNG.");
      const { Buffer } = await import("node:buffer");
      const bytes = Buffer.from(match[1], "base64");
      if (bytes.length > 25 * 1024 * 1024 || bytes.length < 24 || bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) throw new Error("Invalid image or image exceeds the storage limit.");
      const path = `${context.userId}/generated/${job.id}.png`;
      const { error: storageError } = await context.supabase.storage.from("media").upload(path, bytes, { contentType: "image/png", upsert: true });
      if (storageError) throw new Error("Generation succeeded, but private storage failed: " + storageError.message);
      const { data: inserted, error: insertError } = await context.supabase.from("assets").upsert({ id: job.id, user_id: context.userId, project_id: job.project_id, type: "AI_VISUAL", name: `AI-${job.id}.png`, storage_path: path, thumbnail_url: path, mime_type: "image/png", size: bytes.length, metadata: { jobId: job.id } }, { onConflict: "id" }).select("*").single();
      if (insertError || !inserted) throw new Error("Image uploaded, but its metadata could not be saved. Retry saving.");
      asset = inserted;
    }
    const { error: completionError } = await context.supabase.from("ai_jobs").update({ status: "COMPLETED", progress: 100, error: null, output: { assetId: asset.id, storagePath: asset.storage_path } }).eq("id", job.id);
    if (completionError) throw new Error("Image saved, but generation history could not be updated. Retry saving.");
    return asset;
  });