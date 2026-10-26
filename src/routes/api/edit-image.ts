import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { buildEditPrompt, editConflict, editInput, EDIT_SOURCE_MAX_BYTES, EDIT_SOURCE_MIMES } from "@/lib/image-edit-settings";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/edit-image")({ server: { handlers: {
  POST: async ({ request }) => {
    const url = process.env["SUPABASE_URL"];
    const publishable = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const key = process.env["LOVABLE_API_KEY"];
    const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
    const err = (message: string, status: number) => Response.json({ error: { message } }, { status });
    if (!token) return err("Connectez-vous pour modifier une image.", 401);
    if (!url || !publishable) return err("Le stockage n'est pas configuré.", 503);
    const client = createClient<Database>(url, publishable, { auth: { persistSession: false, autoRefreshToken: false }, global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => { const h = new Headers(init?.headers); h.set("apikey", publishable); return fetch(input, { ...init, headers: h }); },
    } });
    const auth = await client.auth.getUser(token);
    const user = auth.data.user;
    if (auth.error || !user) return err("Session expirée. Reconnectez-vous.", 401);
    let body;
    try { body = editInput.extend({ jobId: z.string().uuid(), sourceAssetId: z.string().uuid(), stream: z.boolean().default(true) }).parse(await request.json()); }
    catch { return err("Paramètres d'édition invalides.", 400); }
    const conflict = editConflict(body);
    if (conflict) return err(conflict, 400);
    const { data: job } = await client.from("ai_jobs").select("*").eq("id", body.jobId).eq("user_id", user.id).single();
    if (!job || job.type !== "editImage") return err("Édition introuvable.", 404);
    const fail = async (message: string) => { await client.from("ai_jobs").update({ status: "FAILED", error: message }).eq("id", job.id); };
    if (!key) { await fail("Fournisseur IA non configuré."); return err("Fournisseur IA non configuré.", 503); }
    const flag = process.env["AI_IMAGE_ENABLED"];
    if (flag === "false" || flag === "0") { await fail("Édition d'image désactivée."); return err("Édition d'image désactivée.", 403); }
    const { data: source } = await client.from("assets").select("*").eq("id", body.sourceAssetId).eq("user_id", user.id).maybeSingle();
    if (!source?.storage_path || !EDIT_SOURCE_MIMES.includes(source.mime_type as (typeof EDIT_SOURCE_MIMES)[number])) {
      await fail("Image source introuvable ou format non pris en charge (JPEG, PNG, WebP).");
      return err("Image source introuvable ou format non pris en charge (JPEG, PNG, WebP).", 400);
    }
    if (body.stream) {
      const { generateImage: _unused, imageSettings } = await import("@/lib/image-gateway.server");
      void _unused;
      const { data: claimed } = await client.from("ai_jobs").update({ status: "PROCESSING", input: { ...body, stream: undefined, provider: "lovable", model: imageSettings.model, sourceAssetId: source.id, sourcePath: source.storage_path } }).eq("id", job.id).eq("status", "QUEUED").select("id").maybeSingle();
      if (!claimed) return err("Cette édition a déjà démarré. Ouvrez-la depuis l'historique.", 409);
    } else if (job.status !== "PROCESSING") return err("Cette édition ne peut pas être relancée.", 409);
    const { data: blob, error: dlError } = await client.storage.from("media").download(source.storage_path);
    if (dlError || !blob || blob.size > EDIT_SOURCE_MAX_BYTES) {
      const m = blob && blob.size > EDIT_SOURCE_MAX_BYTES ? "Image source trop lourde (10 Mo max)." : "Impossible de lire l'image source.";
      await fail(m); return err(m, 400);
    }
    try {
      const { editImage, imageSettings } = await import("@/lib/image-gateway.server");
      const form = new FormData();
      form.set("prompt", buildEditPrompt(body));
      form.append("image", new File([blob], source.name, { type: source.mime_type ?? "image/png" }));
      form.set("stream", String(body.stream));
      const upstream = await editImage({ ...imageSettings, apiKey: key }, form);
      if (!upstream.ok) {
        const text = await upstream.text();
        let message = `L'édition a échoué (${upstream.status}).`;
        try { const p = JSON.parse(text); message = p.error?.message ?? p.message ?? message; } catch { /* hide raw output */ }
        await fail(message);
        return err(message, upstream.status);
      }
      const headers = new Headers({ "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream", "Cache-Control": "no-cache, no-transform" });
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      await fail("Connexion au service d'image interrompue.");
      return err("Connexion au service d'image interrompue.", 502);
    }
  },
} } });
