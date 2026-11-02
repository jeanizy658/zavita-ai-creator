import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { videoInput, videoRequest, videoHttpRetryable, type VideoInput } from "./video-settings";
type Client = SupabaseClient<Database>;
type Job = Database["public"]["Tables"]["video_jobs"]["Row"];
type ProviderJob = { id: string; status: string; progress?: number; error?: { code?: string; message?: string } };
const base = "https://ai.gateway.lovable.dev/v1/videos";
function check(error: { message: string } | null) { if (error) throw new Error(error.message); }
class GatewayError extends Error {
  constructor(public status: number, message: string, public type: string, public delay: number) { super(message); }
}
async function gateway(path: string, body?: unknown): Promise<Response> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(401, "Video generation is not configured.", "configuration", 0);
  const res = await fetch(base + path, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!res.ok) {
    const e = await res.json().catch(() => ({})) as { message?: string; type?: string };
    throw new GatewayError(res.status, e.message ?? `Video service returned ${res.status}.`, e.type ?? "", Math.max(10, Number(res.headers.get("Retry-After")) || 30));
  }
  return res;
}
async function adminClient() { return (await import("@/integrations/supabase/client.server")).supabaseAdmin; }
async function patch(admin: Client, id: string, values: Database["public"]["Tables"]["video_jobs"]["Update"]) {
  check((await admin.from("video_jobs").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id)).error);
}
async function release(admin: Client, id: string) { check((await admin.from("video_gateway_state").update({ active_job: null }).eq("id", true).eq("active_job", id)).error); }
async function gatewayFailure(admin: Client, job: Job, error: unknown, creating: boolean) {
  const e = error instanceof Error ? error : new Error("Video service could not be reached.");
  if (e instanceof GatewayError) {
    if ([402,403,404].includes(e.status)) check((await admin.from("video_gateway_state").update({ blocked_status: e.status, blocked_message: e.message, blocked_type: e.type }).eq("id", true)).error);
    if (videoHttpRetryable(e.status)) {
      await patch(admin, job.id, { state: creating ? "QUEUED" : job.state, error: e.message, retry_after: new Date(Date.now() + e.delay * 1000).toISOString() });
      if (creating) await release(admin, job.id);
      return;
    }
    await patch(admin, job.id, { state: "FAILED", error: e.message }); await release(admin, job.id); return;
  }
  // An ambiguous create must never be repeated: it may already have been billed.
  await patch(admin, job.id, { state: creating ? "FAILED" : job.state, error: creating ? "Submission could not be confirmed. No automatic resubmission was made." : e.message });
  if (creating) await release(admin, job.id);
}
export async function enqueueVideo(client: Client, userId: string, id: string, settings: VideoInput) {
  if (process.env["AI_VIDEO_ENABLED"] === "false") throw new Error("Video generation is disabled.");
  if (!process.env["LOVABLE_API_KEY"]) throw new Error("Video generation requires configuration.");
  if (settings.projectId) { const q = await client.from("projects").select("id").eq("id", settings.projectId).single(); check(q.error); }
  if (settings.sourceAssetId) { const q = await client.from("assets").select("mime_type,size").eq("id", settings.sourceAssetId).single(); check(q.error); if (!q.data || !["image/png","image/jpeg","image/webp"].includes(q.data.mime_type ?? "") || (q.data.size ?? 0) > 10*1024*1024) throw new Error("Select a PNG, JPEG or WebP image under 10 MB."); }
  const admin = await adminClient();
  const existing = await client.from("video_jobs").select("*").eq("id",id).maybeSingle(); check(existing.error);
  if (existing.data) return existing.data;
  const state = await admin.from("video_gateway_state").select("*").eq("id",true).maybeSingle(); check(state.error);
  if (state.data?.blocked_status) throw new Error(state.data.blocked_message ?? "Video service is paused.");
  const q = await admin.from("video_jobs").insert({ id, user_id:userId, project_id:settings.projectId, request:settings }).select("*").single(); check(q.error); if (!q.data) throw new Error("Request could not be saved.");
  return q.data;
}
async function processJob(client: Client, admin: Client, job: Job) {
  if (job.retry_after && Date.parse(job.retry_after) > Date.now()) return;
  if (job.state === "QUEUED") {
    const claimed = await admin.rpc("claim_video_job", { job_id:job.id }); check(claimed.error); if (!claimed.data) return;
    try {
      const settings = videoInput.parse(job.request); let image: { data:string; mime_type:string } | undefined;
      if (settings.mode === "image" && settings.sourceAssetId) {
        const q = await client.from("assets").select("*").eq("id",settings.sourceAssetId).single(); check(q.error); if (!q.data?.storage_path) throw new Error("Source image unavailable.");
        const file = await client.storage.from("media").download(q.data.storage_path); check(file.error); if (!file.data || file.data.size > 10*1024*1024) throw new Error("Source image exceeds 10 MB.");
        const { Buffer } = await import("node:buffer"); image = { data:Buffer.from(await file.data.arrayBuffer()).toString("base64"), mime_type:q.data.mime_type ?? "image/png" };
      }
      const p = await (await gateway("", videoRequest(settings,image))).json() as ProviderJob;
      if (!p.id) throw new Error("Provider did not return a video job ID.");
      await patch(admin,job.id,{ provider_id:p.id, provider_status:p.status, state:"GENERATING", error:null, retry_after:null });
    } catch(e) { await gatewayFailure(admin,job,e,true); }
    return;
  }
  if (!job.provider_id || !["GENERATING","SAVING"].includes(job.state)) return;
  let provider: ProviderJob;
  try { provider = await (await gateway(`/${encodeURIComponent(job.provider_id)}`)).json() as ProviderJob; }
  catch(e) { await gatewayFailure(admin,job,e,false); return; }
  if (provider.status === "failed") { await patch(admin,job.id,{ state:"FAILED",provider_status:"failed",error:provider.error?.message ?? "Video generation failed." }); await release(admin,job.id); return; }
  if (provider.status !== "completed") { await patch(admin,job.id,{ provider_status:provider.status,progress:typeof provider.progress === "number" ? provider.progress : null,error:null,retry_after:null }); return; }
  await patch(admin,job.id,{state:"SAVING",provider_status:"completed",retry_after:null});
  try {
    let asset = (await client.from("assets").select("*").eq("id",job.id).maybeSingle()).data;
    if (!asset) {
      const response = await gateway(`/${encodeURIComponent(job.provider_id)}/content`);
      const blob = await response.blob();
      if (blob.size < 12 || blob.size > 120*1024*1024) throw new Error("Generated video exceeds the supported storage size.");
      const signature = new Uint8Array(await blob.slice(4,8).arrayBuffer());
      if (String.fromCharCode(...signature) !== "ftyp") throw new Error("Provider returned an invalid MP4 file.");
      const path = `${job.user_id}/generated-video/${job.id}.mp4`;
      check((await client.storage.from("media").upload(path,blob,{contentType:"video/mp4",upsert:true})).error);
      const q = await client.from("assets").upsert({ id:job.id,user_id:job.user_id,project_id:job.project_id,type:"AI_VIDEO",name:`AI-video-${job.id}.mp4`,storage_path:path,mime_type:"video/mp4",size:blob.size,metadata:{ providerId:job.provider_id,settings:job.request } }).select("*").single(); check(q.error); asset=q.data;
    }
    if (!asset) throw new Error("Video metadata could not be saved.");
    await patch(admin,job.id,{state:"COMPLETED",asset_id:asset.id,error:null}); await release(admin,job.id);
  } catch(e) {
    if(e instanceof GatewayError && [402,403,404].includes(e.status)) { await gatewayFailure(admin,job,e,false); return; }
    await patch(admin,job.id,{state:"SAVING",error:`Video generated; saving failed: ${e instanceof Error ? e.message : "storage unavailable"}`,retry_after:new Date(Date.now()+30000).toISOString()});
  }
}
export async function syncVideoQueue(client: Client,userId:string) {
  const admin = await adminClient();
  const block = await admin.from("video_gateway_state").select("*").eq("id",true).maybeSingle(); check(block.error);
  if (!block.data?.blocked_status && process.env["AI_VIDEO_ENABLED"] !== "false") {
    const q = await client.from("video_jobs").select("*").eq("user_id",userId).in("state",["QUEUED","GENERATING","SAVING"]).order("created_at"); check(q.error);
    // Existing provider work always finishes before the next queued request starts.
    const active = q.data?.find(j => j.provider_id) ?? q.data?.[0]; if(active) await processJob(client,admin,active);
  }
  const jobs=await client.from("video_jobs").select("*").order("created_at",{ascending:false}).limit(50); check(jobs.error);
  return { jobs:jobs.data ?? [], blocked:block.data?.blocked_message ?? null };
}
export async function resumeVideo(userId:string) {
  const admin=await adminClient();
  const state=await admin.from("video_gateway_state").select("*").eq("id",true).maybeSingle(); check(state.error);
  if(!state.data?.blocked_status) return;
  // Only the owner of the blocked request may explicitly resume a spending/policy pause.
  if(state.data.blocked_status !== 402 && !(state.data.blocked_status === 403 && ["credit_limit_reached","ai_disabled"].includes(state.data.blocked_type ?? ""))) throw new Error(state.data.blocked_message ?? "Restore video service access before starting a fresh request.");
  const owner=await admin.from("video_jobs").select("id").eq("user_id",userId).eq("error",state.data.blocked_message ?? "").limit(1); check(owner.error);
  if(!owner.data?.length) throw new Error("The owner of the paused request must resume generation.");
  check((await admin.from("video_gateway_state").update({blocked_status:null,blocked_message:null,blocked_type:null}).eq("id",true)).error);
}