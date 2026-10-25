import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { imageInput, styledPrompt } from "@/lib/image-settings";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/generate-image")({ server: { handlers: {
  POST: async ({ request }) => {
    const url = process.env["SUPABASE_URL"];
    const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const key = process.env["LOVABLE_API_KEY"];
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    const errorResponse = (message: string, status: number) => Response.json({ error: { message } }, { status });
    if (!token) return errorResponse("Sign in to generate images.", 401);
    if (!url || !publishable) return errorResponse("Cloud storage is not configured.", 503);
    const client = createClient<Database>(url, publishable, { auth: { persistSession: false, autoRefreshToken: false }, global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => { const h = new Headers(init?.headers); h.set("apikey", publishable); return fetch(input, { ...init, headers: h }); },
    } });
    const auth = await client.auth.getUser(token);
    const user = auth.data.user;
    if (auth.error || !user) return errorResponse("Your session expired. Sign in again.", 401);
    let body;
    try { body = imageInput.extend({ jobId: z.string().uuid(), stream: z.boolean().default(true) }).parse(await request.json()); }
    catch { return errorResponse("Enter a prompt and supported image settings.", 400); }
    const { data: job } = await client.from("ai_jobs").select("*").eq("id", body.jobId).eq("user_id", user.id).single();
    if (!job || job.type !== "generateImage") return errorResponse("Generation job not found.", 404);
    const failJob = async (message: string) => { await client.from("ai_jobs").update({ status: "FAILED", error: message }).eq("id", job.id); };
    if (!key) { await failJob("AI provider is not configured."); return errorResponse("AI provider is not configured.", 503); }
    const flag = process.env["AI_IMAGE_ENABLED"];
    if (flag === "false" || flag === "0") { await failJob("Image generation is disabled."); return errorResponse("Image generation is disabled.", 403); }
    if (job.project_id) {
      const { data: project } = await client.from("projects").select("id").eq("id", job.project_id).eq("user_id", user.id).maybeSingle();
      if (!project) return errorResponse("You cannot use this project.", 403);
    }
    if (body.stream) {
      const { data: claimed } = await client.from("ai_jobs").update({ status: "PROCESSING", input: { ...body, provider: "lovable", model: "google/gemini-3.1-flash-image" } }).eq("id", job.id).eq("status", "QUEUED").select("id").maybeSingle();
      if (!claimed) return errorResponse("This generation already started. Open its history instead.", 409);
    } else if (job.status !== "PROCESSING") return errorResponse("This generation cannot be replayed.", 409);
    try {
      const { generateImage, imageSettings } = await import("@/lib/image-gateway.server");
      const upstream = await generateImage({ ...imageSettings, apiKey: key }, styledPrompt(body.prompt, body.style), body.stream, undefined, body.ratio);
      if (!upstream.ok) {
        const text = await upstream.text();
        let message = `Image generation failed (${upstream.status}).`;
        try { const parsed = JSON.parse(text); message = parsed.error?.message ?? parsed.message ?? message; } catch { /* don't expose raw provider output */ }
        await failJob(message);
        return errorResponse(message, upstream.status);
      }
      const headers = new Headers({ "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream", "Cache-Control": "no-cache, no-transform" });
      upstream.headers.forEach((value, name) => { if (name.toLowerCase().startsWith("x-lovable-aig-")) headers.set(name, value); });
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      await failJob("The image service connection was interrupted. Check history before starting another generation.");
      return errorResponse("The image service connection was interrupted.", 502);
    }
  },
} } });