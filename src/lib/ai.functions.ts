import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CAPABILITY_FLAG, type AiCapability, type AiResult } from "@/lib/ai-capabilities";

/**
 * Provider-agnostic AI service layer.
 * Every capability is behind a feature flag and a provider implementation.
 * When no provider is configured the call returns a clear configuration error —
 * it never fabricates a result.
 */

const TEXT_MODEL = "google/gemini-3.8-flash";
const IMAGE_MODEL = "google/gemini-3.1-flash-image";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

type Provider = "lovable" | null;

/** Which provider currently backs each capability, if any. */
function providerFor(capability: AiCapability): Provider {
  const hasLovable = Boolean(process.env["LOVABLE_API_KEY"]);
  switch (capability) {
    case "generateImage":
      return hasLovable ? "lovable" : null;
    case "analyzeContent":
    case "generateCaptions":
    case "generateBrollSuggestions":
    case "generateIllustrationSuggestions":
    case "generateTextSuggestions":
    case "generateSoundDesign":
      return hasLovable ? "lovable" : null;
    // No media-processing provider is wired yet — these must not fake results.
    case "generateVideo":
    case "enhanceVideo":
    case "enhanceVoice":
    case "removeBackground":
    case "generateAvatar":
      return null;
  }
}

function flagEnabled(capability: AiCapability) {
  const raw = process.env[CAPABILITY_FLAG[capability]];
  if (raw === undefined) return providerFor(capability) !== null; // enabled when a provider exists
  return raw === "true" || raw === "1";
}

export type CapabilityStatus = { capability: AiCapability; enabled: boolean; provider: string | null; requires: string[] };

/** Honest, server-computed availability map used by the UI to avoid fake states. */
export const getAiStatus = createServerFn({ method: "GET" }).handler(async () => {
  const caps = Object.keys(CAPABILITY_FLAG) as AiCapability[];
  return caps.map<CapabilityStatus>((capability) => {
    const provider = providerFor(capability);
    return {
      capability,
      provider,
      enabled: provider !== null && flagEnabled(capability),
      requires:
        provider === null
          ? ["A media AI provider must be configured (provider API key + " + CAPABILITY_FLAG[capability] + ")"]
          : [],
    };
  });
});

async function callGateway(path: string, body: unknown) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI provider is not configured.");
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    if (res.status === 429) throw new Error("AI service is rate limited. Try again shortly.");
    if (res.status === 401 || res.status === 403) throw new Error("AI provider credentials are not valid.");
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

const RunInput = z.object({
  capability: z.string(),
  prompt: z.string().min(1).max(4000),
  projectId: z.string().uuid().nullable().optional(),
  context: z.string().max(4000).optional(),
});

/**
 * Runs a real AI capability. Creates a persisted job row, calls the configured
 * provider and stores the real result — or a real error. Never fabricates output.
 */
export const runAiCapability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }): Promise<AiResult<{ jobId: string; text?: string; imageUrl?: string }>> => {
    const capability = data.capability as AiCapability;
    if (!(capability in CAPABILITY_FLAG)) {
      return { ok: false, code: "INVALID_INPUT", message: `Unknown AI capability: ${data.capability}` };
    }

    const provider = providerFor(capability);
    if (!provider) {
      return {
        ok: false,
        code: "NOT_CONFIGURED",
        message: `${capability} has no AI provider configured yet. Set a provider key and ${CAPABILITY_FLAG[capability]}=true.`,
      };
    }
    if (!flagEnabled(capability)) {
      return { ok: false, code: "DISABLED", message: `${CAPABILITY_FLAG[capability]} is turned off.` };
    }

    const { data: job, error: jobError } = await context.supabase
      .from("ai_jobs")
      .insert({
        user_id: context.userId,
        project_id: data.projectId ?? null,
        type: capability,
        status: "PROCESSING",
        input: { prompt: data.prompt, context: data.context ?? null },
      })
      .select("id")
      .single();
    if (jobError || !job) {
      return { ok: false, code: "PROVIDER_ERROR", message: jobError?.message ?? "Could not create the AI job." };
    }

    try {
      if (capability === "generateImage") {
        const result = await callGateway("/images/generations", {
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: [{ type: "text", text: data.prompt }] }],
          modalities: ["image", "text"],
        });
        const choices = (result["choices"] ?? []) as Array<Record<string, any>>;
        const image =
          choices[0]?.["message"]?.["images"]?.[0]?.["image_url"]?.["url"] ??
          (result["data"] as any)?.[0]?.["b64_json"];
        if (!image) throw new Error("The AI provider returned no image.");
        const imageUrl = String(image).startsWith("data:") || String(image).startsWith("http")
          ? String(image)
          : `data:image/png;base64,${image}`;
        await context.supabase
          .from("ai_jobs")
          .update({ status: "COMPLETED", progress: 100, output: { imageUrl } })
          .eq("id", job.id);
        return { ok: true, data: { jobId: job.id, imageUrl } };
      }

      const result = await callGateway("/chat/completions", {
        model: TEXT_MODEL,
        messages: [
          { role: "system", content: "You are the AI assistant of ZAVITA, a mobile video creation studio. Be concise and concrete." },
          { role: "user", content: data.context ? `${data.prompt}\n\nContext:\n${data.context}` : data.prompt },
        ],
      });
      const text = (result["choices"] as Array<Record<string, any>> | undefined)?.[0]?.["message"]?.["content"];
      if (!text) throw new Error("The AI provider returned no content.");
      await context.supabase
        .from("ai_jobs")
        .update({ status: "COMPLETED", progress: 100, output: { text } })
        .eq("id", job.id);
      return { ok: true, data: { jobId: job.id, text: String(text) } };
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI generation failed.";
      await context.supabase.from("ai_jobs").update({ status: "FAILED", error: message }).eq("id", job.id);
      return { ok: false, code: "PROVIDER_ERROR", message };
    }
  });
